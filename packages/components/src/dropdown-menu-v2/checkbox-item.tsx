/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { DropdownMenuContext } from './context';
import type { DropdownMenuCheckboxItemProps } from './types';
import * as Styled from './styles';

export const DropdownMenuCheckboxItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuCheckboxItemProps, 'div', false >
>( function DropdownMenuCheckboxItem(
	{ suffix, children, hideOnClick = false, ...props },
	ref
) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	return (
		<Styled.DropdownMenuCheckboxItem
			ref={ ref }
			{ ...props }
			accessibleWhenDisabled
			hideOnClick={ hideOnClick }
			store={ dropdownMenuContext?.store }
		>
			<Ariakit.MenuItemCheck
				store={ dropdownMenuContext?.store }
				render={ <Styled.ItemPrefixWrapper /> }
				// Override some ariakit inline styles
				style={ { width: 'auto', height: 'auto' } }
			>
				<Icon icon={ check } size={ 24 } />
			</Ariakit.MenuItemCheck>

			<Styled.DropdownMenuItemContentWrapper>
				<Styled.DropdownMenuItemChildrenWrapper>
					{ children }
				</Styled.DropdownMenuItemChildrenWrapper>

				{ suffix && (
					<Styled.ItemSuffixWrapper>
						{ suffix }
					</Styled.ItemSuffixWrapper>
				) }
			</Styled.DropdownMenuItemContentWrapper>
		</Styled.DropdownMenuCheckboxItem>
	);
} );
