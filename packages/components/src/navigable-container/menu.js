// @ts-nocheck

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import NavigableContainer from './container';

export function NavigableMenu(
	{ role = 'menu', orientation = 'vertical', ...rest },
	ref
) {
	const eventToOffset = ( evt ) => {
		const { keyCode } = evt;

		let next = [ DOWN ];
		let previous = [ UP ];

		if ( orientation === 'horizontal' ) {
			next = [ RIGHT ];
			previous = [ LEFT ];
		}

		if ( orientation === 'both' ) {
			next = [ RIGHT, DOWN ];
			previous = [ LEFT, UP ];
		}

		if ( next.includes( keyCode ) ) {
			return 1;
		} else if ( previous.includes( keyCode ) ) {
			return -1;
		} else if ( [ DOWN, UP, LEFT, RIGHT ].includes( keyCode ) ) {
			// Key press should be handled, e.g. have event propagation and
			// default behavior handled by NavigableContainer but not result
			// in an offset.
			return 0;
		}
	};

	return (
		<NavigableContainer
			ref={ ref }
			stopNavigationEvents
			onlyBrowserTabstops={ false }
			role={ role }
			aria-orientation={ role === 'presentation' ? null : orientation }
			eventToOffset={ eventToOffset }
			{ ...rest }
		/>
	);
}

export default forwardRef( NavigableMenu );
