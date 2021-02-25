/**
 * External dependencies
 */
const snapshotDiff = require( 'snapshot-diff' );

const serialize = ( obj ) => JSON.stringify( obj, undefined, '\t' );

/**
 * @param {Element} received
 * @param {Element} expected
 * @param {string} testName
 */
function toMatchStyleDiffSnapshot( received, expected, testName ) {
	const receivedStyles = serialize(
		window.getComputedStyle( received )._values
	);
	const expectedStyles = serialize(
		window.getComputedStyle( expected )._values
	);
	const ret = snapshotDiff.toMatchDiffSnapshot.call(
		this,
		receivedStyles,
		expectedStyles,
		{
			aAnnotation: 'Received styles',
			bAnnotation: 'Base styles',
		},
		testName || ''
	);
	return ret;
}

expect.extend( { toMatchStyleDiffSnapshot } );
