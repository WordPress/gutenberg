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

export function UnforwardedNavigableMenu(
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

		return undefined;
	};

	return (
		<NavigableContainer
			ref={ ref }
			stopNavigationEvents
			onlyBrowserTabstops={ false }
			role={ role }
			aria-orientation={
				role !== 'presentation' &&
				( orientation === 'vertical' || orientation === 'horizontal' )
					? orientation
					: undefined
			}
			eventToOffset={ eventToOffset }
			{ ...rest }
		/>
	);
}

/**
 * A container for a navigable menu.
 *
 *  ```jsx
 *  import {
 *    NavigableMenu,
 *    Button,
 *  } from '@wordpress/components';
 *
 *  function onNavigate( index, target ) {
 *    console.log( `Navigates to ${ index }`, target );
 *  }
 *
 *  const MyNavigableContainer = () => (
 *    <div>
 *      <span>Navigable Menu:</span>
 *      <NavigableMenu onNavigate={ onNavigate } orientation="horizontal">
 *        <Button variant="secondary">Item 1</Button>
 *        <Button variant="secondary">Item 2</Button>
 *        <Button variant="secondary">Item 3</Button>
 *      </NavigableMenu>
 *    </div>
 *  );
 *  ```
 */
export const NavigableMenu = forwardRef( UnforwardedNavigableMenu );

export default NavigableMenu;
