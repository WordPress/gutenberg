import { forwardRef } from '@wordpress/element';
import { Trigger as ComboboxTrigger } from '../combobox/trigger';
import type { SearchableSelectTriggerProps } from './types';

/**
 * The trigger button for a `SearchableSelect`.
 */
export const Trigger = forwardRef<
	HTMLButtonElement,
	SearchableSelectTriggerProps
>( function UnforwardedTrigger( props, ref ) {
	return <ComboboxTrigger ref={ ref } { ...props } />;
} );
