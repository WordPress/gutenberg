import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';

/**
 * Returns the items currently visible after the autocomplete's client-side
 * filter.
 *
 * Call this from a descendant of `Autocomplete.Root`. Use it to announce a
 * result count through `Autocomplete.Status`.
 *
 * When you already supply the filtered list (for example from a server
 * request), you have the count and do not need this hook.
 */
export function useFilteredItems< T >(): T[] {
	return BaseAutocomplete.useFilteredItems< T >();
}
