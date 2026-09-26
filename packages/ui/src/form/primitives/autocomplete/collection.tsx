import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { AutocompleteCollectionProps } from './types';

export function Collection( {
	children,
	...restProps
}: AutocompleteCollectionProps ) {
	return (
		<_Autocomplete.Collection { ...restProps }>
			{ children }
		</_Autocomplete.Collection>
	);
}
