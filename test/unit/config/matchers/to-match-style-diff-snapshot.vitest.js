import { expect, Snapshots } from 'vitest';
import { snapshotDiff } from './to-match-diff-snapshot.vitest';

const getStyleSheets = () =>
	Array.from( document.getElementsByTagName( 'style' ) );

const getStyleRulesForElement = ( element, styleSheets ) => {
	return styleSheets.reduce( ( matchingRules, styleSheet ) => {
		const found = [];

		try {
			Array.from( styleSheet.sheet.cssRules ).forEach( ( rule ) => {
				if ( element?.matches( rule.selectorText ) ) {
					found.push( rule.style );
				}
			} );
		} catch {}

		return [ ...matchingRules, ...found ];
	}, [] );
};

const cleanStyleRule = ( rule ) => {
	const size = Array.from( Array( rule.length ).keys() );
	return size.reduce( ( result, index ) => {
		const key = rule[ index ];
		return { ...result, [ key ]: rule[ key ] };
	}, {} );
};

function toMatchStyleDiffSnapshot( received, expected, testName = '' ) {
	const styleSheets = getStyleSheets();
	const receivedStyles = getStyleRulesForElement( received, styleSheets ).map(
		cleanStyleRule
	);
	const expectedStyles = getStyleRulesForElement( expected, styleSheets ).map(
		cleanStyleRule
	);
	const difference = snapshotDiff(
		receivedStyles,
		expectedStyles,
		{
			aAnnotation: 'Received styles',
			bAnnotation: 'Base styles',
		},
		this.utils
	);

	return Snapshots.toMatchSnapshot.call( this, difference, testName );
}

expect.extend( { toMatchStyleDiffSnapshot } );
