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

		try {
			Array.from( styleSheet.sheet.cssRules ).forEach( ( rule ) => {
				if ( element.matches( rule.selectorText ) ) {
					found.push( rule.style );
				}
			} );
		} catch ( e ) {}

		return [ ...matchingRules, ...found ];
	}, [] );
};

/*
 * To clean up the style rule, we're going to pluck out the defined key/value
 * pairs of the provided rule.
 *
 * The shape would look something like this:
 *
 * {
 *   0: 'border-left',
 *   1: 'margin-left',
 *   ...
 *   length: 2
 * }
 *
 * The only rules we're interested in are defined with numeric keys.
 * We are able to know how many are defined by looking at the `length` value.
 *
 * With that information, we can figure out the necessary key/value pairs
 * we need for the cleaned up style rule.
 */
const cleanStyleRule = ( rule ) => {
	const size = Array.from( Array( rule.length ).keys() );
	const rules = size.reduce( ( acc, i ) => {
		const key = rule[ i ];
		const value = rule[ key ];
		return { ...acc, [ key ]: value };
	}, {} );

	return rules;
};

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
