/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import type { GroupProps } from './types';
import * as Styled from './styles';

export const Group = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< GroupProps, 'div', false >
>( function Group( props, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.Group can only be rendered inside a Menu component'
		);
	}

	return (
		<Styled.Group ref={ ref } { ...props } store={ menuContext.store } />
	);
} );
