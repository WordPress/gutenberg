import { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { ComboboxRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';
import {
	InputFocusContext,
	useInputFocusState,
} from '../../../utils/item-popup/input-focus-context';

/**
 * Low-level primitive for a combobox that has an associated selection state.
 *
 * See `SearchableSelectControl` and `SearchableChipSelectControl` for standard
 * implementations of a single and multiple selection combobox.
 */
export function Root<
	Value,
	Multiple extends boolean | undefined = false,
	Item = Value,
>( props: ComboboxRootProps< Value, Multiple, Item > ) {
	const contextValue = useInputFocusState();

	return (
		<DirectionProvider>
			<InputFocusContext.Provider value={ contextValue }>
				<_Combobox.Root
					{ ...props }
					highlightItemOnHover={ props.highlightItemOnHover ?? false }
				/>
			</InputFocusContext.Provider>
		</DirectionProvider>
	);
}
