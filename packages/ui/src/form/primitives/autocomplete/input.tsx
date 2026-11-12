import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import { Input as InputPrimitive } from '../input';
import type { AutocompleteInputProps } from './types';
import { useAutocompletePopupContext } from './context';

const DEFAULT_RENDER = ( props: AutocompleteInputProps ) => (
	<InputPrimitive { ...props } />
);

export const Input = forwardRef< HTMLInputElement, AutocompleteInputProps >(
	function UnforwardedInput(
		{ render = DEFAULT_RENDER, ...restProps },
		ref
	) {
		const isInsidePopup = useAutocompletePopupContext();
		if ( process.env.NODE_ENV !== 'production' && isInsidePopup ) {
			throw new Error(
				'Autocomplete.Input: Cannot be rendered inside Autocomplete.Popup, which is the suggestion list for an input outside it. For a searchable picker that opens from a button, render <Autocomplete.Root inline open> inside a <Popover.Popup> instead.'
			);
		}

		return (
			<_Autocomplete.Input
				ref={ ref }
				render={ render }
				{ ...restProps }
			/>
		);
	}
);
