import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { useState } from '@wordpress/element';
import type { ComboboxRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';
import {
	KeyboardHighlightContext,
	isKeyboardOpenEvent,
} from '../../../utils/item-popup/keyboard-highlight-context';

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
	const [ keyboardHighlight, setKeyboardHighlight ] = useState( false );
	const handleOpenChange: NonNullable<
		ComboboxRootProps< Value, Multiple, Item >[ 'onOpenChange' ]
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
	const handleInputValueChange: NonNullable<
		ComboboxRootProps< Value, Multiple, Item >[ 'onInputValueChange' ]
	> = ( value, eventDetails ) => {
		props.onInputValueChange?.( value, eventDetails );
		if (
			! eventDetails.isCanceled &&
			eventDetails.reason === 'input-change'
		) {
			setKeyboardHighlight( true );
		}
	};
	const handleItemHighlighted: NonNullable<
		ComboboxRootProps< Value, Multiple, Item >[ 'onItemHighlighted' ]
	> = ( value, eventDetails ) => {
		setKeyboardHighlight( ( wasKeyboardHighlight ) =>
			eventDetails.index !== -1 && eventDetails.reason === 'none'
				? wasKeyboardHighlight
				: eventDetails.reason === 'keyboard'
		);
		props.onItemHighlighted?.( value, eventDetails );
	};

	return (
		<DirectionProvider>
			<KeyboardHighlightContext.Provider value={ keyboardHighlight }>
				<_Combobox.Root
					{ ...props }
					onOpenChange={ handleOpenChange }
					onInputValueChange={ handleInputValueChange }
					onItemHighlighted={ handleItemHighlighted }
				/>
			</KeyboardHighlightContext.Provider>
		</DirectionProvider>
	);
}
