/**
 * External Dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress Dependencies
 */
import { forwardRef } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import NavigableContainer from './container';

export function NavigableMenu( {
	role = 'menu',
	orientation = 'vertical',
	...rest
}, ref ) {
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

		if ( includes( next, keyCode ) ) {
			return 1;
		} else if ( includes( previous, keyCode ) ) {
			return -1;
		}
	};

	const isAriaOrientationAllowed = [
		'scrollbar',
		'select',
		'separator',
		'slider',
		'tablist',
		'toolbar',
		'combobox',
		'listbox',
		'menu',
		'menubar',
		'radiogroup',
		'tree',
		'treegrid',
	].includes( role );

	return (
		<NavigableContainer
			ref={ ref }
			stopNavigationEvents
			onlyBrowserTabstops={ false }
			role={ role }
			aria-orientation={ isAriaOrientationAllowed ? orientation : null }
			eventToOffset={ eventToOffset }
			{ ...rest }
		/>
	);
}

export default forwardRef( NavigableMenu );
