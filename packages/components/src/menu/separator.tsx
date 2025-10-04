/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import type { SeparatorProps } from './types';
import * as Styled from './styles';

export const Separator = forwardRef<
	HTMLHRElement,
	WordPressComponentProps< SeparatorProps, 'hr', false >
>( function Separator( props, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.Separator can only be rendered inside a Menu component'
		);
	}

	return (
		<Styled.Separator
			ref={ ref }
			{ ...props }
			store={ menuContext.store }
			variant={ menuContext.variant }
		/>
	);
} );
