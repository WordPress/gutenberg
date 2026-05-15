/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type { ItemProps } from './types';
import * as Styled from './styles';
import { Context } from './context';

export const Item = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< ItemProps, 'div', false >
>( function Item(
	{
		prefix,
		suffix,
		children,
		disabled = false,
		hideOnClick = true,
		store,
		...props
	},
	ref
) {
	const menuContext = useContext( Context );

	if ( ! menuContext?.store ) {
		throw new Error(
			'Menu.Item can only be rendered inside a Menu component'
		);
	}

	// In most cases, the menu store will be retrieved from context (ie. the store
	// created by the top-level menu component). But in rare cases (ie.
	// `Menu.SubmenuTriggerItem`), the context store wouldn't be correct. This is
	// why the component accepts a `store` prop to override the context store.
	const computedStore = store ?? menuContext.store;

	return (
		<Styled.Item
			ref={ ref }
			{ ...props }
			accessibleWhenDisabled
			disabled={ disabled }
			hideOnClick={ hideOnClick }
			store={ computedStore }
		>
			<Styled.ItemPrefixWrapper>{ prefix }</Styled.ItemPrefixWrapper>

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
		</Styled.Item>
	);
} );
