const tagCompromise = function(doc) {
	let everything=[]
	doc.list.forEach(p => {
		let terms = p.cache.terms || p.terms()
		let termsTagged=[]
		terms.forEach(t => {
			let pre = t.pre.trim()
			let tags=Object.keys(t.tags);
			let reduced=t.reduced;
			let text = t.text.trim()
			let post = t.post.trim()
			if (pre.length!=0){
				termsTagged.push([pre,pre,null])
			}
			if (text.length!=0){
				termsTagged.push([text,reduced,tags])
			}
			if (post.length!=0){
				termsTagged.push([post,post,null])
			}
		})
		everything.push(termsTagged)
	})
	return(everything);
}


function tag(text){
	let doc=nlp(text);
	let simple=tagCompromise(doc)
	return(simple)
}

function getPOSTag(tags){
	//based on https://observablehq.com/@spencermountain/compromise-tags
	posTags1 = [
		'Noun',
		'Singular',
		'Person',
		'FirstName',
		'MaleName',
		'FemaleName',
		'LastName',
		'Place',
		'Country',
		'City',
		'Region',
		'Address',
		'Organization',
		'SportsTeam',
		'Company',
		'School',
		//'ProperNoun',
		'Honorific',
		'Plural',
		'Uncountable',
		'Pronoun',
		'Actor',
		'Activity',
		'Unit',
		'Demonym',
		'Possessive',
		'Verb',
		'PresentTense',
		'Infinitive',
		'Gerund',
		'PastTense',
		'PerfectTense',
		'FuturePerfect',
		'Pluperfect',
		'Copula',
		'Modal',
		'Participle',
		'Particle',
		'PhrasalVerb',
		'Value',
		'Ordinal',
		'Cardinal',
		'RomanNumeral',
		'Multiple',
		'Fraction',
		'TextValue',
		'NumericValue',
		'Percent',
		'Money',
		'Date',
		'Month',
		'WeekDay',
		'RelativeDay',
		'Year',
		'Duration',
		'Time',
		'Holiday',
		'Adjective',
		'Comparable',
		'Comparative',
		'Superlative',
		'Contraction',
		'Adverb',
		'Currency',
		'Determiner',
		'Conjunction',
		'Preposition',
		'QuestionWord',
		'Pronoun',
		'Expression',
		'Abbreviation',
		'Url',
		'HashTag',
		'PhoneNumber',
		'AtMention',
		'Emoji',
		'Emoticon',
		'Email',
		'Auxiliary',
		'Negative',
		'Acronym',
	];
	posTags2 = [
		'Noun',
		'Singular',
		//'Person',
		//'FirstName',
		//'MaleName',
		//'FemaleName',
		//'LastName',
		//'Place',
		//'Country',
		//'City',
		//'Region',
		//'Address',
		//'Organization',
		//'SportsTeam',
		//'Company',
		//'School',
		'ProperNoun',
		//'Honorific',
		'Plural',
		'Uncountable',
		'Pronoun',
		//'Actor',
		//'Activity',
		//'Unit',
		//'Demonym',
		'Possessive',
		'Verb',
		'PresentTense',
		'Infinitive',
		'Gerund',
		'PastTense',
		'PerfectTense',
		'FuturePerfect',
		'Pluperfect',
		'Copula',
		'Modal',
		'Participle',
		'Particle',
		//'PhrasalVerb',
		'Value',
		//'Ordinal',
		//'Cardinal',
		//'RomanNumeral',
		//'Multiple',
		//'Fraction',
		//'TextValue',
		//'NumericValue',
		//'Percent',
		//'Money',
		//'Date',
		//'Month',
		//'WeekDay',
		//'RelativeDay',
		//'Year',
		//'Duration',
		//'Time',
		//'Holiday',
		'Adjective',
		'Comparable',
		'Comparative',
		'Superlative',
		'Contraction',
		'Adverb',
		//'Currency',
		'Determiner',
		'Conjunction',
		'Preposition',
		'QuestionWord',
		'Pronoun',
		//'Expression',
		//'Abbreviation',
		//'Url',
		//'HashTag',
		//'PhoneNumber',
		//'AtMention',
		//'Emoji',
		//'Emoticon',
		//'Email',
		'Auxiliary',
		'Negative',
		//'Acronym',
	];
	posTags=posTags2;
	if (tags==null){
		return 'Null';
	}
	let i
	for (i=(posTags.length-1);i>=0;--i){
		let tag=posTags[i]
		if (tags.includes(tag)){
			return tag;
		}
	}
	return "?";
}

