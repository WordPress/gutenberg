/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type { DropdownMenuItemProps } from './types';
import * as Styled from './styles';
import { DropdownMenuContext } from './context';
import { useTemporaryFocusVisibleFix } from './use-temporary-focus-visible-fix';

export const DropdownMenuItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuItemProps, 'div', false >
>( function DropdownMenuItem(
	{ prefix, suffix, children, onBlur, hideOnClick = true, store, ...props },
	ref
) {
	// TODO: Remove when https://github.com/ariakit/ariakit/issues/4083 is fixed
	const focusVisibleFixProps = useTemporaryFocusVisibleFix( { onBlur } );
	const dropdownMenuContext = useContext( DropdownMenuContext );

	if ( ! dropdownMenuContext?.store ) {
		throw new Error(
			'DropdownMenu.Item can only be rendered inside a DropdownMenu component'
		);
	}

	const computedStore = store ?? dropdownMenuContext.store;

	return (
		<Styled.DropdownMenuItem
			ref={ ref }
			{ ...props }
			{ ...focusVisibleFixProps }
			accessibleWhenDisabled
			hideOnClick={ hideOnClick }
			store={ computedStore }
		>
			<Styled.ItemPrefixWrapper>{ prefix }</Styled.ItemPrefixWrapper>

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
		</Styled.DropdownMenuItem>
	);
} );
