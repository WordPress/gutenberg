import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteTriggerProps } from './types';

/**
 * A button that opens the popup. Use it when `Autocomplete.Input` lives
 * inside `Autocomplete.Popup`, such as a picker opened from a toolbar
 * button. The button is unstyled, so pass a `render` element for its look.
 */
export const Trigger = forwardRef<
	HTMLButtonElement,
	AutocompleteTriggerProps
>( function UnforwardedTrigger( props, ref ) {
	return <_Autocomplete.Trigger ref={ ref } { ...props } />;
} );
