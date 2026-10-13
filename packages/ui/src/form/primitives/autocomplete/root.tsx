import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { AutocompleteRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';
import { AutocompleteGridContext } from './context';
import {
	KeyboardHighlightContext,
	useKeyboardHighlightState,
} from '../../../utils/item-popup/keyboard-highlight-context';

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
	const {
		contextValue,
		onOpenChange,
		onInputValueChange,
		onItemHighlighted,
	} = useKeyboardHighlightState( {
		onOpenChange: props.onOpenChange,
		onInputValueChange: props.onValueChange,
		onItemHighlighted: props.onItemHighlighted,
	} );

	return (
		<AutocompleteGridContext.Provider value={ Boolean( props.grid ) }>
			<DirectionProvider>
				<KeyboardHighlightContext.Provider value={ contextValue }>
					<_Autocomplete.Root
						{ ...props }
						onOpenChange={ onOpenChange }
						onValueChange={ onInputValueChange }
						onItemHighlighted={ onItemHighlighted }
					/>
				</KeyboardHighlightContext.Provider>
			</DirectionProvider>
		</AutocompleteGridContext.Provider>
	);
};
