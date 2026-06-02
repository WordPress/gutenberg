/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import * as Styled from './styles';

export const ItemHelpText = forwardRef<
	HTMLSpanElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function ItemHelpText( props, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.ItemHelpText can only be rendered inside a Menu component'
		);
	}

	return <Styled.ItemHelpText numberOfLines={ 2 } ref={ ref } { ...props } />;
} );
