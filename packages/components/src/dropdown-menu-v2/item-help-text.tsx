/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { DropdownMenuContext } from './context';
import * as Styled from './styles';

export const DropdownMenuItemHelpText = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function DropdownMenuItemHelpText( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	if ( ! dropdownMenuContext?.store ) {
		throw new Error(
			'DropdownMenu.ItemHelpText can only be rendered inside a DropdownMenu component'
		);
	}

	return (
		<Styled.DropdownMenuItemHelpText
			numberOfLines={ 2 }
			ref={ ref }
			{ ...props }
		/>
	);
} );
