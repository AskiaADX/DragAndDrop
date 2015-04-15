{% 
Dim inputName
Dim inputId

Dim i 
Dim ar = CurrentQuestion.ParentLoop.AvailableResponses

For i = 1 To ar.Count 
	inputName = CurrentQuestion.Iteration(ar[i].Index).InputName()
	inputId   = inputName
%}
{id : '{%= inputId %}'}{%= On(i < ar.Count, ",", "") %}
{% Next %}