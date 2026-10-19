import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { AutocompleteRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';
import { AutocompleteGridContext } from './context';
import {
	InputFocusContext,
	useInputFocusState,
} from '../../../utils/item-popup/input-focus-context';

/**
 * Low-level primitive for an autocomplete input that suggests options as
 * you type. Unlike `Combobox`, the input can contain free-form text and
 * suggestions only optionally autocomplete the text.
 *
 * There are currently no plans for higher-level components of this primitive in this package.
 * Use the primitives directly, and remember to label the input field,
 * usually by using the `Field` component.
 */
export const Root: typeof _Autocomplete.Root = function Root(
	props: AutocompleteRootProps
) {
	const contextValue = useInputFocusState();

	return (
		<AutocompleteGridContext.Provider value={ Boolean( props.grid ) }>
			<DirectionProvider>
				<InputFocusContext.Provider value={ contextValue }>
					<_Autocomplete.Root
						{ ...props }
						highlightItemOnHover={
							props.highlightItemOnHover ?? false
						}
					/>
				</InputFocusContext.Provider>
			</DirectionProvider>
		</AutocompleteGridContext.Provider>
	);
};
