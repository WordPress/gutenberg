import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import type { ComboboxInputGroupProps } from './types';

/**
 * Wrapper around `Combobox.Input` that defines the visual control
 * boundary when the input is composed with prefix/suffix slots or other
 * elements. Without this wrapper, the popup anchors to the bare `<input>`
 * instead of the full control. Also adds `role="group"`.
 */
export const InputGroup = forwardRef< HTMLDivElement, ComboboxInputGroupProps >(
	function InputGroup( props, ref ) {
		return <_Combobox.InputGroup ref={ ref } { ...props } />;
	}
);
