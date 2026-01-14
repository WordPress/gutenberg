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
import { Context } from './context';
import type { CheckboxItemProps } from './types';
import * as Styled from './styles';

export const CheckboxItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CheckboxItemProps, 'div', false >
>( function CheckboxItem(
	{ suffix, children, disabled = false, hideOnClick = false, ...props },
	ref
) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
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
			hideOnClick={ hideOnClick }
			store={ menuContext.store }
		>
			<Ariakit.MenuItemCheck
				store={ menuContext.store }
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
