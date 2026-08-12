import type { ReactNode } from 'react';
import type {
	ComboboxCollectionProps,
	ComboboxEmptyProps,
	ComboboxInputProps,
	ComboboxRootProps,
} from '../combobox/types';

export type RegularItem = {
	label: string;
	value: string;
	disabled?: boolean;
	creatable?: never;
};

export type CreatableItem = {
	label: string;
	value: string;
	disabled?: boolean;
	creatable: true;
};

export type Item = RegularItem | CreatableItem;

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
	if ( ! items ) {
		return undefined;
	}

	for ( const entry of items ) {
		if ( isItemGroup( entry ) ) {
			const creatableItem = entry.items.find( isCreatableItem );
			if ( creatableItem ) {
				return creatableItem;
			}
			continue;
		}

		if ( isCreatableItem( entry ) ) {
			return entry;
		}
	}

	return undefined;
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
	if ( ! items || hasGroupedItems( items ) ) {
		return items;
	}

	const creatableItems = items.filter( isCreatableItem );
	const regularItems = items.filter( ( item ) => ! isCreatableItem( item ) );

	return [ ...regularItems, ...creatableItems ];
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
		 * The array of option items. When using grouped `children`, pass an
		 * array of groups instead of a flat list of items. Mark a creatable
		 * action with `creatable: true`; it renders in the list footer and is
		 * excluded from the main list automatically.
		 */
		items?: Item[] | ItemGroup[];
		/**
		 * A render function for custom rendering the list of matching items.
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
