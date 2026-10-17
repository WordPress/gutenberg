import type { Combobox as _Combobox } from '@base-ui/react/combobox';
import type { KeyboardEvent } from 'react';
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';

export const KeyboardHighlightContext = createContext< {
	keyboardHighlight: boolean;
	inputProps: Pick<
		_Combobox.Input.Props,
		| 'onFocusCapture'
		| 'onBlurCapture'
		| 'onPointerDownCapture'
		| 'onKeyDown'
	>;
	listProps: Pick<
		_Combobox.List.Props,
		'onPointerMoveCapture' | 'onPointerDownCapture'
	>;
} >( {
	keyboardHighlight: false,
	inputProps: {},
	listProps: {},
} );

export const useKeyboardHighlight = () =>
	useContext( KeyboardHighlightContext );

type HighlightCallbacks< Value > = Pick<
	_Combobox.Root.Props< Value >,
	'onOpenChange' | 'onInputValueChange' | 'onItemHighlighted'
>;

export function useKeyboardHighlightState< Value >(
	props: HighlightCallbacks< Value >
) {
	const [ keyboardHighlight, setKeyboardHighlight ] = useState( false );
	const [ inputFocused, setInputFocused ] = useState( false );
	const keyboardHighlightContext = useMemo( () => {
		const onPointerHighlight = () => setKeyboardHighlight( false );
		return {
			keyboardHighlight: keyboardHighlight && inputFocused,
			inputProps: {
				onFocusCapture: () => setInputFocused( true ),
				onBlurCapture: () => setInputFocused( false ),
				onPointerDownCapture: onPointerHighlight,
				onKeyDown: ( event: KeyboardEvent< HTMLInputElement > ) => {
					if (
						event.nativeEvent.isComposing ||
						event.which === 229
					) {
						return;
					}
					// Grid navigation can keep the same item without a highlight callback.
					if (
						event.key === 'ArrowUp' ||
						event.key === 'ArrowDown'
					) {
						setKeyboardHighlight( true );
					}
				},
			},
			listProps: {
				onPointerMoveCapture: onPointerHighlight,
				onPointerDownCapture: onPointerHighlight,
			},
		};
	}, [ keyboardHighlight, inputFocused ] );
	const handleOpenChange: NonNullable<
		HighlightCallbacks< Value >[ 'onOpenChange' ]
	> = ( open, eventDetails ) => {
		props.onOpenChange?.( open, eventDetails );
		if ( open && ! eventDetails.isCanceled ) {
			setKeyboardHighlight(
				isKeyboardOpenEvent( eventDetails.event ) ||
					eventDetails.reason === 'input-change'
			);
		}
	};
	const handleInputValueChange: NonNullable<
		HighlightCallbacks< Value >[ 'onInputValueChange' ]
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
		HighlightCallbacks< Value >[ 'onItemHighlighted' ]
	> = ( value, eventDetails ) => {
		setKeyboardHighlight( ( wasKeyboardHighlight ) =>
			eventDetails.reason === 'none'
				? wasKeyboardHighlight
				: eventDetails.reason === 'keyboard'
		);
		props.onItemHighlighted?.( value, eventDetails );
	};

	return {
		contextValue: keyboardHighlightContext,
		onOpenChange: handleOpenChange,
		onInputValueChange: handleInputValueChange,
		onItemHighlighted: handleItemHighlighted,
	};
}

function isKeyboardOpenEvent( event: Event ) {
	return (
		event.type === 'keydown' ||
		( event.type === 'click' && 'detail' in event && event.detail === 0 )
	);
}
