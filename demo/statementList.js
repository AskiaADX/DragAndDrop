(function ($) {
	"use strict";

	/**
	* Extend the jQuery with the method adcStatementList
	* Should be call on the container of the statement list
	* 
	*     // Single closed question
	*     $('#adc_1').adcStatementList({
	*         iterations : [
	*           { id : 'U1', caption : "Iteration 1" },
	*           { id : 'U3', caption : "Iteration 2" },
	*           { id : 'U5', caption : "Iteration 3" }
	*         ]
	*     });
	*
	*     // Multi-coded question
	*     $('#adc_1').adcStatementList({
	*         isMultiple : true,
	*         iterations : [
	*           { id : 'L1', caption : "Iteration 1" },
	*           { id : 'L3', caption : "Iteration 2" },
	*           { id : 'L5', caption : "Iteration 3" }
	*         ]
	*     });
	*
	* @param {Object} options Statements list parameters
	* @param {Array}  options.iterations Array which contains the definition of iterations
	* @param {String} options.iterations[].id Id or name of the input which contains the value of the current iteration
	* @param {String} options.iterations[].caption Caption of the current iteration
	* @param {Boolean} [options.isMultiple] Indicates if the question is multiple
	* @return {jQuery} Returns the current instance of the root container for the call chains
	*/
	$.fn.adcStatementList = function adcStatementList(options) {
		// Verify if the options are correct
		// Require key:iterations (array)
		if (!options || !options.iterations || !options.iterations.length) {
			throw new Error('adcStatementList expect an option argument with an array of iterations');
		}

		// Global variables
		var $container = $(this),
			currentIteration = 0,
            iterations = options.iterations,
            isMultiple = options.isMultiple,
            initialWidth = $container.find('.statement').width();


		// For multi-coded question
		// Add the @valueToAdd in @currentValue (without duplicate)
		// and return the new value
		function addValue(currentValue, valueToAdd) {
			if (currentValue == '') {
				return valueToAdd;
			}

			var arr = currentValue.split(','), i, l, wasFound = false;

			for (i = 0, l = arr.length; i < l; i += 1) {
				if (arr[i] == valueToAdd) {
					wasFound = true;
					break;
				}
			}

			if (!wasFound) {
				currentValue += ',' + valueToAdd;
			}
			return currentValue;
		}

		// For multi-coded question
		// Remove the @valueToRemove from the @currentValue
		// and return the new value
		function removeValue(currentValue, valueToRemove) {
			if (currentValue === '') {
				return currentValue;
			}
			var arr = currentValue.split(','),
                        i, l,
                        newArray = [];
			for (i = 0, l = arr.length; i < l; i += 1) {
				if (arr[i] != valueToRemove) {
					newArray.push(arr[i]);
				}
			}
			currentValue = newArray.join(',');
			return currentValue;
		}

		// Select a statement for single
		// @this = target node
		function selectStatementSingle() {

			var $input = $('#' + iterations[currentIteration].id),
                       $target = $(this),
                       value = $target.attr('data-value');

			$container.find('.selected').removeClass('selected');
			$target.addClass('selected');
			$input.val(value);

			nextIeration();
		}

		// Select a statement for multiple
		// @this = target node
		function selectStatementMulitple() {
			var $input = $('#' + iterations[currentIteration].id),
                       $target = $(this),
                       value = $target.attr('data-value'),
                       isExclusive = $target.hasClass('exclusive'),
                       currentValue = $input.val();

			if ($target.hasClass('selected')) {
				// Un-select

				$target.removeClass('selected');
				currentValue = removeValue(currentValue, value);
			} else {

				// Select

				if (!isExclusive) {
					currentValue = addValue(currentValue, value);

					// Un-select all exclusives
					$container.find('.exclusive').each(function forEachExclusives() {
						$(this).removeClass('selected');
						currentValue = removeValue(currentValue, $(this).attr('data-value'));
					});

				} else {

					// When exclusive un-select all others
					$container.find('.selected').removeClass('selected');
					currentValue = value;

				}
				$target.addClass('selected');
			}

			// Update the value
			$input.val(currentValue);
		}

		// Returns the width of the statement
		// according if the iteration is the first or the last
		function getStatementWidth() {
			var width = initialWidth;
			if (currentIteration > 0 && iterations.length > 0) {
				width -= $container.find('.previousStatement').width();
			}
			if (currentIteration < (iterations.length - 1)) {
				width -= $container.find('.nextStatement').width();
			}
			return width;
		}

		// Update the navigation
		// Hide or display the button 
		// if the iteration is the first or last
		function updateNavigation() {
			if (currentIteration > 0 && iterations.length > 0) {
				$container.find('.previousStatement').show(500);
			} else {
				$container.find('.previousStatement').hide(500);
			}
			if (currentIteration < (iterations.length - 1)) {
				$container.find('.nextStatement').show(500);
			} else {
				$container.find('.nextStatement').hide(500);
			}
		}

		// Go to the previous loop iteration
		function previousIteration() {
			if (currentIteration <= 0) {
				return;
			}
			currentIteration--;

			var width = getStatementWidth(),
                       css = {
                       	opacity: 0,
                       	left: '+=' + width,
                       	width: width
                       };
			updateNavigation();
			$('.statement').animate(css, 500, onAnimationComplete);
		}

		// Go to the next loop iteration
		function nextIeration() {
			if (currentIteration >= (iterations.length - 1)) {
				return;
			}
			currentIteration++;

			var width = getStatementWidth(),
                       css = {
                       	opacity: 0,
                       	left: '+=' + width,
                       	width: width
                       };
			updateNavigation();
			$('.statement').animate(css, 500, onAnimationComplete);
		}

		// After the previous/next animation
		function onAnimationComplete() {
			displayIteration();
			var width = getStatementWidth(),
                        css = {
                        	opacity: 1,
                        	left: '-=' + width,
                        	width: width
                        };

			$container.find('.statement').animate(css, 500);
		}


		// Display the right loop caption and the right responses
		function displayIteration() {
			// Display the info of the current loop iteration
			$container.find('.statement_text').html(iterations[currentIteration].caption);

			var currentValues = $('#' + iterations[currentIteration].id).val().split(',');
			$container.find('.responseItem').each(function () {
				var value = $(this).attr('data-value'),
                           isSelected = (currentValues.indexOf(value) != -1);
				if (isSelected) {
					$(this).addClass('selected');
				} else {
					$(this).removeClass('selected');
				}
			});
		}

		// Attach all events
		$container
                    .delegate('.responseItem', 'click', (!isMultiple) ? selectStatementSingle : selectStatementMulitple)
                    .delegate('.previousStatement', 'click', previousIteration)
                    .delegate('.nextStatement', 'click', nextIeration);

		// Refresh the current status on load 
		// (iteration = 0)
		$container.find('.previousStatement').hide();
		$container.find('.statement').width(getStatementWidth());
		displayIteration();

		// Returns the container
		return this;
	};

} (jQuery));