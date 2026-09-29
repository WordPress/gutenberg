import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import type { AutocompleteRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';
import { AutocompleteGridContext } from './context';
import { useIframeOutsidePressBridge } from '../../../utils/use-iframe-dismissal-bridge';

/**
 * Low-level primitive for an autocomplete input that suggests options as
 * you type. Unlike `Combobox`, the input can contain free-form text and
 * suggestions only optionally autocomplete the text.
 *
 * There are currently no plans for higher-level components of this primitive in this package.
 * Use the primitives directly, and remember to label the input field,
 * usually by using the `Field` component.
 */
export function Root( props: AutocompleteRootProps ) {
	const iframeDismissalProps =
		useIframeOutsidePressBridge< _Autocomplete.Root.ChangeEventDetails >( {
			defaultOpen: props.defaultOpen,
			disabled: props.disabled,
			modal: props.modal ?? false,
			onOpenChange: ( nextOpen, eventDetails ) =>
				props.onOpenChange?.( nextOpen, eventDetails ),
			open: props.open,
		} );

	return (
		<AutocompleteGridContext.Provider value={ Boolean( props.grid ) }>
			<DirectionProvider>
				<_Autocomplete.Root { ...props } { ...iframeDismissalProps } />
			</DirectionProvider>
		</AutocompleteGridContext.Provider>
	);
}
