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

export const DropdownMenuItemLabel = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function DropdownMenuItemLabel( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	if ( ! dropdownMenuContext?.store ) {
		throw new Error(
			'DropdownMenu.ItemLabel can only be rendered inside a DropdownMenu component'
		);
	}

	return (
		<Styled.DropdownMenuItemLabel
			numberOfLines={ 1 }
			ref={ ref }
			{ ...props }
		/>
	);
} );
