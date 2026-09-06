import { Item } from './item';
import { Group } from '../combobox/group';
import { GroupLabel } from '../combobox/group-label';
import { Collection } from '../combobox/collection';
import { SearchableSelect as _SearchableSelect } from './searchable-select';

Item.displayName = 'SearchableSelect.Item';
Group.displayName = 'SearchableSelect.Group';
GroupLabel.displayName = 'SearchableSelect.GroupLabel';

/**
 * A searchable single-selection component, with support for
 * a footer item to create new items.
 */
export const SearchableSelect = Object.assign( _SearchableSelect, {
	Item,
	Group,
	GroupLabel,
	Collection,
} );
