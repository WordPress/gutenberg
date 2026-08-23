import { Item } from '../combobox/item';
import { ChipWithRemove } from '../combobox/chip-with-remove';
import { Group } from '../combobox/group';
import { GroupLabel } from '../combobox/group-label';
import { Collection } from '../combobox/collection';
import { SearchableChipSelect as _SearchableChipSelect } from './searchable-chip-select';

Item.displayName = 'SearchableChipSelect.Item';
ChipWithRemove.displayName = 'SearchableChipSelect.ChipWithRemove';
Group.displayName = 'SearchableChipSelect.Group';
GroupLabel.displayName = 'SearchableChipSelect.GroupLabel';

export const SearchableChipSelect = Object.assign( _SearchableChipSelect, {
	Item,
	ChipWithRemove,
	Group,
	GroupLabel,
	Collection,
} );
