/**
 * Composes multiple higher-order components into a single higher-order component. Performs right-to-left function
 * composition, where each successive invocation is supplied the return value of the previous.
 */
export default function compose( ...funcs ) {
	return function ( ...args ) {
		const length = funcs.length;
		let index = length - 1;
		let result =
			length > 0 ? funcs[ index ].apply( this, args ) : args[ 0 ];
		while ( --index >= 0 ) {
			result = funcs[ index ].call( this, result );
		}
		return result;
	};
}
