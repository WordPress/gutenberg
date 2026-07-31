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
};

export type ItemGroup = {
	label: string;
	items: Item[];
};

export function isItemGroup( item: Item | ItemGroup ): item is ItemGroup {
	return 'items' in item;
}

export function isItem( item: Item | ItemGroup ): item is Item {
	return ! isItemGroup( item );
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
		 * array of groups instead of a flat list of items.
		 */
		items?: Item[] | ItemGroup[];
		/**
		 * A render function for custom rendering the list of matching items.
		 */
		children?: ComboboxCollectionProps[ 'children' ];
		/**
		 * Renders a creatable action in the list footer. The same item must
		 * also be included in `items` (as a flat item, or inside a group for
		 * grouped lists) so keyboard navigation works. Exclude it from the
		 * main list via `children`, and handle selection in `onValueChange`.
		 */
		creatableItem?: Item;
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
