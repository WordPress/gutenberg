const TRANSLATION_FUNCTIONS = [ '__', '_x', '_n', '_nx' ];

/**
 * Regular expression matching the presence of a printf format string
 * placeholder. This naive pattern which does not validate the format.
 *
 * @type {RegExp}
 */
const REGEXP_PLACEHOLDER = /%[^%]/g;

/**
 * Given a function name and array of argument Node values, returns all
 * possible string results from the corresponding translate function, or
 * undefined if the function is not a translate function.
 *
 * @param {string}        functionName Function name.
 * @param {espree.Node[]} args         Espree argument Node objects.
 *
 * @return {?Array<string>} All possible translate function string results.
 */
function getTranslateStrings( functionName, args ) {
	switch ( functionName ) {
		case '__':
		case '_x':
			args = args.slice( 0, 1 );
			break;

		case '_n':
		case '_nx':
			args = args.slice( 0, 2 );
			break;

		default:
			return;
	}

	return args
		.filter( ( arg ) => arg.type === 'Literal' )
		.map( ( arg ) => arg.value );
}

module.exports = {
	TRANSLATION_FUNCTIONS,
	REGEXP_PLACEHOLDER,
	getTranslateStrings,
};
