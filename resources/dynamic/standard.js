/* standard.js */
$(window).load(function() {
	$('#adc_{%= CurrentADC.InstanceId %}').adcDragndrop({
		maxWidth : '{%= CurrentADC.PropValue("maxWidth") %}',
		controlWidth : '{%= CurrentADC.PropValue("controlWidth") %}',
		maxImageWidth : '{%= CurrentADC.PropValue("maxImageWidth") %}',
		maxImageHeight : '{%= CurrentADC.PropValue("maxImageHeight") %}',
		forceImageSize : '{%= CurrentADC.PropValue("forceImageSize") %}',
		animationSpeed : '{%= CurrentADC.PropValue("animationSpeed") %}',
		showResponseHoverColour: {%= (CurrentADC.PropValue("showResponseHoverColour") = "1") %},
		showResponseHoverFontColour: {%= (CurrentADC.PropValue("showResponseHoverFontColour") = "1") %},
		showResponseHoverBorder: {%= (CurrentADC.PropValue("showResponseHoverBorder") = "1") %},
		controlAlign : '{%= CurrentADC.PropValue("controlAlign") %}',
		autoImageSize: {%= (CurrentADC.PropValue("autoImageSize") = "1") %},
		stackResponses: {%= (CurrentADC.PropValue("stackResponses") = "1") %},
		exclusiveAreas: '{%= CurrentADC.PropValue("exclusiveAreas") %}',
		selectNextResponse: {%= (CurrentADC.PropValue("selectNextResponse") = "1") %},
		autoStackWidth: '{%= CurrentADC.PropValue("autoStackWidth") %}',
		dropAreaPosition: '{%= CurrentADC.PropValue("dropAreaPosition") %}',
		fontSize: '{%= CurrentADC.PropValue("fontSize") %}',
		iterations: [
			{% IF CurrentQuestion.Type = "single" Then %}
				{%:= CurrentADC.GetContent("dynamic/standard_single.js").ToText()%}
			{% EndIF %}
		]
	});
});