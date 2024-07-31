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
import type { CompositeStore, CompositeStoreProps } from '@ariakit/react';

/**
 * Creates a composite store.
 * @see https://ariakit.org/reference/use-composite-store
 * @example
 * ```jsx
 * const useCompositeStore = useCompositeStore();
 * const store = useCompositeStore();
 * <Composite store={store}>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 * </Composite>
 * ```
 */
export const useCompositeStore = Ariakit.useCompositeStore;

const Group = Ariakit.CompositeGroup;
Group.displayName = 'Composite.Group';

export const GroupLabel = Ariakit.CompositeGroupLabel;
GroupLabel.displayName = 'Composite.GroupLabel';

export const Item = Ariakit.CompositeItem;
Item.displayName = 'Composite.Item';

export const Row = Ariakit.CompositeRow;
Row.displayName = 'Composite.Row';

/**
 * Renders a composite widget.
 * @see https://ariakit.org/reference/composite
 * @example
 * ```jsx
 * const useCompositeStore = useCompositeStore();
 * const store = useCompositeStore();
 * <Composite store={store}>
 *   <Composite.Item>Item 1</Composite.Item>
 *   <Composite.Item>Item 2</Composite.Item>
 * </Composite>
 * ```
 */
export const Composite = Object.assign( Ariakit.Composite, {
	/**
	 * Renders a group element for composite items.
	 * @see https://ariakit.org/reference/composite-group
	 * @example
	 * ```jsx
	 * const useCompositeStore = useCompositeStore();
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
	 * @see https://ariakit.org/reference/composite-group-label
	 * @example
	 * ```jsx
	 * const useCompositeStore = useCompositeStore();
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
	 * @see https://ariakit.org/reference/composite-item
	 * @example
	 * ```jsx
	 * const useCompositeStore = useCompositeStore();
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
	 * @see https://ariakit.org/reference/composite-row
	 * @example
	 * ```jsx
	 * const useCompositeStore = useCompositeStore();
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
} );

export type Store = CompositeStore;
export type StoreProps = CompositeStoreProps;
