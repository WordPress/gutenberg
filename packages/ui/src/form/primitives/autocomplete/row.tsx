import { Autocomplete as _Autocomplete } from '@base-ui/react/autocomplete';
import { forwardRef } from '@wordpress/element';
import type { AutocompleteRowProps } from './types';

/**
 * Groups multiple `Autocomplete.Item` cells into a single row in a grid
 * layout. Enable `grid` on `Autocomplete.Root` to turn the listbox into a
 * grid and use two-dimensional keyboard navigation.
 */
export const Row = forwardRef< HTMLDivElement, AutocompleteRowProps >(
	function Row( { children, ...restProps }, ref ) {
		return (
			<_Autocomplete.Row ref={ ref } { ...restProps }>
				{ children }
			</_Autocomplete.Row>
		);
	}
);
