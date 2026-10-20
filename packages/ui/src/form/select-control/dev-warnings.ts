import warning from '@wordpress/warning';
import type { SelectControlProps, SelectItem } from './types';

export function warnSelectControlProps(
	items: SelectItem[] | undefined,
	itemToStringValue: SelectControlProps[ 'itemToStringValue' ]
): void {
	// A custom serializer that gives the item a non-empty value avoids the
	// placeholder, like it does for the select.
	const isEmpty = ( item: SelectItem ) =>
		item.value === '' &&
		( ! itemToStringValue || ( itemToStringValue( item ) ?? '' ) === '' );
	if ( items?.some( isEmpty ) ) {
		warning(
			'SelectControl: items with an empty string `value` show the placeholder when selected. Use `null` for an option that means no value (like "None"), or a non-empty value for an option that is a choice of its own (like "Default").'
		);
	}
}
