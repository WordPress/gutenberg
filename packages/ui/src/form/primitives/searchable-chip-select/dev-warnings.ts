import warning from '@wordpress/warning';
import type { ComboboxCollectionProps } from '../combobox/types';
import {
	findCreatableItems,
	hasGroupedItems,
	type Item,
	type ItemGroup,
} from './types';

export function warnSearchableChipSelectProps(
	items: Item[] | ItemGroup[] | undefined,
	children: ComboboxCollectionProps[ 'children' ] | undefined
): void {
	if ( ! items?.length ) {
		return;
	}

	const creatableItems = findCreatableItems( items );

	if ( creatableItems.length > 1 ) {
		warning(
			'SearchableChipSelect: expected at most one item with `creatable: true` in `items`.'
		);
	}

	if ( hasGroupedItems( items ) && ! children ) {
		warning(
			'SearchableChipSelect: grouped `items` require a `children` renderer. See the `Grouped` story for an example.'
		);
	}
}
