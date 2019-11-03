/**
 * Given a selector returns a functions that returns the listener only
 * if the returned value from the selector changes.
 *
 * @param  {Function} selector Selector.
 * @param  {Function} listener Listener.
 * @param  {boolean}  initial  Flags whether listener should be invoked on
 *                             initial call.
 * @return {Function}          Listener creator.
 */
export const onChangeListener = ( selector, listener, initial = false ) => {
	let previousValue = selector();
	if ( initial ) {
		listener( selector() );
	}
	return () => {
		const selectedValue = selector();
		if ( selectedValue !== previousValue ) {
			previousValue = selectedValue;
			listener( selectedValue );
		}
	};
};
