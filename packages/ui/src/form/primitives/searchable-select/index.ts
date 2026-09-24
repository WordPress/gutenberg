import { Item } from './item';
import { ItemDescription } from '../combobox/item-description';
import { ItemLabel } from '../combobox/item-label';
import { Group } from '../combobox/group';
import { GroupLabel } from '../combobox/group-label';
import { Collection } from '../combobox/collection';
import { useFilteredItems } from '../combobox/use-filtered-items';
import { SearchableSelect as _SearchableSelect } from './searchable-select';

Item.displayName = 'SearchableSelect.Item';
ItemLabel.displayName = 'SearchableSelect.ItemLabel';
ItemDescription.displayName = 'SearchableSelect.ItemDescription';
Group.displayName = 'SearchableSelect.Group';
GroupLabel.displayName = 'SearchableSelect.GroupLabel';

/**
 * A searchable single-selection component, with support for
 * a creatable footer action.
 *
 * Prefer `SearchableSelectControl` when using with a standard label and description.
 */
export const SearchableSelect = Object.assign( _SearchableSelect, {
	Item,
	ItemLabel,
	ItemDescription,
	Group,
	GroupLabel,
	Collection,
	useFilteredItems,
} );
