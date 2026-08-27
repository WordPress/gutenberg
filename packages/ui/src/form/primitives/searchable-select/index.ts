import { Item } from '../combobox/item';
import { SearchableSelect as _SearchableSelect } from './searchable-select';

Item.displayName = 'SearchableSelect.Item';

/**
 * A searchable single-selection component, with support for
 * a footer item to create new items.
 */
export const SearchableSelect = Object.assign( _SearchableSelect, {
	Item,
} );
