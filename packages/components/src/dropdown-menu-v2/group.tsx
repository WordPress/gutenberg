/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { DropdownMenuContext } from './context';
import type { DropdownMenuGroupProps } from './types';
import * as Styled from './styles';

export const DropdownMenuGroup = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuGroupProps, 'div', false >
>( function DropdownMenuGroup( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	if ( ! dropdownMenuContext?.store ) {
		throw new Error(
			'DropdownMenu.Group can only be rendered inside a DropdownMenu component'
		);
	}

	return (
		<Styled.DropdownMenuGroup
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
		/>
	);
} );
