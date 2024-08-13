/**
 * Composite is a component that may contain navigable items represented by
 * Composite.Item. It's inspired by the WAI-ARIA Composite Role and implements
 * all the keyboard navigation mechanisms to ensure that there's only one
 * tab stop for the whole Composite element. This means that it can behave as
 * a roving tabindex or aria-activedescendant container.
 *
 * @see https://ariakit.org/components/composite
 */

/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type {
	CompositeStoreProps,
	CompositeProps,
	CompositeGroupProps,
	CompositeGroupLabelProps,
	CompositeItemProps,
	CompositeRowProps,
	CompositeHoverProps,
	CompositeTypeaheadProps,
} from './types';

/**
 * Creates a composite store.
 *
 * @example
 * ```jsx
 * import { Composite, useCompositeStore } from '@wordpress/components';
 *
 * const store = useCompositeStore();
 * <Composite store={store}>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 * </Composite>
 * ```
 */
export function useCompositeStore( {
	focusLoop = false,
	focusWrap = false,
	focusShift = false,
	virtualFocus = false,
	orientation = 'both',
	rtl = false,
	...props
}: CompositeStoreProps = {} ) {
	return Ariakit.useCompositeStore( {
		focusLoop,
		focusWrap,
		focusShift,
		virtualFocus,
		orientation,
		rtl,
		...props,
	} );
}

const Group = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeGroupProps, 'div', false >
>( function CompositeGroup( props, ref ) {
	return <Ariakit.CompositeGroup { ...props } ref={ ref } />;
} );
Group.displayName = 'Composite.Group';

const GroupLabel = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeGroupLabelProps, 'div', false >
>( function CompositeGroupLabel( props, ref ) {
	return <Ariakit.CompositeGroupLabel { ...props } ref={ ref } />;
} );
GroupLabel.displayName = 'Composite.GroupLabel';

const Item = forwardRef<
	HTMLButtonElement,
	WordPressComponentProps< CompositeItemProps, 'button', false >
>( function CompositeItem( props, ref ) {
	return <Ariakit.CompositeItem { ...props } ref={ ref } />;
} );
Item.displayName = 'Composite.Item';

const Row = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeRowProps, 'div', false >
>( function CompositeRow( props, ref ) {
	return <Ariakit.CompositeRow { ...props } ref={ ref } />;
} );
Row.displayName = 'Composite.Row';

const Hover = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeHoverProps, 'div', false >
>( function CompositeHover( props, ref ) {
	return <Ariakit.CompositeHover { ...props } ref={ ref } />;
} );
Hover.displayName = 'Composite.Hover';

const Typeahead = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< CompositeTypeaheadProps, 'div', false >
>( function CompositeTypeahead( props, ref ) {
	return <Ariakit.CompositeTypeahead { ...props } ref={ ref } />;
} );
Typeahead.displayName = 'Composite.Typeahead';

/**
 * Renders a widget based on the WAI-ARIA [`composite`](https://w3c.github.io/aria/#composite)
 * role, which provides a single tab stop on the page and arrow key navigation
 * through the focusable descendants.
 *
 * @example
 * ```jsx
 * import { Composite, useCompositeStore } from '@wordpress/components';
 *
 * const store = useCompositeStore();
 * <Composite store={store}>
 *   <Composite.Item>Item 1</Composite.Item>
 *   <Composite.Item>Item 2</Composite.Item>
 * </Composite>
 * ```
 */
