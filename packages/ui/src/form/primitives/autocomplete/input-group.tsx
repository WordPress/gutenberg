import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteInputGroupProps } from './types';

/**
 * Wrapper around `Autocomplete.Input` that defines the visual control
 * boundary when the input is composed with prefix/suffix slots or other
 * elements. Without this wrapper, the popup anchors to the bare `<input>`
 * instead of the full control. Also adds `role="group"`.
 */
export const InputGroup = forwardRef<
	HTMLDivElement,
	AutocompleteInputGroupProps
>( function InputGroup( props, ref ) {
	return <_Autocomplete.InputGroup ref={ ref } { ...props } />;
} );
