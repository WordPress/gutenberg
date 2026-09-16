import * as Ariakit from '@ariakit/react';
import { forwardRef, useContext } from '@wordpress/element';
import { Icon, check } from '@wordpress/icons';
import type { WordPressComponentProps } from '../context';
import { Context } from './context';
import type { CheckboxItemProps } from './types';
import * as Styled from './styles';
import { useMenuItemHideOnClick } from './use-menu-item-hide-on-click';

export const CheckboxItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CheckboxItemProps, 'div', false >
>( function CheckboxItem(
	{ suffix, children, disabled = false, hideOnClick = false, ...props },
	ref
) {
	const menuContext = useContext( Context );
	const store = menuContext?.store;
	const computedHideOnClick = useMenuItemHideOnClick( store, hideOnClick );

	if ( ! store ) {
		throw new Error(
			'Menu.CheckboxItem can only be rendered inside a Menu component'
		);
	}
	return (
		<Styled.CheckboxItem
			ref={ ref }
			{ ...props }
			accessibleWhenDisabled
			disabled={ disabled }
			store={ store }
			hideOnClick={ computedHideOnClick }
		>
			<Ariakit.MenuItemCheck
				store={ store }
				render={ <Styled.ItemPrefixWrapper /> }
				// Override some ariakit inline styles
				style={ { width: 'auto', height: 'auto' } }
			>
				<Icon icon={ check } size={ 24 } />
			</Ariakit.MenuItemCheck>

			<Styled.ItemContentWrapper>
				<Styled.ItemChildrenWrapper>
					{ children }
				</Styled.ItemChildrenWrapper>

				{ suffix && (
					<Styled.ItemSuffixWrapper>
						{ suffix }
					</Styled.ItemSuffixWrapper>
				) }
			</Styled.ItemContentWrapper>
		</Styled.CheckboxItem>
	);
} );
