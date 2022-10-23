// @ts-nocheck
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NavigableContainer from './container';

export function TabbableContainer( { eventToOffset, ...props }, ref ) {
	const innerEventToOffset = ( evt ) => {
		const { code, shiftKey } = evt;
		if ( 'Tab' === code ) {
			return shiftKey ? -1 : 1;
		}

		// Allow custom handling of keys besides Tab.
		//
		// By default, TabbableContainer will move focus forward on Tab and
		// backward on Shift+Tab. The handler below will be used for all other
		// events. The semantics for `eventToOffset`'s return
		// values are the following:
		//
		// - +1: move focus forward
		// - -1: move focus backward
		// -  0: don't move focus, but acknowledge event and thus stop it
		// - undefined: do nothing, let the event propagate.
		if ( eventToOffset ) {
			return eventToOffset( evt );
		}
	};

	return (
		<NavigableContainer
			ref={ ref }
			stopNavigationEvents
			onlyBrowserTabstops
			eventToOffset={ innerEventToOffset }
			{ ...props }
		/>
	);
}

export default forwardRef( TabbableContainer );
