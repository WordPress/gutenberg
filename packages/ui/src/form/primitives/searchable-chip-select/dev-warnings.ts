import warning from '@wordpress/warning';
import type { ComboboxCollectionProps } from '../combobox/types';
import {
	findCreatableItems,
	hasGroupedItems,
	isCreatableItem,
	isItemGroup,
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

	if ( ! hasGroupedItems( items ) ) {
		const flatItems = items as Item[];
		let lastCreatableIndex = -1;

		for ( let index = flatItems.length - 1; index >= 0; index-- ) {
			if ( isCreatableItem( flatItems[ index ] ) ) {
				lastCreatableIndex = index;
				break;
			}
		}

		if (
			lastCreatableIndex >= 0 &&
			lastCreatableIndex !== flatItems.length - 1
		) {
			warning(
				'SearchableChipSelect: the creatable item should be last in `items` for predictable keyboard navigation.'
			);
		}
	}

	for ( const entry of items ) {
		if ( ! isItemGroup( entry ) ) {
			continue;
		}

		const hasCreatable = entry.items.some( isCreatableItem );
		const hasRegular = entry.items.some(
			( item ) => ! isCreatableItem( item )
		);

		if ( hasCreatable && hasRegular ) {
			warning(
				'SearchableChipSelect: creatable items should be in their own group, not mixed with regular items.'
			);
			break;
		}
	}
}
