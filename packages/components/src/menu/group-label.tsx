/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { MenuContext } from './context';
import { Text } from '../text';
import type { MenuGroupLabelProps } from './types';
import * as Styled from './styles';

export const MenuGroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< MenuGroupLabelProps, 'div', false >
>( function MenuGroup( props, ref ) {
	const menuContext = useContext( MenuContext );
	return (
		<Styled.MenuGroupLabel
			ref={ ref }
			render={
				// @ts-expect-error The `children` prop is passed
				<Text
					upperCase
					variant="muted"
					size="11px"
					weight={ 500 }
					lineHeight="16px"
				/>
			}
			{ ...props }
			store={ menuContext?.store }
		/>
	);
} );
