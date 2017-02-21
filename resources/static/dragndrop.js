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
	$.fn.adcDragndrop = function adcDragndrop(options) {
		// Verify if the options are correct
		// Require key:iterations (array)
		if (!options || !options.iterations || !options.iterations.length) {
			throw new Error('adcStatementList expect an option argument with an array of iterations');
		}
		
		(options.autoForward = Boolean(options.autoForward) || false);
		(options.useRange = Boolean(options.useRange));
		(options.imageAlign = options.imageAlign || 'left');
		(options.scaleOnTarget = options.scaleOnTarget || 0.5);
				
		// Delegate .transition() calls to .animate() if the browser can't do CSS transitions.
		if (!$.support.transition) $.fn.transition = $.fn.animate;
				
		$(this).css({'max-width':options.maxWidth,'width':options.controlWidth});
		$(this).parents('.controlContainer').css({'width':'100%'});
		
		if ( options.controlAlign === "center" ) {
			$(this).parents('.controlContainer').css({'text-align':'center'});
			$(this).css({'margin':'0px auto'});
		} else if ( options.controlAlign === "right" ) {
			$(this).css({'margin':'0 0 0 auto'});
		}
		
		// IE8 and below fix
		if (!Array.prototype.indexOf) {
			
		  Array.prototype.indexOf = function(elt /*, from*/) {
			var len = this.length >>> 0;
		
			var from = Number(arguments[1]) || 0;
			from = (from < 0)
				 ? Math.ceil(from)
				 : Math.floor(from);
			if (from < 0)
			  from += len;
		
			for (; from < len; from++) {
			  if (from in this && this[from] === elt)
				return from;
			}
			return -1;
		  };
		}
		
		// Global variables
		var $container = $(this),
			currentIteration = 0,
            iterations = options.iterations,
			autoForward = options.autoForward,
			clickActive = null,
			autoImageSize = Boolean(options.autoImageSize),
			stackResponses = Boolean(options.stackResponses),
			valuesArray = [],
			exclusiveArray = String(options.exclusiveAreas).split(','),
			exclusiveAreas = false,
			selectNextResponse = Boolean(options.selectNextResponse),
			initZindex = 100,
			numberOfDropZones = $container.find('.dropZone').size(),
			removingItem = false,
			autoStackWidth = options.autoStackWidth,
			dragging = false,
			total_images = $container.find("img").length,
			images_loaded = 0,
			dropAreaPosition = options.dropAreaPosition,
			enableMobileFit = false;
		
		if ( autoStackWidth !== '' ) {
			if ( $(this).parents('.controlContainer').width() <= parseInt(autoStackWidth) ) {
				stackResponses = true,
				enableMobileFit = true;
			}
		}
				
		if ( enableMobileFit ) {
			if ( dropAreaPosition === 'left' || dropAreaPosition === 'right' ) {
				$('.dropContainer, .startArea').width('49%');
				$('.startArea').height($('.dropContainer').height());
			} else {
				$('.dropContainer, .startArea').width('100%');
			}
		}
			
		$container.find('.responseItem img').hide();
		
		if ( exclusiveArray[0] != null ) exclusiveAreas = true;
			
		$('.dropZone').each(function(index) { 
			if ( $(this).outerWidth(true) > $('.dropContainer').width() )
				$(this).width( $(this).width() - ($(this).outerWidth(true) - $('.dropContainer').outerWidth()) );
			// check if dropzone is exclusive
			for ( var i=0; i<exclusiveArray.length; i++ ) {
				if ( (exclusiveArray[i] >= 0 && exclusiveArray[i] == index) || ( exclusiveArray[i] < 0 && (index-numberOfDropZones) == exclusiveArray[i] ) ) $(this).data('exclusive',true);
			}
			valuesArray.push($(this).data('value'));
		});
		
		// Convert RGB to hex KEEP FOR TARGETS????
		function trim(arg) {
			return arg.replace(/^\s+|\s+$/g, "");
		}
		function isNumeric(arg) {
			return !isNaN(parseFloat(arg)) && isFinite(arg);
		}

		function isRgb(arg) {
			arg = trim(arg);
			return isNumeric(arg) && arg >= 0 && arg <= 255;
		}
		function rgbToHex(arg) {
			arg = parseInt(arg, 10).toString(16);
			return arg.length === 1 ? '0' + arg : arg; 
		}
		function processRgb(arg) {
			arg = arg.split(',');
	
			if ( (arg.length === 3 || arg.length === 4) && isRgb(arg[0]) && isRgb(arg[1]) && isRgb(arg[2]) ) {
				if (arg.length === 4 && !isNumeric(arg[3])) { return null; }
				return '#' + rgbToHex(arg[0]).toUpperCase() + rgbToHex(arg[1]).toUpperCase() + rgbToHex(arg[2]).toUpperCase();
			}
			else {
				return null;
			}
		}
		
		// Select a statement for single
		// @this = target node
		function selectStatementSingle() {
					
			// hide error
			$('.error, #error-summary').hide();
			
			// disable clicking during animation
			if ( autoForward ) $container.off('click', '.responseItem');
	
			var $input = $('#' + iterations[currentIteration].id),
				$target = $(this),
				value = $target.data('value');

			$container.find('.selected').removeClass('selected');
			$target.addClass('selected');
			$input.val(value);
			
			if ( $('#' + iterations[currentIteration].id).val() != '' ) $container.find('.nextStatement').show();
			if ( ($container.find('.nextStatement').css('display') === 'none' || $container.find('.nextStatement').size() === 0) || ( ($container.find('.nextStatement').css('display') != 'none' || $container.find('.nextStatement').size() > 0) && autoForward) ) nextIteration();
		}

		// Check for missing images and resize
		$container.find('.responseItem img').each(function forEachImage(index) {
			
			$(this).show();
			
			var size = {
				width: $(this).width(),
				height: $(this).height()
			};
			
			if (options.forceImageSize === "height" ) {
				if ( size.height > parseInt(options.maxImageHeight,10) ) {
					var ratio = ( parseInt(options.maxImageHeight,10) / size.height);
					size.height *= ratio,
					size.width  *= ratio;
				}
			} else if (options.forceImageSize === "width" ) {
				if ( size.width > parseInt(options.maxImageWidth,10) ) {
					var ratio = ( parseInt(options.maxImageWidth,10) / size.width);
					size.width  *= ratio,
					size.height *= ratio;
				}
				
			} else if (options.forceImageSize === "both" ) {
				if ( parseInt(options.maxImageHeight,10) > 0 && size.height > parseInt(options.maxImageHeight,10) ) {
					var ratio = ( parseInt(options.maxImageHeight,10) / size.height);
					size.height *= ratio,
					size.width  *= ratio;
				}
	
				if ( parseInt(options.maxImageWidth,10) > 0 && size.width > parseInt(options.maxImageWidth,10) ) {
					var ratio = ( parseInt(options.maxImageWidth,10) / size.width);
					size.width  *= ratio,
					size.height *= ratio;
				}

			} 
			
			$(this).css(size);
			$container.find('.dropZone').each(function() {
               $(this).find('.responseItemMini img').eq(index).css(size); 
            });
			
			if ( autoImageSize ) {
				
				var rHeight = $(this).parent('.responseItem').height() - $(this).parent('.responseItem').find('.reponse_text').outerHeight(),
					rWidth = $(this).parent('.responseItem').width(),
					iHeight = $(this).outerHeight(),
					iWidth = $(this).outerWidth(),
					diffX = iHeight - rHeight,
					diffY = iWidth - rWidth,
					size = {
						width: $(this).width(),
						height: $(this).height()
					};
					
				if ( diffX > 0 && diffX > diffY ) {
					
					var ratio = ( iWidth / rWidth );
					size.width  *= ratio,
					size.height *= ratio;
					
				} else if ( diffY > 0 && diffY > diffX ) {
					
					var ratio = ( iHeight / rHeight );
					size.height *= ratio,
					size.width  *= ratio;
					
				}
				
				$(this).css(size);
				$('.responseItemMini img').eq(index).css(size);
				

			}
		});
		
		$('.responseItem').each(function(index) { 
			if ( $(this).outerWidth(true) > $('.startArea').width() )
				$(this).width( $(this).width() - ($(this).outerWidth(true) - $('.startArea').outerWidth()) );
		});
		
		// add ns to last x items
		if ( options.numberNS > 0 ) $container.find('.responseItem').slice(-options.numberNS).addClass('ns');
		
		// Use range if on
		if ( options.useRange ) {
			var maxNumber = $container.find('.responseItem').size() - options.numberNS;
			var rangeArray = options.range.split(';');
			
			var rainbow1 = new Rainbow();
				rainbow1.setSpectrum(processRgb(rangeArray[0]), processRgb(rangeArray[2]));
				rainbow1.setNumberRange(0, maxNumber);
			var rainbow2 = new Rainbow();
				rainbow2.setSpectrum(processRgb(rangeArray[1]), processRgb(rangeArray[3]));
				rainbow2.setNumberRange(0, maxNumber);
			$container.find('.responseItem').slice(0,(options.numberNS > 0)?0-options.numberNS:$container.find('.responseItem').size()).each(function( index ) {

				if ( options.rangeGradientDirection == 'ltr' ) { 
					$(this).css({ 'background': '#'+rainbow1.colourAt(index) });
					$(this).css({ 'background': '-moz-linear-gradient(left,  #'+rainbow1.colourAt(index)+' 0%, #'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-webkit-gradient(linear, left top, right top, color-stop(0%,#'+rainbow1.colourAt(index)+'), color-stop(100%,#'+rainbow2.colourAt(index)+'))' });
					$(this).css({ 'background': '-webkit-linear-gradient(left, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-o-linear-gradient(left, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-ms-linear-gradient(left, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': 'linear-gradient(to right, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=#'+rainbow1.colourAt(index)+', endColorstr=#'+rainbow2.colourAt(index)+',GradientType=1 )' });
				} else {
					$(this).css({ 'background': '#'+rainbow1.colourAt(index) });
					$(this).css({ 'background': '-moz-linear-gradient(top,  #'+rainbow1.colourAt(index)+' 0%, #'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-webkit-gradient(linear, left top, left bottom, color-stop(0%,#'+rainbow1.colourAt(index)+'), color-stop(100%,#'+rainbow2.colourAt(index)+'))' });
					$(this).css({ 'background': '-webkit-linear-gradient(top, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-o-linear-gradient(top, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': '-ms-linear-gradient(top, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'background': 'linear-gradient(to bottom, #'+rainbow1.colourAt(index)+' 0%,#'+rainbow2.colourAt(index)+' 100%)' });
					$(this).css({ 'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr=#'+rainbow1.colourAt(index)+', endColorstr=#'+rainbow2.colourAt(index)+',GradientType=0 )' });
				}
				
			});
		}
		
		function sortItems(containerID) {
									
			if ( containerID >= 0 && $.isNumeric(containerID) ) {
			
				var counter = 0,
					target,
					x = 0,
					y = 0;

				layout(containerID);
				reorganise(containerID);
				
				$(".responseItem[data-value='" + containerID + "']").each(function(index, element) {
					target = $( "#drop"+containerID );
				}); 
				
			}
		}
		
		/* TAKEN FROM ACTIONSCRIPT */
		
		function layout(containerID) {
			
			// CALCULATE ROWS AND COLUMNS
			var possible_columns = 1,
				possible_rows = 1,
				total_available_card_slots = 1,
				current_card_height = $('.responseItem').eq(1).outerHeight(),
				current_card_width = $('.responseItem').eq(1).outerWidth(),
				currentTarget = $( "#drop"+containerID ),
				targetAreaPaddingX = currentTarget.outerWidth() - currentTarget.width(),
				targetAreaPaddingY = currentTarget.outerHeight() - currentTarget.height(),
				current_target_height = currentTarget.innerHeight() - currentTarget.find('.drop_text').outerHeight(true) - targetAreaPaddingY,
				current_target_width = currentTarget.innerWidth() - targetAreaPaddingX,
				test1 = 1,
				test2 = 1;
			
			$(".responseItem[data-value='" + containerID + "']").each(function(index, element) {
				if ( index >= total_available_card_slots ) {
					
					test1 = (current_target_height/(possible_rows+1))/(current_card_height);
					test2 = (current_target_width/(possible_columns+1))/(current_card_width);
		
					if ( test1 > test2 ) {
						possible_rows++;
						if (test1 < 1) {
							current_card_height *= test1;
							current_card_width *= test1;
						}
					} else {
						possible_columns++;
						if (test2 < 1) {
							current_card_width *= test2;
							current_card_height *= test2;
						}
					}
				}
				total_available_card_slots = possible_columns*possible_rows;
			});
			
			var placement = {
				rows: possible_rows,
				columns: possible_columns
			};
			return placement;
		}

		function reorganise(containerID) {
			
			var rows = 1,
				columns = 0,
				layoutArray = layout(containerID),
				rowsTotal = layoutArray.rows,
				columnsTotal = layoutArray.columns,
				currentTarget = $( "#drop"+containerID ),
				targetAreaPaddingX = ((currentTarget.innerWidth() - currentTarget.width())*0.5),
				targetAreaPaddingY = ((currentTarget.innerHeight() - currentTarget.height())*0.5),
				targetHeight = currentTarget.height() - currentTarget.find('.drop_text').outerHeight(true),
				targetWidth = currentTarget.width(),
				finalX,
				finalY,
				finalScaleX,
				finalScaleY;
												
			$(".responseItem[data-value='" + containerID + "']").each(function(index, element) {
								
				var cardToAdjust = $(this);
				
				if ( columns < columnsTotal ) columns++;
				else if ( rows < rowsTotal ) {
					rows++;
					columns = 1;
				}
				
				var row_height = targetHeight / rowsTotal,
					col_width = targetWidth / columnsTotal,
					startX = currentTarget.position().left,
					startY = currentTarget.position().top,
					dropLeftMargin = (currentTarget.outerWidth(true) - currentTarget.outerWidth())*0.5,
					dropTopMargin = (currentTarget.outerHeight(true) - currentTarget.outerHeight())*0.5;
								
				var xDiff = col_width/$(this).outerWidth(),
					yDiff = row_height/$(this).outerHeight();
		
				if ( xDiff > yDiff ) {
					finalScaleY = yDiff /** ( $(this).outerHeight() * 0.01 )*/,
					finalScaleX = finalScaleY;
				} else {
					finalScaleX = xDiff /** ( $(this).outerWidth() * 0.01 )*/,
					finalScaleY = finalScaleX;
				}
				
				var finalX = (startX + dropLeftMargin) - ($(this).outerWidth(true)*0.5) + targetAreaPaddingX + (col_width*columns) - (col_width*0.5),
					finalY = (startY + dropTopMargin) - ($(this).outerHeight(true)*0.5) + targetAreaPaddingY + (row_height*rows) - (row_height*0.5) + currentTarget.find('.drop_text').outerHeight(true);
					
				if ( options.controlAlign !== "left" ) {
					// works for everything?
					finalX += $container.offset().left - $('.startArea').offset().left;
					finalY += $container.offset().top - $('.startArea').offset().top;
				}
				
				// IF IE7/8
				if (!Modernizr.csstransforms) {
					
					$( this ).find('img')
						.width( $(this).data('oimgwidth') * finalScaleX )
						.height( $(this).data('oimgheight') * finalScaleY );
					$( this ).find('.response_text').css('font-size',parseInt( $(this).data('ofontsize') ) + 'px' );
					$(this).transition({ left: finalX, top: finalY }, options.animationSpeed);

				} else
					$(this).transition({ left: finalX, top: finalY, scale: finalScaleX }, options.animationSpeed);
				
			});
		
		}
		
		// Initialise droppable	
		$( ".dropZone" ).droppable({
			activate: function( event, ui ) { dragging = true },
			tolerance: "pointer",
			drop: function( event, ui ) {
				
				dragging = false;
				
				// check for exclusivity if there are exclusive areas /*/*
				// check if this is an exclusive droparea
				var areaExclusive = false,
					containerID = $(this).data('index');
				
				if ( exclusiveAreas ) {
					for ( var i=0; i<exclusiveArray.length; i++ ) {
						if ( (parseInt(exclusiveArray[i]) >= 0 && (parseInt(exclusiveArray[i]) - 1) === containerID) || 
							 ( parseInt(exclusiveArray[i]) < 0 && (parseInt(exclusiveArray[i]) + numberOfDropZones) === containerID) ) areaExclusive = true;
					}
				}
												
				// check if it already contains an item
				if ( areaExclusive && $(".responseItem[data-value='" + containerID + "']").size() > 0 ) {
				
					// Fail - revert to original position and reset value	
					$(ui.draggable).data({'ontarget':false}).attr({'data-value':''});
					$(ui.draggable).transition({ scale: 1, top:$(ui.draggable).data('top'), left:$(ui.draggable).data('left') }, options.animationSpeed);
					$('#' + iterations[$(ui.draggable).data('index')].id).val('');
				
				} else {
				
					// success carry on as normal
					// IF IE7/8
					if (!Modernizr.csstransforms) {
						/*--------------------- WRONG --------------------*/
						$( ui.draggable ).attr('data-value',$(this).data('index')).hide();
						var miniID = ".resMini" + $( ui.draggable ).data('index');
						$(this).find(miniID).show();
						$(this).find('.cross').css('display','none')
					}
										
					// Set value to card?
								/**/	
					$( ui.draggable )
						.css('margin','0')
						.transition({ scale: options.scaleOnTarget, 'z-index': 1 }, options.animationSpeed)
						.draggable({ 
							zIndex: 9999,
							start: function( event, ui ) {
	
								var containerID = $( ui.helper ).attr('data-value');
								$( ui.helper ).attr('data-value','').transition({ scale: 1},0);
								sortItems(containerID);
								
							}
						});
	
					$( ui.draggable ).attr('data-value',$(this).data('index'));
					//$('#' + iterations[$(ui.draggable).data('index')].id).attr('value',$(this).attr('data-value'));
					$('#' + iterations[$(ui.draggable).data('index')].id).val( String($(this).attr('data-value')));
                    if (window.askia) {
                        askia.triggerAnswer();
                    }
										
					$('.responseItem').each(function(index) { 
						$(this).removeClass('responseActive');
						$('.dropZone').unbind('mouseup');
					});
						
					$('html').off("mousemove");
					sortItems( $(this).data('index') );
				}
			},
			over: function( event, ui ) {

			},
			out: function( event, ui ) {
				
			}
			
		});
		
		$( ".startArea" ).droppable({
			activate: function( event, ui ) { dragging = true },
			tolerance: "pointer",
			drop: function( event, ui ) {
				
				dragging = false;
					
				$( ui.draggable )
					.css('margin',$(ui.draggable).data('omargin'))
					.draggable({
						revert:'invalid'
					})
					.animate({ top:$(ui.draggable).data('top'), left:$(ui.draggable).data('left') }, options.animationSpeed)
					.transition({ scale: 1 }, options.animationSpeed)
					.attr('data-value','');
				
				$('#' + iterations[$(ui.draggable).data('index')].id).val('');
                if (window.askia) {
                    askia.triggerAnswer();
                }
			}
		}).height( $('.startArea').outerHeight() );
		
		//if ( !stackResponses ) {
		for ( var i=($('.responseItem').size()-1); i>=0; i-- ) {
		
			var offset = $('.responseItem').eq(i).offset();
			$('.responseItem').eq(i).css("position", "absolute");
			$('.responseItem').eq(i).offset(offset);
				
		}
		if ( stackResponses ) {
			
			for ( var i=($('.responseItem').size()-1); i>=0; i-- ) {

		
				var offset = $('.responseItem').eq(0).offset();
				$('.responseItem').eq(i).css("position", "absolute");
				$('.responseItem').eq(i).offset(offset);
				//$('.responseItem').eq(i).css('margin','auto');
			}
			
			var maxHeight = 0;

			$(".responseItem").each(function(){
			   if ($(this).outerHeight(true) > maxHeight) { maxHeight = $(this).outerHeight(true); }
			});
									
			$('.startArea').height( maxHeight );
			
		}
		
		// Activate items
		$('.responseItem').each(function(index) { 
			initZindex--;	
			// if value is set then move item;
			var container = $(this).parent('.adc-dragndrop'),
				val = $('#' + iterations[$(this).data('index')].id).val() == '' ? '' : $.inArray( parseInt($('#' + iterations[$(this).data('index')].id).val()), valuesArray ),
				maxItemScale = options.scaleOnTarget,
				newItemScale = 0;
			
			$(this).data({
				'left':$(this).position().left, // REMOVE TOP AND LEFT DATA
				'top':$(this).position().top,
				'ontarget':false,
				'ofontsize':$(this).find('.response_text').css('font-size'),
				'owidth':$(this).outerWidth(),
				'oheight':$(this).outerHeight(),
				'omargin':$(this).css('margin')
			}).attr('data-value','');
								
			// Check if response already has a value
			if ( parseInt(val) >= 0 ) {
				
				$(this).draggable({ 
					revert: 'invalid', 
					zIndex: 2700, 
					cursorAt: { 
						top:$(this).height()/2, 
						left:$(this).width()/2 
					}
				}).bind('mouseup', function (event) {
					noDrag(event.target);	
				}).css('margin','0');
								
				// IF IE7/8
				if (!Modernizr.csstransforms) {
					
					$(this).attr({'data-value':val}).hide();
					$('#drop'+val).find('.resMini'+$(this).data('index')).show();
					
				} else {
					
					var maxItemScale = options.scaleOnTarget,
						x = $( "#drop"+val ).position().left - $(this).width()*0.5 + ($( "#drop"+val ).outerWidth()*0.5),
						y = $( "#drop"+val ).position().top - $(this).height()*0.5 + ($( "#drop"+val ).outerHeight()*0.5);
								
					$(this).data({'ontarget':true}).attr({'data-value':val});
					$(this).transition({ /*scale: .5,*/ top:y, left:x }, options.animationSpeed,function() {
						sortItems(parseInt(val));
					})
					
				}
												
			} else {
				// Initialise draggables
				$(this).draggable({ 
					revert: 'invalid', 
					zIndex: 2700, 
					cursorAt: { 
						top:$(this).height()/2, 
						left:$(this).width()/2 
					}
				}).bind('mouseup', function (event) {
					noDrag(event.target);	
				});
			}
			
			$(this).css('z-index',initZindex);
			
		});
		
		function offTarget(target) {
			if ($(target).attr('data-value') == '' ) {
				$(target).data({'ontarget':false}).attr({'data-value':''});
				$(target).transition({ scale: 1, top:$(target).data('top'), left:$(target).data('left') }, options.animationSpeed);
				$('#' + iterations[$(target).data('index')].id).val('');
			}
		}
	
		function noDrag(target) {
							
			if ( !dragging ) {
			
				if ( !$(target).hasClass('responseItem') ) target = $(target).parent('.responseItem');
				if ( $(target).hasClass('responseActive') ) {
					clickActive = null;
					$(target).removeClass('responseActive');
					//$('.gridInner').unbind('click');
				} else {
					// deselect all others
					$('.responseItem').each(function(index) { 
						$('#res'+$(this).data('index')).removeClass('responseActive');
					});
					
					clickActive = $(target);
					$(target).addClass('responseActive');
					
					$('.dropZone, .startArea').unbind();
		
					$('.dropZone').bind('mouseup', function (e) {
						setTarget(e, $(this).data('index'));	
					});
					$('.startArea').bind('mouseup', function (e) {
						setTarget(e, 'start');	
					});
				}
				
			}
			
		}
		
		function noDragHover(target) {
			
			if ( $(target).hasClass('responseItem') );
			else target = $(target).parent('.responseItem');
						
			// deselect all others
			$('.responseItem').each(function(index) { 
				$('#res'+$(this).data('index')).removeClass('responseActive');
			});
			
			clickActive = $(target);
			$(target).addClass('responseActive');

			$('.dropZone, .startArea').unbind();

			$('.dropZone').bind('mouseup', function (e) {
				setTarget(e, $(this).data('index'));	
			});
			$('.startArea').bind('mouseup', function (e) {
				setTarget(e, 'start');	
			});
			
		}
		
		function setTarget(e, destination ) {
						
			var target = $(e.target);
			if ( $(e.target).hasClass("drop_text") ) target = $(e.target).parent();
												
			if ( !removingItem ) {
				if ( destination === 'start' && target.hasClass('startArea') ) {
					
					if ( $(clickActive).data('index') != null ) {
						$(clickActive).data({'ontarget':false}).attr({'data-value':''}).css('margin',$(clickActive).data('omargin'));
						$(clickActive).transition({ scale: 1, top:$(clickActive).data('top'), left:$(clickActive).data('left') }, options.animationSpeed);
						$('#' + iterations[$(clickActive).data('index')].id).val('');
                        if (window.askia) {
                            askia.triggerAnswer();
                        }
					}
					
				} else if ( destination !== 'start' ) {
															
					// Turn off margin to fix centering
					$(clickActive).css('margin','0');
					
					// check for exclusivity if there are exclusive areas /*/*
					// check if this is an exclusive droparea
					var areaExclusive = false,
						containerID = $( "#drop" + destination ).data('index');
					
					if ( exclusiveAreas ) {
						for ( var i=0; i<exclusiveArray.length; i++ ) {
							if ( (parseInt(exclusiveArray[i]) >= 0 && (parseInt(exclusiveArray[i]) - 1) === containerID) || 
								 ( parseInt(exclusiveArray[i]) < 0 && (parseInt(exclusiveArray[i]) + numberOfDropZones) === containerID) ) areaExclusive = true;
						}
					}
					
					if ( $(clickActive).size() > 0 ) $('#' + iterations[$(clickActive).data('index')].id).attr('value',target.attr('data-value')).val( target.attr('data-value') );

										
					// check if it already contains an item
					if ( !(areaExclusive && $(".responseItem[data-value='" + containerID + "']").size() > 0) ) {
												
						if ( $(clickActive).data('ontarget') ) { // if already on target
													
							var val = destination,
								maxItemScale = options.scaleOnTarget,
								x = $( "#drop"+val ).position().left - $(clickActive).outerWidth(true)*0.5 + ($( "#drop"+val ).outerWidth(true)*0.5),
								y = $( "#drop"+val ).position().top - $(clickActive).outerHeight(true)*0.5 + ($( "#drop"+val ).outerHeight(true)*0.5);
										
							$(clickActive).data({'ontarget':true}).attr({'data-value':val});
							$(clickActive).transition({/* scale: .5, */top:y, left:x }, options.animationSpeed,function() {
								sortItems(parseInt(val));
							})
							
						} else if ($(clickActive).data('index') != null) {
																					
							// IF IE7/8
							if (!Modernizr.csstransforms) {
								
								var val = destination;
								
								$(clickActive).attr({'data-value':val}).hide();
								$('#drop'+val).find('.resMini'+$(clickActive).data('index')).show();
								clickActive = '';
								
							} else {
								
								var val = destination,
									maxItemScale = options.scaleOnTarget,
									x = $( "#drop"+val ).position().left - $(clickActive).outerWidth(true)*0.5 + ($( "#drop"+val ).outerWidth(true)*0.5),
									y = $( "#drop"+val ).position().top - $(clickActive).outerHeight(true)*0.5 + ($( "#drop"+val ).outerHeight(true)*0.5);
											
								$(clickActive).data({'ontarget':true}).attr({'data-value':val});
								$(clickActive).transition({ /*scale: .5,*/ top:y, left:x }, options.animationSpeed,function() {
									sortItems(parseInt(val));
								})
								
							}
							
						}
						
						// Remove active status from item
						$(clickActive).removeClass('responseActive');
						clickActive = null;
						$('.dropZone, .startArea').unbind();
						
						// Select next reponse
						if ( selectNextResponse ) {
							noDrag($(".responseItem[data-value='']").eq(0));	
						}
						
					}
                    if (window.askia) {
                        askia.triggerAnswer();
                    }
				}
			}
		}
		
		function mouseEnd(id) { // mouseEnd is called when the mouse leaves the nav slider
		
		}
		
		if ( options.animate ) {
			var delay = 0,
				easing = (!$.support.transition)?'swing':'snap';
			
			$container.find('.responseItem').each(function forEachItem() {
				$container.css({ y: 200, opacity: 0 }).transition({ y: 0, opacity: 1, delay: delay }, options.animationSpeed, easing);
				delay += 30;
			});
		}
		
		//Hide all drop area items for ie7/8
		
		function maxLayout() {
			// CALCULATE ROWS AND COLUMNS
			var possible_columns = 1,
				possible_rows = 1,
				total_available_card_slots = 1,
				current_card_height = $('.responseItemMini').eq(1).outerHeight(),
				current_card_width = $('.responseItemMini').eq(1).outerWidth(),
				currentTarget = $( "#drop0" ),
				targetAreaPaddingX = currentTarget.outerWidth() - currentTarget.width(),
				targetAreaPaddingY = currentTarget.outerHeight() - currentTarget.height(),
				current_target_height = currentTarget.innerHeight() - currentTarget.find('.drop_text').outerHeight(true) - targetAreaPaddingY,
				current_target_width = currentTarget.innerWidth() - targetAreaPaddingX,
				test1 = 1,
				test2 = 1;
							
			$container.find(".responseItemMini").each(function(index, element) {
				if ( index >= total_available_card_slots ) {
					
					test1 = (current_target_height/(possible_rows+1))/(current_card_height);
					test2 = (current_target_width/(possible_columns+1))/(current_card_width);
		
					if ( test1 > test2 ) {
						possible_rows++;
						if (test1 < 1) {
							current_card_height *= test1;
							current_card_width *= test1;
						}
					} else {
						possible_columns++;
						if (test2 < 1) {
							current_card_width *= test2;
							current_card_height *= test2;
						}
					}
				}
				total_available_card_slots = possible_columns*possible_rows;
			})
			
			var placement = {
				rows: possible_rows,
				columns: possible_columns
			};
			return placement;	
		}
		
		/*$('.responseItemMini').each(function(index) {
			
			// figure out max items per row
			var layoutArray = maxLayout(),
				rowsTotal = layoutArray.rows,
				columnsTotal = layoutArray.columns,
				maxHeight = ($('#drop0').height() - $('#drop0').find('.drop_text').outerHeight())/rowsTotal,
				maxWidth = ($('#drop0').width() / columnsTotal)-2,
				ratio = maxWidth/ $container.find('.responseItem').eq(0).data('owidth'),
				newImgPadding = Math.round((($(this).find('img').innerWidth() - $(this).find('img').width()) * ratio)*0.5),
				newHeight = ($(this).height() * ratio),
				newImgHeight = ($container.find('.responseItem img').eq(index).height() * ratio),
				newImgWidth = ($container.find('.responseItem img').eq(index).width() * ratio),
				newFontSize = Math.round( parseInt( $container.find('.responseItem .response_text').css('font-size') ) * ratio ),
				newPadding = Math.round((($(this).innerWidth() - $(this).width()) * ratio)*0.5),
				
				newTextPadding = Math.round((($(this).find('.response_text').innerWidth() - $(this).find('.response_text').width()) * ratio)*0.5);
								
			$(this).find('img').width( newImgWidth ).height( newImgHeight ).css('padding',newImgPadding + 'px');
			$(this).find('.response_text').css({'font-size':newFontSize + 'px','padding':newTextPadding + 'px'});
			$(this).css({'padding':newPadding + 'px', 'margin':'0px', 'border-radius':'2px'}).width( Math.floor(maxWidth) ).height( Math.floor(newHeight) );
		});*/
		
		$('.responseItem').each(function(index) {
			
			
			/***/
			// figure out max items per row
			var layoutArray = maxLayout(),
				rowsTotal = layoutArray.rows,
				columnsTotal = layoutArray.columns,
				maxHeight = (($('#drop0').height() - $('#drop0').find('.drop_text').outerHeight())/rowsTotal)-2,
				maxWidth = ($('#drop0').width() / columnsTotal)-2,
				numberOfDropZones = $(this).find('.dropZone').length,
				ratio = maxWidth/ $(this).width(),
				newImgPadding = Math.floor((($(this).find('img').innerWidth() - $(this).find('img').width()) * ratio)*0.5),
				newHeight = ($(this).height() * ratio),
				newImgHeight = ($(this).find('img').height() * ratio),
				newImgWidth = Math.floor($(this).find('img').width() * ratio),
				newFontSize = Math.round( parseInt( $(this).find('.response_text').css('font-size') ) * ratio ),
				newPadding = Math.round((($(this).innerWidth() - $(this).width()) * ratio)*0.5),
				newTextPadding = Math.round((($(this).find('.response_text').innerWidth() - $(this).find('.response_text').width()) * ratio)*0.5),
				currentMini = index;
				
			
				
			$('.dropZone').each( function(index) {
				$(this).find('.responseItemMini').eq(currentMini).find('img').css('width', newImgWidth + 'px' ).height( "auto" ).css('padding', newImgPadding + 'px');
				$(this).find('.responseItemMini').eq(currentMini).find('.response_text').css({'font-size':newFontSize + 'px','padding':newTextPadding + 'px'});
				$(this).find('.responseItemMini').eq(currentMini).css({'padding':newPadding + 'px', 'margin':'0px', 'border-radius':'2px'}).width( Math.floor(maxWidth) ).height( Math.floor(newHeight) );
			});
		});
		
		
		$('.responseItemMini').hover(
			function() {
				$(this).find('.cross').css('display','block');
				removingItem = true;
			},
			function() {
				$(this).find('.cross').css('display','none');
				
				// Select next item if none selected
				if ( selectNextResponse && ($container.find('.responseActive').size() < 1 || stackResponses ) ) {
					noDragHover($(".responseItem[data-value='']").eq(0));	
				}
				removingItem = false;
			}
		);
		
		$('.responseItemMini').click(
			function() {
				

				$(this).hide();
				$container.find( '#res' + $(this).data('index') ).show();
				$container.find( '#res' + $(this).data('index') )
					.draggable({revert:'invalid'})
					.animate({ top:$container.find( '#res' + $(this).data('index') ).data('top'), left:$container.find( '#res' + $(this).data('index') ).data('left') }, options.animationSpeed)
					.transition({ scale: 1 }, options.animationSpeed)
					.attr('data-value','');
				$('#' + iterations[$(this).data('index')].id).val('');
				
				// Select next item if none selected
				if ( selectNextResponse && ($container.find('.responseActive').size() < 1 || stackResponses ) ) {
					noDrag($(".responseItem[data-value='']").eq(0));	
				}
			}
		);
		
		$('.responseItem').mouseup(function() {
			clearInterval(revertId);
			var target = this,
				revertId = setInterval( function() {
				clearInterval(revertId);
				offTarget(target);
			}, 500);
		});
		
		// Select next reponse
		if ( selectNextResponse ) {
			noDrag($(".responseItem[data-value='']").eq(0));
		}
		
		var originalWindowWidth = $(window).width();
		
		//Trigger reorder if screen is resized
		$( window ).resize(function() {
			clearInterval(refreshId);
			if ( Math.abs(originalWindowWidth - $(window).width()) > 20 ) { 
				var refreshId = setInterval( function() {
					clearInterval(refreshId);
					location.reload();
				}, 100);
			}
		});

		if ( total_images > 0 ) {
			$container.find('img').each(function() {
				var fakeSrc = $(this).attr('src');
				$("<img/>").css('display', 'none').load(function() {
					images_loaded++;
					if (images_loaded >= total_images) {
						

						// now all images are loaded.
						$container.css('visibility','visible');
	
					}
				}).attr("src", fakeSrc);
			});
		} else {
			$container.css('visibility','visible');
		}
		
		// Returns the container
		return this;
	};
	
} (jQuery));