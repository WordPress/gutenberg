/**
 * External dependencies
 */
const snapshotDiff = require( 'snapshot-diff' );

const getStyleSheets = () =>
	Array.from( document.getElementsByTagName( 'style' ) );

/**
 *
 * @param {Element} element
 * @param {HTMLStyleElement[]} styleSheets
 */
const getStyleRulesForElement = ( element, styleSheets ) => {
	return styleSheets.reduce( ( matchingRules, styleSheet ) => {
		const found = [];
		Array.from( styleSheet.sheet.cssRules ).forEach( ( rule ) => {
			try {
				if ( element.matches( rule.selectorText ) ) {
					found.push( rule.style );
				}
			} catch ( e ) {
				/* Ignore these???????????????? */
			}
		} );
		return [ ...matchingRules, ...found ];
	}, [] );
};

/* eslint-disable no-unused-vars */
const cleanStyleRule = ( {
	parentRule,
	__starts,
	__ends,
	_importants,
	...cleanedRule
} ) => cleanedRule;
/* eslint-enable no-unused-vars */

/**
 * @param {Element} received
 * @param {Element} expected
 * @param {string} testName
 */
function toMatchStyleDiffSnapshot( received, expected, testName ) {
	const styleSheets = getStyleSheets();
	const receivedStyles = getStyleRulesForElement( received, styleSheets ).map(
		cleanStyleRule
	);
	const expectedStyles = getStyleRulesForElement( expected, styleSheets ).map(
		cleanStyleRule
	);
	return snapshotDiff.toMatchDiffSnapshot.call(
		this,
		receivedStyles,
		expectedStyles,
		{
			aAnnotation: 'Received styles',
			bAnnotation: 'Base styles',
		},
		testName || ''
	);
}

expect.extend( { toMatchStyleDiffSnapshot } );
