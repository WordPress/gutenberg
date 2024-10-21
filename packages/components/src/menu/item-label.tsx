/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import * as Styled from './styles';

export const MenuItemLabel = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function MenuItemLabel( props, ref ) {
	return (
		<Styled.MenuItemLabel numberOfLines={ 1 } ref={ ref } { ...props } />
	);
} );
