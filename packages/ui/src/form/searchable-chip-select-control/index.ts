import { ChipWithRemove } from '../primitives/combobox/chip-with-remove';
import { Item } from '../primitives/combobox/item';
import { SearchableChipSelectControl as _SearchableChipSelectControl } from './searchable-chip-select-control';

Item.displayName = 'SearchableChipSelectControl.Item';
ChipWithRemove.displayName = 'SearchableChipSelectControl.ChipWithRemove';

/**
 * A complete searchable multi-select field with chips, integrated label,
 * and description.
 */
export const SearchableChipSelectControl = Object.assign(
	_SearchableChipSelectControl,
	{
		/**
		 * An item rendered inside a `SearchableChipSelectControl` popup.
		 */
		Item,
		/**
		 * A chip rendered inside a `SearchableChipSelectControl`.
		 */
		ChipWithRemove,
	}
);
