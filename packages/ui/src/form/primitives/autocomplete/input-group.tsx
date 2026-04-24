import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteInputGroupProps } from './types';

export const InputGroup = forwardRef<
	HTMLDivElement,
	AutocompleteInputGroupProps
>( function InputGroup( props, ref ) {
	return <_Autocomplete.InputGroup ref={ ref } { ...props } />;
} );
