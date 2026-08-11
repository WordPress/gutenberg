import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { AutocompleteRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';

/**
 * Low-level primitive for an autocomplete input that suggests options as
 * you type. Unlike `Combobox`, the input can contain free-form text and
 * suggestions only optionally autocomplete the text.
 */
export function Root( props: AutocompleteRootProps ) {
	return (
		<DirectionProvider>
			<_Autocomplete.Root { ...props } />
		</DirectionProvider>
	);
}
