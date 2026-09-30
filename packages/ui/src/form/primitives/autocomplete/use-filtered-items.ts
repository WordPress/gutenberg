import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';

/**
 * Returns the items currently visible after the autocomplete's client-side
 * filter.
 *
 * Call this from a descendant of `Autocomplete.Root`.
 */
export function useFilteredItems< T >(): ReadonlyArray< T > {
	return BaseAutocomplete.useFilteredItems< T >();
}
