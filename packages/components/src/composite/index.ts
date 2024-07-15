/**
 * Composite is a component that may contain navigable items represented by
 * CompositeItem. It's inspired by the WAI-ARIA Composite Role and implements
 * all the keyboard navigation mechanisms to ensure that there's only one
 * tab stop for the whole Composite element. This means that it can behave as
 * a roving tabindex or aria-activedescendant container.
 *
 * @see https://ariakit.org/components/composite
 */

/**
 * External dependencies
 */
import {
	Composite,
	CompositeGroup,
	CompositeGroupLabel,
	CompositeItem,
	CompositeRow,
	useCompositeStore,
} from '@ariakit/react';
import type { CompositeStore, CompositeStoreProps } from '@ariakit/react';

/**
 * Creates a composite store.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const useCompositeStore = Composite.useStore;
 * const store = useCompositeStore();
 * <Composite.Root store={store}>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 *   <Composite.Item>Item</Composite.Item>
 * </Composite.Root>
 * ```
 */
export const useStore = useCompositeStore;

/**
 * Renders a composite widget.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const useCompositeStore = Composite.useStore;
 * const store = useCompositeStore();
 * <Composite.Root store={store}>
 *   <Composite.Item>Item 1</Composite.Item>
 *   <Composite.Item>Item 2</Composite.Item>
 * </Composite.Root>
 * ```
 */
export const Root = Composite;

/**
 * Renders a group element for composite items.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const useCompositeStore = Composite.useStore;
 * const store = useCompositeStore();
 * <Composite.Root store={store}>
 *   <Composite.Group>
 *     <Composite.GroupLabel>Label</Composite.GroupLabel>
 *     <Composite.Item>Item 1</Composite.Item>
 *     <Composite.Item>Item 2</Composite.Item>
 *   </CompositeGroup>
 * </Composite.Root>
 * ```
 */
export const Group = CompositeGroup;

/**
 * Renders a label in a composite group. This component must be wrapped with
 * `CompositeGroup` so the `aria-labelledby` prop is properly set on the
 * composite group element.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const useCompositeStore = Composite.useStore;
 * const store = useCompositeStore();
 * <Composite.Root store={store}>
 *   <Composite.Group>
 *     <Composite.GroupLabel>Label</Composite.GroupLabel>
 *     <Composite.Item>Item 1</Composite.Item>
 *     <Composite.Item>Item 2</Composite.Item>
 *   </CompositeGroup>
 * </Composite.Root>
 * ```
 */
export const GroupLabel = CompositeGroupLabel;

/**
 * Renders a composite item.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const useCompositeStore = Composite.useStore;
 * const store = useCompositeStore();
 * <Composite.Root store={store}>
 *   <Composite.Item>Item 1</Composite.Item>
 *   <Composite.Item>Item 2</Composite.Item>
 *   <Composite.Item>Item 3</Composite.Item>
 * </Composite.Root>
 * ```
 */
export const Item = CompositeItem;

/**
 * Renders a composite row. Wrapping `Composite.Item` elements within
 * `Composite.Row` will create a two-dimensional composite widget, such as a
 * grid.
 * @see https://ariakit.org/components/composite
 * @example
 * ```jsx
 * const useCompositeStore = Composite.useStore;
 * const store = useCompositeStore();
 * <Composite.Root store={store}>
 *   <CompositeRow>
 *     <Composite.Item>Item 1.1</Composite.Item>
 *     <Composite.Item>Item 1.2</Composite.Item>
 *     <Composite.Item>Item 1.3</Composite.Item>
 *   </CompositeRow>
 *   <CompositeRow>
 *     <Composite.Item>Item 2.1</Composite.Item>
 *     <Composite.Item>Item 2.2</Composite.Item>
 *     <Composite.Item>Item 2.3</Composite.Item>
 *   </CompositeRow>
 * </Composite.Root>
 * ```
 */
export const Row = CompositeRow;

export type Store = CompositeStore;
export type StoreProps = CompositeStoreProps;
