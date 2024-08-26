/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { DropdownMenuContext } from './context';
import type { DropdownMenuSeparatorProps } from './types';
import * as Styled from './styles';

export const DropdownMenuSeparator = forwardRef<
	HTMLHRElement,
	WordPressComponentProps< DropdownMenuSeparatorProps, 'hr', false >
>( function DropdownMenuSeparator( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuSeparator
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
			variant={ dropdownMenuContext?.variant }
		/>
	);
} );
