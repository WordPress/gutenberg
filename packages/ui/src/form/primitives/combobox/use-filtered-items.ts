import { Combobox as BaseCombobox } from '@base-ui/react/combobox';

/**
 * Returns the items currently visible after the combobox's client-side filter.
 *
 * Call this from a descendant of `Combobox.Root`, including composites such as
 * `SearchableSelect` and `SearchableChipSelect`. Those composites already
 * announce a visually hidden result count; use this hook when composing
 * `Combobox` or `Autocomplete` directly, or when supplying custom
 * `statusContent`.
 *
 * When you already supply the filtered list (for example from a server
 * request), you have the count and do not need this hook.
 */
export function useFilteredItems< T >(): T[] {
	return BaseCombobox.useFilteredItems< T >();
}
