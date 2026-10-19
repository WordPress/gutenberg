import type { Combobox as _Combobox } from '@base-ui/react/combobox';
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from '@wordpress/element';

export const InputFocusContext = createContext< {
	inputFocused: boolean;
	inputProps: Pick<
		_Combobox.Input.Props,
		'onFocusCapture' | 'onBlurCapture'
	>;
} >( {
	inputFocused: false,
	inputProps: {},
} );

export const useInputFocus = () => useContext( InputFocusContext );

export function useInputFocusState() {
	const [ inputFocused, setInputFocused ] = useState( false );
	return useMemo(
		() => ( {
			inputFocused,
			inputProps: {
				onFocusCapture: () => setInputFocused( true ),
				onBlurCapture: () => setInputFocused( false ),
			},
		} ),
		[ inputFocused ]
	);
}
