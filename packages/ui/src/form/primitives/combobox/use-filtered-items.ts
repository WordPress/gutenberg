import { Combobox as BaseCombobox } from '@base-ui/react/combobox';

/**
 * Returns the items currently visible after the combobox's client-side filter.
 *
 * Call this from a descendant of `Combobox.Root`. Use it to announce a
 * result count through `Combobox.Status`.
 *
 * When you already supply the filtered list (for example from a server
 * request), you have the count and do not need this hook.
 */
export function useFilteredItems< T >(): T[] {
	return BaseCombobox.useFilteredItems< T >();
}
