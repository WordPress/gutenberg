/**
 * @typedef {Object} DefaultPreventedRef
 * @property {boolean} current
 * @property {Function} unsubscribe
 */
/**
 *
 * @param {Element} element
 * @param {...string} eventNames
 * @return {DefaultPreventedRef} `defaultPrevented` ref object
 */
export default function subscribeDefaultPrevented( element, ...eventNames ) {
	const ref = { current: false, unsubscribe: () => {} };

	const handleEvent = ( event ) => {
		const preventDefault = event.preventDefault.bind( event );
		event.preventDefault = () => {
			ref.current = true;
			preventDefault();
		};
	};

	eventNames.forEach( ( eventName ) => {
		element.addEventListener( eventName, handleEvent );
	} );

	ref.unsubscribe = () => {
		eventNames.forEach( ( eventName ) => {
			element.removeEventListener( eventName, handleEvent );
		} );
	};

	return ref;
}
