import { Combobox as BaseCombobox } from '@base-ui/react/combobox';

/**
 * Returns the items currently visible after the combobox's client-side filter.
 *
 * Call this from a descendant of `Combobox.Root`.
 */
export function useFilteredItems< T >(): ReadonlyArray< T > {
	return BaseCombobox.useFilteredItems< T >();
}
