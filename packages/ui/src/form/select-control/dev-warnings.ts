import warning from '@wordpress/warning';
import type { SelectControlProps, SelectItem } from './types';

export function warnSelectControlProps(
	items: SelectItem[] | undefined,
	itemToStringValue: SelectControlProps[ 'itemToStringValue' ]
): void {
	if ( ! itemToStringValue && items?.some( ( item ) => item.value === '' ) ) {
		warning(
			'SelectControl: empty string item values are treated as empty selections by default. Use a non-empty item value or return a non-empty string from `itemToStringValue`. Use `null` for an option that clears the selection.'
		);
	}
}
