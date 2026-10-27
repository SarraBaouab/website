// Oura's prepared answers. There is no live chat at launch (her decision, 27 Oct 2026): the first entry
// whose keywords match the question answers it, and anything else gets an honest fallback.
// Keywords include a few French, German and Spanish words; the answers stay in English.

export const ANSWERS = [
  { words: /neuro|brain|cerveau|gehirn|cerebro|workbench|neuron|simulat/i, go: "brain", text: "Neuro Workbench is Sarra's desktop lab for looking inside computational models of neurons, with every number on screen tied to a recorded run. It's a working prototype, and scientific validation is in progress." },
  { words: /forensic|forensique|forense|interview|justice|justiz|court|wrongful|legal|child/i, go: "forensic", text: "Sarra works on forensic interviewing across languages with Prof. Pekka Santtila's research group, adapted a training on interviewing child victims for professionals in Tunisia, and runs a data project on wrongful convictions." },
  { words: /clinic|therap|patient/i, go: "clinical", text: "With Prof. Katie Aafjes-van Doorn's psychotherapy research lab, Sarra builds AI simulated patients for training therapists' interpersonal skills." },
  { words: /langu|sprach|idioma|speak|parle|spricht|habla|arabic|french|english|spanish|german|mandarin|chinese/i, go: "globe", text: "Six! Arabic and French natively, fluent English, Spanish at B2, German at B1 and Mandarin at HSK 3. The globe has the story behind each one." },
  { words: /\bcv\b|resume|résumé|lebenslauf|currículum|curriculum|experience|job/i, go: "cv", text: "Her CV is a PDF waiting in the CV dock. Want me to take you there?" },
  { words: /contact|kontakt|contacto|email|e-mail|mail|reach|hire/i, go: "cv", text: "You can email Sarra at contact@sarrabaouab.com." },
  { words: /skill|python|code|program|tool/i, go: "screen", text: "Study design, questionnaires, preregistration and the NICHD interview protocol on the research side; Python, R, SPSS and SQL for data; language-model evaluation; and NEURON, Jaxley and Brian2 for modelling." },
  { words: /work on|what does|who is|about|do\b/i, go: "screen", text: "Sarra is a psychology researcher building new research tools: AI simulated patients for training therapists, AI support for forensic interviews across languages, and a workbench for computational models of neurons." },
];

export const FALLBACK = { go: null, text: "I'm best with questions about Sarra's work, languages, CV or contact. Try one of the suggestions, or email her at contact@sarrabaouab.com." };

export function answer(question) {
  const q = String(question || "");
  return ANSWERS.find((a) => a.words.test(q)) || FALLBACK;
}
