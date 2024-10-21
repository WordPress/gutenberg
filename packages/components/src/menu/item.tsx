/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type { MenuItemProps } from './types';
import * as Styled from './styles';
import { MenuContext } from './context';
import { useTemporaryFocusVisibleFix } from './use-temporary-focus-visible-fix';

export const MenuItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< MenuItemProps, 'div', false >
>( function MenuItem(
	{ prefix, suffix, children, onBlur, hideOnClick = true, ...props },
	ref
) {
	// TODO: Remove when https://github.com/ariakit/ariakit/issues/4083 is fixed
	const focusVisibleFixProps = useTemporaryFocusVisibleFix( { onBlur } );
	const menuContext = useContext( MenuContext );

	return (
		<Styled.MenuItem
			ref={ ref }
			{ ...props }
			{ ...focusVisibleFixProps }
			accessibleWhenDisabled
			hideOnClick={ hideOnClick }
			store={ menuContext?.store }
		>
			<Styled.ItemPrefixWrapper>{ prefix }</Styled.ItemPrefixWrapper>

			<Styled.MenuItemContentWrapper>
				<Styled.MenuItemChildrenWrapper>
					{ children }
				</Styled.MenuItemChildrenWrapper>

				{ suffix && (
					<Styled.ItemSuffixWrapper>
						{ suffix }
					</Styled.ItemSuffixWrapper>
				) }
			</Styled.MenuItemContentWrapper>
		</Styled.MenuItem>
	);
} );
