import { SearchableSelectControl as _SearchableSelectControl } from './searchable-select-control';
import { Group } from '../primitives/combobox/group';
import { GroupLabel } from '../primitives/combobox/group-label';
import { Item } from '../primitives/searchable-select/item';
import { Collection } from '../primitives/combobox/collection';
import { useFilteredItems } from '../primitives/combobox/use-filtered-items';

/**
 * A complete searchable select field with integrated label and description.
 */
export const SearchableSelectControl = Object.assign(
	_SearchableSelectControl,
	{
		Group,
		GroupLabel,
		Item,
		Collection,
		useFilteredItems,
	}
);
