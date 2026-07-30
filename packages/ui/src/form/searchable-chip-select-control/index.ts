import { SearchableChipSelectControl as _SearchableChipSelectControl } from './searchable-chip-select-control';
import { Group } from '../primitives/combobox/group';
import { GroupLabel } from '../primitives/combobox/group-label';
import { Item } from '../primitives/combobox/item';
import { ChipWithRemove } from '../primitives/combobox/chip-with-remove';
import { Collection } from '../primitives/combobox/collection';

Group.displayName = 'SearchableChipSelectControl.Group';
GroupLabel.displayName = 'SearchableChipSelectControl.GroupLabel';
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
		 * Groups related items together with an associated label rendered by
		 * `SearchableChipSelectControl.GroupLabel`.
		 */
		Group,
		/**
		 * Renders a label for a `SearchableChipSelectControl.Group`.
		 */
		GroupLabel,
		/**
		 * An item rendered inside a `SearchableChipSelectControl` popup.
		 */
		Item,
		/**
		 * A chip rendered inside a `SearchableChipSelectControl`.
		 */
		ChipWithRemove,
		/**
		 * Iterates over the items in a `SearchableChipSelectControl.Group`.
		 */
		Collection,
	}
);
