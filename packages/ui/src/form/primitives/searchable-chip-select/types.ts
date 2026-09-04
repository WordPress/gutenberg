import type { ReactNode } from 'react';
import type { ItemPopupWidth } from '../../../utils/css/item-popup';
import type {
	ComboboxCollectionProps,
	ComboboxEmptyProps,
	ComboboxInputProps,
	ComboboxRootProps,
} from '../combobox/types';
import type { Item, ItemGroup } from '../searchable-collection';

export type { Item, ItemGroup } from '../searchable-collection';

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
