/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import { Text } from '../text';
import type { GroupLabelProps } from './types';
import * as Styled from './styles';

export const GroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< GroupLabelProps, 'div', false >
>( function Group( props, ref ) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.GroupLabel can only be rendered inside a Menu component'
		);
	}

	return (
		<Styled.GroupLabel
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
			store={ menuContext.store }
		/>
	);
} );
