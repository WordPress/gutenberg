import { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ComboboxRootProps } from './types';

/**
 * Low-level primitive for a combobox that has an associated selection state.
 *
 * See `SearchableSelectControl` and `SearchableChipSelectControl` for standard
 * implementations of a single and multiple selection combobox.
 */
export function Root< Value, Multiple extends boolean | undefined = false >(
	props: ComboboxRootProps< Value, Multiple >
) {
	return <_Combobox.Root { ...props } />;
}
