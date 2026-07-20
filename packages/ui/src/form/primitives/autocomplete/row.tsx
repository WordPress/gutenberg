import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteRowProps } from './types';

export const Row = forwardRef< HTMLDivElement, AutocompleteRowProps >(
	function Row( { children, ...restProps }, ref ) {
		return (
			<_Autocomplete.Row ref={ ref } { ...restProps }>
				{ children }
			</_Autocomplete.Row>
		);
	}
);
