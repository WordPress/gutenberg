import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import { Input as InputPrimitive } from '../input';
import { SearchIconSlot } from '../../../utils/search-icon-slot';
import type { ComboboxInputProps } from './types';

const DEFAULT_RENDER = ( props: ComboboxInputProps ) => (
	<InputPrimitive prefix={ <SearchIconSlot /> } { ...props } />
);

export const Input = forwardRef< HTMLInputElement, ComboboxInputProps >(
	function UnforwardedInput(
		{ render = DEFAULT_RENDER, ...restProps },
		ref
	) {
		return (
			<_Combobox.Input ref={ ref } render={ render } { ...restProps } />
		);
	}
);
