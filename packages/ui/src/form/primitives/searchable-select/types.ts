import type { ItemPopupWidthProps } from '../../../utils/css/item-popup';
import type {
	ComboboxCollectionProps,
	ComboboxEmptyProps,
	ComboboxInputProps,
	ComboboxRootProps,
	ComboboxTriggerProps,
} from '../combobox/types';

export type Item = {
	label: string;
	value: string;
	disabled?: boolean;
	creatable?: boolean;
};

type CreatableItem = Item & { creatable: true };

export function isCreatableItem( item: Item ): item is CreatableItem {
	return item.creatable === true;
}

export function findCreatableItem(
	items: Item[] | undefined
): CreatableItem | undefined {
	return items?.find( isCreatableItem );
}

export function normalizeRootItems(
	items: Item[] | undefined
): Item[] | undefined {
	if ( ! items ) {
		return items;
	}

	const creatableItems = items.filter( isCreatableItem );
	const regularItems = items.filter( ( item ) => ! isCreatableItem( item ) );

	return [ ...regularItems, ...creatableItems ];
}

export type SearchableSelectProps = Omit<
	ComboboxRootProps< Item, false >,
	'children' | 'items' | 'multiple'
> &
	ItemPopupWidthProps &
	Pick<
		ComboboxTriggerProps,
		'aria-label' | 'aria-labelledby' | 'aria-describedby'
	> & {
		/**
		 * The array of option items.
		 *
		 * Mark a creatable action with `creatable: true`. It renders in the
		 * list footer and is excluded from the main list automatically.
		 */
		items?: Item[];
		/**
		 * A render function for custom rendering the list of matching items.
		 */
		children?: ComboboxCollectionProps[ 'children' ];
		/**
		 * The custom trigger content to use instead of the default.
		 *
		 * ```jsx
		 * triggerContent={ ( value ) => (
		 *   <span>
		 *     <Icon icon={ wordpress } />
		 *     { value }
		 *   </span>
		 * ) }
		 * ```
		 */
		triggerContent?: ComboboxTriggerProps[ 'children' ];
		/**
		 * The custom content to use instead of the default empty state,
		 * which shows whenever there are no matching items.
		 */
		emptyContent?: ComboboxEmptyProps[ 'children' ];
		/**
		 * The placeholder text to use for the search input.
		 */
		searchPlaceholder?: ComboboxInputProps[ 'placeholder' ];
	};
