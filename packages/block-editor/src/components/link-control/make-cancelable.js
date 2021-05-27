/**
 * Creates a wrapper around a promise which allows it to be programmatically
 * cancelled.
 * See: https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
 *
 * @param {Promise} promise the Promise to make cancelable
 */
const makeCancelable = ( promise ) => {
	let hasCanceled_ = false;

	const wrappedPromise = new Promise( ( resolve, reject ) => {
		promise.then(
			( val ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : resolve( val ),
			( error ) =>
				hasCanceled_ ? reject( { isCanceled: true } ) : reject( error )
		);
	} );

	return {
		promise: wrappedPromise,
		cancel() {
			hasCanceled_ = true;
		},
	};
};

export default makeCancelable;
