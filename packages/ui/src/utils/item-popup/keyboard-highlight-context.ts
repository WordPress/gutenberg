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
		'onFocusCapture' | 'onBlurCapture' | 'onKeyDown'
	>;
} >( {
	keyboardHighlight: false,
	inputProps: {},
} );

export const useKeyboardHighlight = () =>
	useContext( KeyboardHighlightContext );

export function useKeyboardHighlightState< Value >(
	props: Pick< _Combobox.Root.Props< Value >, 'onOpenChange' | 'grid' >
) {
	const [ keyboardHighlight, setKeyboardHighlight ] = useState( false );
	const [ inputFocused, setInputFocused ] = useState( false );
	const contextValue = useMemo(
		() => ( {
			keyboardHighlight: keyboardHighlight && inputFocused,
			inputProps: {
				onFocusCapture: () => setInputFocused( true ),
				onBlurCapture: () => setInputFocused( false ),
				onKeyDown: ( event: KeyboardEvent< HTMLInputElement > ) => {
					if (
						event.nativeEvent.isComposing ||
						event.which === 229
					) {
						return;
					}
					// Typing alone does not enable option rings. Navigation can
					// keep the same item active, so observe the key directly.
					if (
						[ 'ArrowUp', 'ArrowDown', 'Enter' ].includes(
							event.key
						) ||
						( props.grid &&
							[ 'ArrowLeft', 'ArrowRight' ].includes(
								event.key
							) )
					) {
						setKeyboardHighlight( true );
					}
				},
			},
		} ),
		[ keyboardHighlight, inputFocused, props.grid ]
	);
	const onOpenChange: NonNullable<
		_Combobox.Root.Props< Value >[ 'onOpenChange' ]
	> = ( open, eventDetails ) => {
		props.onOpenChange?.( open, eventDetails );
		if ( ! eventDetails.isCanceled ) {
			setKeyboardHighlight(
				open &&
					eventDetails.reason !== 'input-change' &&
					isKeyboardOpenEvent( eventDetails.event )
			);
		}
	};

	return { contextValue, onOpenChange };
}

function isKeyboardOpenEvent( event: Event ) {
	return (
		event.type === 'keydown' ||
		( event.type === 'click' && 'detail' in event && event.detail === 0 )
	);
}
