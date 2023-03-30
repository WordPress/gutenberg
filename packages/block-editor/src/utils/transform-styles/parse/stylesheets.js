function createStyleElem( css, hidden = true ) {
	const styleElem = document.createElement( 'style' );

	if ( hidden ) {
		styleElem.media = 'none';
	}

	document.head.appendChild( styleElem );
	styleElem.appendChild( document.createTextNode( css ) );

	if ( hidden ) {
		styleElem.sheet.disabled = true;
	}

	return styleElem;
}

function textFromStyleSheet( styleSheet ) {
	const cssText = Array.from( styleSheet.cssRules ).reduce(
		( prev, cssRule ) => {
			return prev + cssRule.cssText;
		},
		''
	);
	return cssText;
}

export { createStyleElem, textFromStyleSheet };