export const Composite = Object.assign(
	forwardRef<
		HTMLDivElement,
		WordPressComponentProps< CompositeProps, 'div', false >
	>( function Composite( { disabled = false, ...props }, ref ) {
		return (
			<Ariakit.Composite disabled={ disabled } { ...props } ref={ ref } />
		);
	} ),
	{
		displayName: 'Composite',
		/**
		 * Renders a group element for composite items.
		 *
		 * @example
		 * ```jsx
		 * import { Composite, useCompositeStore } from '@wordpress/components';
		 *
		 * const store = useCompositeStore();
		 * <Composite store={store}>
		 *   <Composite.Group>
		 *     <Composite.GroupLabel>Label</Composite.GroupLabel>
		 *     <Composite.Item>Item 1</Composite.Item>
		 *     <Composite.Item>Item 2</Composite.Item>
		 *   </CompositeGroup>
		 * </Composite>
		 * ```
		 */
		Group,
		/**
		 * Renders a label in a composite group. This component must be wrapped with
		 * `Composite.Group` so the `aria-labelledby` prop is properly set on the
		 * composite group element.
		 *
		 * @example
		 * ```jsx
		 * import { Composite, useCompositeStore } from '@wordpress/components';
		 *
		 * const store = useCompositeStore();
		 * <Composite store={store}>
		 *   <Composite.Group>
		 *     <Composite.GroupLabel>Label</Composite.GroupLabel>
		 *     <Composite.Item>Item 1</Composite.Item>
		 *     <Composite.Item>Item 2</Composite.Item>
		 *   </CompositeGroup>
		 * </Composite>
		 * ```
		 */
		GroupLabel,
		/**
		 * Renders a composite item.
		 *
		 * @example
		 * ```jsx
		 * import { Composite, useCompositeStore } from '@wordpress/components';
		 *
		 * const store = useCompositeStore();
		 * <Composite store={store}>
		 *   <Composite.Item>Item 1</Composite.Item>
		 *   <Composite.Item>Item 2</Composite.Item>
		 *   <Composite.Item>Item 3</Composite.Item>
		 * </Composite>
		 * ```
		 */
		Item,
		/**
		 * Renders a composite row. Wrapping `Composite.Item` elements within
		 * `Composite.Row` will create a two-dimensional composite widget, such as a
		 * grid.
		 *
		 * @example
		 * ```jsx
		 * import { Composite, useCompositeStore } from '@wordpress/components';
		 *
		 * const store = useCompositeStore();
		 * <Composite store={store}>
		 *   <Composite.Row>
		 *     <Composite.Item>Item 1.1</Composite.Item>
		 *     <Composite.Item>Item 1.2</Composite.Item>
		 *     <Composite.Item>Item 1.3</Composite.Item>
		 *   </Composite.Row>
		 *   <Composite.Row>
		 *     <Composite.Item>Item 2.1</Composite.Item>
		 *     <Composite.Item>Item 2.2</Composite.Item>
		 *     <Composite.Item>Item 2.3</Composite.Item>
		 *   </Composite.Row>
		 * </Composite>
		 * ```
		 */
		Row,
		/**
		 * Renders an element in a composite widget that receives focus on mouse move
		 * and loses focus to the composite base element on mouse leave. This should
		 * be combined with the `Composite.Item` component.
		 *
		 * @example
		 * ```jsx
		 * import { Composite, useCompositeStore } from '@wordpress/components';
		 *
		 * const store = useCompositeStore();
		 * <Composite store={store}>
		 *   <Composite.Hover render={ <Composite.Item /> }>
		 *     Item 1
		 *   </Composite.Hover>
		 *   <Composite.Hover render={ <Composite.Item /> }>
		 *     Item 2
		 *   </Composite.Hover>
		 * </Composite>
		 * ```
		 */
		Hover,
		/**
		 * Renders a component that adds typeahead functionality to composite
		 * components. Hitting printable character keys will move focus to the next
		 * composite item that begins with the input characters.
		 *
		 * @example
		 * ```jsx
		 * import { Composite, useCompositeStore } from '@wordpress/components';
		 *
		 * const store = useCompositeStore();
		 * <Composite store={store} render={ <CompositeTypeahead /> }>
		 *   <Composite.Item>Item 1</Composite.Item>
		 *   <Composite.Item>Item 2</Composite.Item>
		 * </Composite>
		 * ```
		 */
		Typeahead,
	}
);
