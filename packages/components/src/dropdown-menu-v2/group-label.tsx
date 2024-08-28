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
import type { DropdownMenuGroupProps } from './types';
import * as Styled from './styles';

export const DropdownMenuGroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuGroupProps, 'div', false >
>( function DropdownMenuGroup( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuGroupLabel
			ref={ ref }
			render={
				// @ts-expect-error The `children` prop is passed
				<Text upperCase variant="muted" />
			}
			{ ...props }
			store={ dropdownMenuContext?.store }
		/>
	);
} );
