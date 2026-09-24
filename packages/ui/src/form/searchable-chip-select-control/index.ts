import { SearchableChipSelectControl as _SearchableChipSelectControl } from './searchable-chip-select-control';
import { Group } from '../primitives/combobox/group';
import { GroupLabel } from '../primitives/combobox/group-label';
import { Item } from '../primitives/combobox/item';
import { ItemDescription } from '../primitives/combobox/item-description';
import { ItemLabel } from '../primitives/combobox/item-label';
import { ChipWithRemove } from '../primitives/combobox/chip-with-remove';
import { Collection } from '../primitives/combobox/collection';
import { useFilteredItems } from '../primitives/combobox/use-filtered-items';

Item.displayName = 'SearchableChipSelectControl.Item';
ItemLabel.displayName = 'SearchableChipSelectControl.ItemLabel';
ItemDescription.displayName = 'SearchableChipSelectControl.ItemDescription';

/**
 * A complete searchable multi-select field with chips, integrated label,
 * and description.
 */
export const SearchableChipSelectControl = Object.assign(
	_SearchableChipSelectControl,
	{
		Group,
		GroupLabel,
		Item,
		ItemLabel,
		ItemDescription,
		ChipWithRemove,
		Collection,
		useFilteredItems,
	}
);
