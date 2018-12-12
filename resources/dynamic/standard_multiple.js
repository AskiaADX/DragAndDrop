{% 
Dim isExclusive

Dim i 
Dim j

Dim par = CurrentQuestion.ParentLoop.AvailableAnswers

For i = 1 To par.Count 
  Dim ar  = CurrentQuestion.Iteration(par[i].Index).AvailableResponses
%}
	 {items : [
{%
	For j = 1 To ar.Count
		isExclusive = ar[j].IsExclusive
%}
{element : $("input[name='{%= CurrentQuestion.Iteration(par[i].Index).InputName("List")%}']"), isExclusive : {%= isExclusive%}}{%= On(j < ar.Count, ",", "") %}
{% Next %}
	]}{%= On(i < par.Count, ",", "") %}
{% Next %}
