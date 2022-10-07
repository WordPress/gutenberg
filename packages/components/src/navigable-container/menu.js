// @ts-nocheck

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NavigableContainer from './container';

export function NavigableMenu(
	{ role = 'menu', orientation = 'vertical', ...rest },
	ref
) {
	const eventToOffset = ( evt ) => {
		const { code } = evt;

		let next = [ 'ArrowDown' ];
		let previous = [ 'ArrowUp' ];

		if ( orientation === 'horizontal' ) {
			next = [ 'ArrowRight' ];
			previous = [ 'ArrowLeft' ];
		}

		if ( orientation === 'both' ) {
			next = [ 'ArrowRight', 'ArrowDown' ];
			previous = [ 'ArrowLeft', 'ArrowUp' ];
		}

		if ( next.includes( code ) ) {
			return 1;
		} else if ( previous.includes( code ) ) {
			return -1;
		} else if (
			[ 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight' ].includes(
				code
			)
		) {
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
