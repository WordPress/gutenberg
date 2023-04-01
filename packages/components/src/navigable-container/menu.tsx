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
import type { NavigableMenuProps } from './types';

export function NavigableMenu(
	{ role = 'menu', orientation = 'vertical', ...rest }: NavigableMenuProps,
	ref: ForwardedRef< any >
) {
	const eventToOffset = ( evt: KeyboardEvent ) => {
		const { code } = evt;

		let next = [ 'ArrowDown' ];
		let previous = [ 'ArrowUp' ];

		if ( orientation === 'horizontal' ) {
			next = [ 'ArrowRight' ];
			previous = [ 'ArrowLeft' ];
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

		return undefined;
	};

	return (
		<NavigableContainer
			ref={ ref }
			stopNavigationEvents
			onlyBrowserTabstops={ false }
			role={ role }
			aria-orientation={
				role === 'presentation' ? undefined : orientation
			}
			eventToOffset={ eventToOffset }
			{ ...rest }
		/>
	);
}

export default forwardRef( NavigableMenu );
