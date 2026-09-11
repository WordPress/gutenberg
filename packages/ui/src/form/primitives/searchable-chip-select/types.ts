import type { ReactNode } from 'react';
import type { ItemPopupWidth } from '../../../utils/css/item-popup';
import type {
	ComboboxCollectionProps,
	ComboboxEmptyProps,
	ComboboxInputProps,
	ComboboxRootProps,
	ComboboxStatusProps,
} from '../combobox/types';

export type Item = {
	label: string;
	value: string;
	disabled?: boolean;
	/**
	 * When `true`, the item renders in the list footer, not the main list,
	 * when it is in the filtered items.
	 */
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

export function isCreatableItem( item: Item ): item is CreatableItem {
	return item.creatable === true;
}

export function findCreatableItems(
	items: ReadonlyArray< Item | ItemGroup > | undefined
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
	items: ReadonlyArray< Item | ItemGroup > | undefined
): boolean {
	return ( items ?? [] ).some( isItemGroup );
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
		 * Controls how the popup width is constrained relative to its anchor.
		 *
		 * For all presets, the popup is never narrower than its anchor.
		 *
		 * - `'anchor'`: Fixed width matching the anchor width.
		 * - `'content'`: Width grows with item labels between the anchor and available
		 *   viewport bounds.
		 * - `'sm'`: Fixed width at the small surface width token (`--wpds-dimension-surface-width-sm`).
		 * - `'md'`: Fixed width at the medium surface width token (`--wpds-dimension-surface-width-md`).
		 * - `'lg'`: Fixed width at the large surface width token (`--wpds-dimension-surface-width-lg`).
		 * - `'available'`: Fixed width at the available viewport width (`--available-width`).
		 *
		 * @default 'anchor'
		 */
		popupWidth?: ItemPopupWidth;
		/**
		 * The array of option items.
		 *
		 * When using grouped `children`, pass an array of groups instead of a
		 * flat list of items. Grouped items require a custom `children` renderer.
		 *
		 * Mark a creatable action with `creatable: true`. It renders in the
		 * list footer, not the main list, when it is in the filtered items.
		 * Handle the creation of the item in `onValueChange`.
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
		 * Content for the list status live region. The region stays mounted.
		 * Pass custom content such as a loading message. Use `emptyContent`
		 * for the empty list. For a result count after an async load, pass
		 * visually hidden text here using `useFilteredItems`.
		 */
		statusContent?: ComboboxStatusProps[ 'children' ];
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
