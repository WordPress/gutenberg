function isEmptyEmotionClass( className ) {
	const matchingRules = [];
	const classSelector = `.${ className }`;

	const collectMatchingRules = ( rules ) => {
		Array.from( rules ).forEach( ( rule ) => {
			if ( rule.cssRules ) {
				collectMatchingRules( rule.cssRules );
			}

			if ( rule.selectorText?.includes( classSelector ) ) {
				matchingRules.push( rule );
			}
		} );
	};

	Array.from( document.querySelectorAll( 'style[data-emotion]' ) ).forEach(
		( element ) => collectMatchingRules( element.sheet?.cssRules ?? [] )
	);

	return (
		matchingRules.length > 0 &&
		matchingRules.every( ( rule ) => rule.style?.length === 0 )
	);
}

export function createClassNameReplacer() {
	let preservedClassNames = 0;

	return ( className, index ) => {
		if ( index === 0 ) {
			preservedClassNames = 0;
		}

		if ( isEmptyEmotionClass( className ) ) {
			preservedClassNames++;
			return className;
		}

		return `emotion-${ index - preservedClassNames }`;
	};
}
