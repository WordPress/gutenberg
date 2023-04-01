/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NavigableContainer from './container';
import type { WordPressComponentProps } from '../ui/context/wordpress-component';
import type { TabbableContainerProps } from './types';

export function TabbableContainer(
	{ eventToOffset, ...props }:  WordPressComponentProps< TabbableContainerProps, 'div', false >,
	ref: ForwardedRef< any >
) {
	const innerEventToOffset = ( evt: KeyboardEvent ) => {
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

		return 0;
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
