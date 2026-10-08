import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { useState } from '@wordpress/element';
import type { AutocompleteRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';
import { AutocompleteGridContext } from './context';
import {
	KeyboardHighlightContext,
	isKeyboardOpenEvent,
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
	const [ keyboardHighlight, setKeyboardHighlight ] = useState( false );
	const handleOpenChange: NonNullable<
		AutocompleteRootProps[ 'onOpenChange' ]
	> = ( open, eventDetails ) => {
		props.onOpenChange?.( open, eventDetails );
		if ( open && ! eventDetails.isCanceled ) {
			setKeyboardHighlight(
				open &&
					( isKeyboardOpenEvent( eventDetails.event ) ||
						eventDetails.reason === 'input-change' )
			);
		}
	};
	const handleValueChange: NonNullable<
		AutocompleteRootProps[ 'onValueChange' ]
	> = ( value, eventDetails ) => {
		props.onValueChange?.( value, eventDetails );
		if (
			! eventDetails.isCanceled &&
			eventDetails.reason === 'input-change'
		) {
			setKeyboardHighlight( true );
		}
	};
	const handleItemHighlighted: NonNullable<
		AutocompleteRootProps[ 'onItemHighlighted' ]
	> = ( value, eventDetails ) => {
		setKeyboardHighlight( ( wasKeyboardHighlight ) =>
			eventDetails.index !== -1 && eventDetails.reason === 'none'
				? wasKeyboardHighlight
				: eventDetails.reason === 'keyboard'
		);
		props.onItemHighlighted?.( value, eventDetails );
	};

	return (
		<AutocompleteGridContext.Provider value={ Boolean( props.grid ) }>
			<DirectionProvider>
				<KeyboardHighlightContext.Provider value={ keyboardHighlight }>
					<_Autocomplete.Root
						{ ...props }
						onOpenChange={ handleOpenChange }
						onValueChange={ handleValueChange }
						onItemHighlighted={ handleItemHighlighted }
					/>
				</KeyboardHighlightContext.Provider>
			</DirectionProvider>
		</AutocompleteGridContext.Provider>
	);
};
