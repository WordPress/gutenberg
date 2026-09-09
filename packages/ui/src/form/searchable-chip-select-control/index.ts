import { SearchableChipSelectControl as _SearchableChipSelectControl } from './searchable-chip-select-control';
import { Group } from '../primitives/combobox/group';
import { GroupLabel } from '../primitives/combobox/group-label';
import { Item } from '../primitives/combobox/item';
import { ChipWithRemove } from '../primitives/combobox/chip-with-remove';
import { Collection } from '../primitives/combobox/collection';

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
		ChipWithRemove,
		Collection,
	}
);
