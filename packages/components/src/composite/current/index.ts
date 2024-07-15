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

// Exports
export const useStore = useCompositeStore;
export const Root = Composite;
export const Group = CompositeGroup;
export const GroupLabel = CompositeGroupLabel;
export const Item = CompositeItem;
export const Row = CompositeRow;

export type Store = CompositeStore;
export type StoreProps = CompositeStoreProps;
