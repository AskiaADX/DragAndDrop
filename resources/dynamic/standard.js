{% Dim i = 1 
Dim j = 1
Dim rankedResponses = ""
For j = 1 to CurrentQuestion.AvailableResponses.Count 
    If (j > 1) Then 
        rankedResponses = rankedResponses + ","
    EndIf 
    rankedResponses = rankedResponses + CurrentQuestion.AvailableResponses[j].Index
Next j 
%}
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
        fixedRankingOrder: '{%= CurrentADC.PropValue("fixedRankingOrder") %}',
        exclusiveAreas: '{% If (CurrentADC.PropValue("fixedRankingOrder") = "yes" ) Then %}{%= rankedResponses %}{% Else %}{%= CurrentADC.PropValue("exclusiveAreas") %}{% EndIf%}',
		selectNextResponse: {%= (CurrentADC.PropValue("selectNextResponse") = "1") %},
		autoStackWidth: '{%= CurrentADC.PropValue("autoStackWidth") %}',
		dropAreaPosition: '{%= CurrentADC.PropValue("dropAreaPosition") %}',
		fontSize: '{%= CurrentADC.PropValue("fontSize") %}',
        currentQuestion: '{%:= CurrentQuestion.Shortcut %}',
        responsesValues: [{% For i = 1 to CurrentQuestion.AvailableResponses.Count 
    	If (i > 1) Then %},{% EndIf %}{%:= CurrentQuestion.AvailableResponses[i].InputValue() %}
      	{% Next i %}],
		iterations: [
			{% IF CurrentQuestion.Type = "single" Then %}
				{%:= CurrentADC.GetContent("dynamic/standard_single.js").ToText()%}
			{% EndIF %}
		]
	});
});