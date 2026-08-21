import type { ReactNode } from 'react';
import type {
	ComboboxCollectionProps,
	ComboboxEmptyProps,
	ComboboxInputProps,
	ComboboxRootProps,
} from '../combobox/types';

export type Item = {
	label: string;
	value: string;
	disabled?: boolean;
	creatable?: boolean;
};

type CreatableItem = Item & { creatable: true };

export type ItemGroup = {
	label: string;
	items: Item[];
};

export function isItemGroup( item: Item | ItemGroup ): item is ItemGroup {
	return 'items' in item && Array.isArray( item.items );
}

export function isItem( item: Item | ItemGroup ): item is Item {
	return ! isItemGroup( item );
}

export function isCreatableItem( item: Item ): item is CreatableItem {
	return item.creatable === true;
}

export function findCreatableItem(
	items: Item[] | ItemGroup[] | undefined
): CreatableItem | undefined {
	return findCreatableItems( items )[ 0 ];
}

export function findCreatableItems(
	items: Item[] | ItemGroup[] | undefined
): CreatableItem[] {
	if ( ! items ) {
		return [];
	}

	const creatableItems: CreatableItem[] = [];

	for ( const entry of items ) {
		if ( isItemGroup( entry ) ) {
			creatableItems.push( ...entry.items.filter( isCreatableItem ) );
			continue;
		}

		if ( isCreatableItem( entry ) ) {
			creatableItems.push( entry );
		}
	}

	return creatableItems;
}

export function hasGroupedItems(
	items: Item[] | ItemGroup[] | undefined
): boolean {
	return ( items ?? [] ).some( isItemGroup );
}

export function shouldSkipCollectionEntry(
	entry: Item | ItemGroup,
	creatableItem: CreatableItem | undefined
): boolean {
	if ( ! creatableItem ) {
		return false;
	}

	if ( isItem( entry ) ) {
		return isCreatableItem( entry );
	}

	return (
		entry.items.length > 0 &&
		entry.items.every( ( item ) => isCreatableItem( item ) )
	);
}

export function normalizeRootItems(
	items: Item[] | ItemGroup[] | undefined
): Item[] | ItemGroup[] | undefined {
	if ( ! items ) {
		return items;
	}

	if ( ! hasGroupedItems( items ) ) {
		const flatItems = items as Item[];
		const creatableItems = flatItems.filter( isCreatableItem );
		const regularItems = flatItems.filter(
			( item ) => ! isCreatableItem( item )
		);

		return [ ...regularItems, ...creatableItems ];
	}

	const creatableItem = findCreatableItem( items );

	if ( ! creatableItem ) {
		return items;
	}

	const groupsWithoutCreatable: ItemGroup[] = [];
	let creatableOnlyGroup: ItemGroup | undefined;

	for ( const entry of items ) {
		if ( ! isItemGroup( entry ) ) {
			continue;
		}

		const regularItems = entry.items.filter(
			( item ) => ! isCreatableItem( item )
		);
		const isCreatableOnly =
			entry.items.length > 0 &&
			entry.items.every( ( item ) => isCreatableItem( item ) );

		if ( isCreatableOnly ) {
			creatableOnlyGroup = entry;
			continue;
		}

		if ( regularItems.length > 0 ) {
			groupsWithoutCreatable.push( {
				...entry,
				items: regularItems,
			} );
		}
	}

	const creatableGroup = creatableOnlyGroup ?? {
		label: '',
		items: [ creatableItem ],
	};

	return [ ...groupsWithoutCreatable, creatableGroup ];
}

export type SearchableChipSelectProps = Omit<
	ComboboxRootProps< Item, true >,
	'children' | 'items' | 'multiple'
> &
	Partial<
		Pick<
			ComboboxInputProps,
			'aria-label' | 'aria-labelledby' | 'aria-describedby'
		>
	> & {
		/**
		 * The array of option items.
		 *
		 * When using grouped `children`, pass an array of groups instead of a
		 * flat list of items. Grouped items require a custom `children` renderer.
		 *
		 * Mark a creatable action with  `creatable: true`. It renders in the
		 * list footer and is excluded from the main list automatically.
		 */
		items?: Item[] | ItemGroup[];
		/**
		 * A render function for custom rendering the list of matching items.
		 * Required when `items` contains groups.
		 */
		children?: ComboboxCollectionProps[ 'children' ];
		/**
		 * A render function for custom rendering the selected chips.
		 *
		 * ```jsx
		 * chipsContent={ ( value ) =>
		 *   value.map( ( item ) => (
		 *     <SearchableChipSelect.ChipWithRemove key={ item.value }>
		 *       <Icon icon={ wordpress } />
		 *       { item.label }
		 *     </SearchableChipSelect.ChipWithRemove>
		 *   ) )
		 * }
		 * ```
		 */
		chipsContent?: ( value: Item[] ) => ReactNode;
		/**
		 * The custom content to use instead of the default empty state,
		 * which shows whenever there are no matching items.
		 */
		emptyContent?: ComboboxEmptyProps[ 'children' ];
		/**
		 * The placeholder text to use for the search input.
		 */
		searchPlaceholder?: ComboboxInputProps[ 'placeholder' ];
		/**
		 * Whether to show the clear button to remove all selected items.
		 *
		 * @default true
		 */
		showClearButton?: boolean;
		/**
		 * The aria-label for the clear button.
		 */
		clearButtonLabel?: string;
	};
