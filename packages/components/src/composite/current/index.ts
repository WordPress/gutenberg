/**
 * Composite is a component that may contain navigable items represented by
 * CompositeItem. It's inspired by the WAI-ARIA Composite Role and implements
 * all the keyboard navigation mechanisms to ensure that there's only one
 * tab stop for the whole Composite element. This means that it can behave as
 * a roving tabindex or aria-activedescendant container.
 *
 * @see https://ariakit.org/components/composite
 */

export {
	Composite,
	CompositeGroup,
	CompositeGroupLabel,
	CompositeItem,
	CompositeRow,
	useCompositeStore,
} from '@ariakit/react';

export type { CompositeStore, CompositeStoreProps } from '@ariakit/react';
