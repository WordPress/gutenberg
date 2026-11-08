import { forwardRef } from '@wordpress/element';
import { Select } from '../primitives';
import type { SelectControlTriggerProps } from './types';

/**
 * The trigger button for a `SelectControl`.
 */
export const Trigger = forwardRef<
	HTMLButtonElement,
	SelectControlTriggerProps
>( function UnforwardedTrigger( props, ref ) {
	return <Select.Trigger ref={ ref } { ...props } />;
} );
