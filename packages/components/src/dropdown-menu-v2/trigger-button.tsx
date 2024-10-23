/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type { DropdownMenuTriggerButtonProps } from './types';
import { DropdownMenuContext } from './context';

export const DropdownMenuTriggerButton = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuTriggerButtonProps, 'button', false >
>( function DropdownMenuTriggerButton( { children, ...props }, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	if ( ! dropdownMenuContext?.store ) {
		throw new Error(
			'DropdownMenu.TriggerButton can only be rendered inside a DropdownMenu component'
		);
	}

	if ( dropdownMenuContext.store.parent ) {
		throw new Error(
			'DropdownMenu.TriggerButton should not be renderer inside a nested DropdownMenu component. Use DropdownMenu.SubmenuTriggerItem instead.'
		);
	}

	return (
		<Ariakit.MenuButton
			ref={ ref }
			{ ...props }
			accessibleWhenDisabled
			store={ dropdownMenuContext.store }
		>
			{ children }
		</Ariakit.MenuButton>
	);
} );
