import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { AutocompleteValueProps } from './types';

export function Value( props: AutocompleteValueProps ) {
	return <_Autocomplete.Value { ...props } />;
}
