import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { mergeProps } from '@base-ui/react/merge-props';
import { forwardRef } from '@wordpress/element';
import { Input as InputPrimitive } from '../input';
import type { AutocompleteInputProps } from './types';
import { useKeyboardHighlight } from '../../../utils/item-popup/keyboard-highlight-context';

const DEFAULT_RENDER = ( props: AutocompleteInputProps ) => (
	<InputPrimitive { ...props } />
);

export const Input = forwardRef< HTMLInputElement, AutocompleteInputProps >(
	function UnforwardedInput(
		{ render = DEFAULT_RENDER, ...restProps },
		ref
	) {
		const { inputProps } = useKeyboardHighlight();
		return (
			<_Autocomplete.Input
				ref={ ref }
				render={ render }
				{ ...mergeProps( inputProps, restProps ) }
			/>
		);
	}
);
