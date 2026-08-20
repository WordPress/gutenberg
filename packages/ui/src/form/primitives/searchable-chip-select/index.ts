import { ChipWithRemove } from '../combobox/chip-with-remove';
import { Item } from '../combobox/item';
import { SearchableChipSelect as _SearchableChipSelect } from './searchable-chip-select';

Item.displayName = 'SearchableChipSelect.Item';
ChipWithRemove.displayName = 'SearchableChipSelect.ChipWithRemove';

export const SearchableChipSelect = Object.assign( _SearchableChipSelect, {
	Item,
	ChipWithRemove,
} );
