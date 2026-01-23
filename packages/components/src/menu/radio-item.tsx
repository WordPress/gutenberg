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
import { Context } from './context';
import type { RadioItemProps } from './types';
import * as Styled from './styles';
import { SVG, Circle } from '@wordpress/primitives';

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 }></Circle>
	</SVG>
);

export const RadioItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< RadioItemProps, 'div', false >
>( function RadioItem(
	{ suffix, children, disabled = false, hideOnClick = false, ...props },
	ref
) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.RadioItem can only be rendered inside a Menu component'
		);
	}

	return (
		<Styled.RadioItem
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
				<Icon icon={ radioCheck } size={ 24 } />
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
		</Styled.RadioItem>
	);
} );
