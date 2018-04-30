/**
 * WordPress dependencies
 */
import { subscribe } from '@wordpress/data';

/**
 * Given a selector returns a functions that returns the listener only
 * if the returned value from the selector changes.
 *
 * @param  {function} selector Selector.
 * @param  {function} listener Listener.
 * @return {function}          Listener creator.
 */
export const onChangeListener = ( selector, listener ) => {
	let previousValue = selector();
	return () => {
		const selectedValue = selector();
		if ( selectedValue !== previousValue ) {
			previousValue = selectedValue;
			listener( selectedValue );
		}
	};
};

/**
 * Given a selector, the desired value and a listener,
 * the function calls the listener when the selector matches the passed value.
 * If the selector does not matches the value right away the function subscribes to data module changes.
 *
 * @param  {function} selector Selector.
 * @param  {*} value           The value to compare against the selector result.
 * @param  {function} listener Listener to be called when selector matches value.
 */
export const onValueMatch = ( selector, value, listener ) => {
	if ( selector() === value ) {
		listener();
		return;
	}
	const unsubscribe = subscribe( () => {
		if ( selector() === value ) {
			unsubscribe();
			listener();
		}
	} );
};
