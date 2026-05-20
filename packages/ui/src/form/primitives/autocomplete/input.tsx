import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import { Input as InputPrimitive } from '../input';
import type { AutocompleteInputProps } from './types';

const DEFAULT_RENDER = ( props: AutocompleteInputProps ) => (
	<InputPrimitive { ...props } />
);

export const Input = forwardRef< HTMLInputElement, AutocompleteInputProps >(
	function Input( { render = DEFAULT_RENDER, ...restProps }, ref ) {
		return (
			<_Autocomplete.Input
				ref={ ref }
				render={ render }
				{ ...restProps }
			/>
		);
	}
);
