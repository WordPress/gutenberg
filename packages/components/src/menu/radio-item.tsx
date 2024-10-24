/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { MenuContext } from './context';
import type { MenuRadioItemProps } from './types';
import * as Styled from './styles';
import { SVG, Circle } from '@wordpress/primitives';
import { useTemporaryFocusVisibleFix } from './use-temporary-focus-visible-fix';

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 }></Circle>
	</SVG>
);

export const MenuRadioItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< MenuRadioItemProps, 'div', false >
>( function MenuRadioItem(
	{ suffix, children, onBlur, hideOnClick = false, ...props },
	ref
) {
	// TODO: Remove when https://github.com/ariakit/ariakit/issues/4083 is fixed
	const focusVisibleFixProps = useTemporaryFocusVisibleFix( { onBlur } );
	const menuContext = useContext( MenuContext );

	return (
		<Styled.MenuRadioItem
			ref={ ref }
			{ ...props }
			{ ...focusVisibleFixProps }
			accessibleWhenDisabled
			hideOnClick={ hideOnClick }
			store={ menuContext?.store }
		>
			<Ariakit.MenuItemCheck
				store={ menuContext?.store }
				render={ <Styled.ItemPrefixWrapper /> }
				// Override some ariakit inline styles
				style={ { width: 'auto', height: 'auto' } }
			>
				<Icon icon={ radioCheck } size={ 24 } />
			</Ariakit.MenuItemCheck>

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
		</Styled.MenuRadioItem>
	);
} );
