/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { DropdownMenuContext } from './context';
import { Text } from '../text';
import type { DropdownMenuGroupLabelProps } from './types';
import * as Styled from './styles';

export const DropdownMenuGroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuGroupLabelProps, 'div', false >
>( function DropdownMenuGroup( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuGroupLabel
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
			store={ dropdownMenuContext?.store }
		/>
	);
} );
