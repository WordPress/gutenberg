/**
 * Given a function name and array of argument Node values,
 * returns all arguments except for text domain and number arguments.
 *
 * @param {string}        functionName   Function name.
 * @param {espree.Node[]} args           Espree argument Node objects.
 * @param {boolean}       includeContext Whether to include the context argument or not.
 *
 * @return {espree.Node[]} Translate function arguments.
 */
function getTranslateFunctionArgs( functionName, args, includeContext = true ) {
	switch ( functionName ) {
		case '__':
			// __( text, domain ) -> [ text ].
			return args.slice( 0, 1 );

		case '_x':
			// _x( text, context, domain ) -> [ text, context ].
			return includeContext ? args.slice( 0, 2 ) : args.slice( 0, 1 );

		case '_n':
			// _n( single, plural, number, domain ) -> [ single, plural ].
			return args.slice( 0, 2 );

		case '_nx':
			// _nx( single, plural, number, context, domain ) -> [ single, plural, context ].
			const result = args.slice( 0, 2 );
			if ( includeContext ) {
				result.push( args[ 3 ] );
			}
			return result;

		default:
			return [];
	}
}

module.exports = {
	getTranslateFunctionArgs,
};
