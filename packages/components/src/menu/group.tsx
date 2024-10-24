/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { MenuContext } from './context';
import type { MenuGroupProps } from './types';
import * as Styled from './styles';

export const MenuGroup = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< MenuGroupProps, 'div', false >
>( function MenuGroup( props, ref ) {
	const menuContext = useContext( MenuContext );
	return (
		<Styled.MenuGroup
			ref={ ref }
			{ ...props }
			store={ menuContext?.store }
		/>
	);
} );
