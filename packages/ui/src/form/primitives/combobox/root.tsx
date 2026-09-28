import { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ComboboxRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';

/**
 * Low-level primitive for a combobox that has an associated selection state.
 *
 * See `SearchableSelectControl` and `SearchableChipSelectControl` for standard
 * implementations of a single and multiple selection combobox.
 */
export function Root< Value, Multiple extends boolean | undefined = false >(
	props: ComboboxRootProps< Value, Multiple >
) {
	return (
		<DirectionProvider>
			<_Combobox.Root { ...props } />
		</DirectionProvider>
	);
}
