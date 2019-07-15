/**
 * Given a selector returns a functions that returns the listener only
 * if the returned value from the selector changes.
 *
 * @param  {function} selector Selector.
 * @param  {function} listener Listener.
 * @param  {boolean}  initial  Flags whether listener should be invoked on
 *                             initial call.
 * @return {function}          Listener creator.
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
