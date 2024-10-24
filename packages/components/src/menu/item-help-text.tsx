/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import * as Styled from './styles';

export const MenuItemHelpText = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function MenuItemHelpText( props, ref ) {
	return (
		<Styled.MenuItemHelpText numberOfLines={ 2 } ref={ ref } { ...props } />
	);
} );
