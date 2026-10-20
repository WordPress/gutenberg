import warning from '@wordpress/warning';
import type { SelectItem } from './types';

export function warnSelectControlProps(
	items: SelectItem[] | undefined
): void {
	if ( items?.some( ( item ) => item.value === '' ) ) {
		warning(
			'SelectControl: items with an empty string `value` show the placeholder when selected. Use `null` for an option that means no value (like "None"), or a non-empty value for an option that is a choice of its own (like "Default").'
		);
	}
}
