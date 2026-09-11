import { Combobox as BaseCombobox } from '@base-ui/react/combobox';

/**
 * Returns the items currently visible after the combobox's client-side filter.
 *
 * Call this from a descendant of `Combobox.Root`. Use it to announce a
 * result count through `Combobox.Status`.
 *
 * When you already supply the filtered list (for example from a server
 * request), you have the count and do not need this hook.
 *
 * The returned array is read-only and may share identity with the root's
 * `items`.
 */
export function useFilteredItems< T >(): ReadonlyArray< T > {
	return BaseCombobox.useFilteredItems< T >();
}
