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
import type { TriggerButtonProps } from './types';
import { Context } from './context';

export const TriggerButton = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< TriggerButtonProps, 'button', false >
>( function TriggerButton( { children, disabled = false, ...props }, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.TriggerButton can only be rendered inside a Menu component'
		);
	}

	if ( menuContext.store.parent ) {
		throw new Error(
			'Menu.TriggerButton should not be rendered inside a nested Menu component. Use Menu.SubmenuTriggerItem instead.'
		);
	}

	return (
		<Ariakit.MenuButton
			ref={ ref }
			{ ...props }
			disabled={ disabled }
			store={ menuContext.store }
		>
			{ children }
		</Ariakit.MenuButton>
	);
} );
