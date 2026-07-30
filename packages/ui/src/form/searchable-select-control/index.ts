import { SearchableSelectControl as _SearchableSelectControl } from './searchable-select-control';
import { Item } from '../primitives/combobox/item';

Item.displayName = 'SearchableSelectControl.Item';

/**
 * A complete searchable select field with integrated label and description.
 */
export const SearchableSelectControl = Object.assign(
	_SearchableSelectControl,
	{
		/**
		 * An item rendered inside a `SearchableSelectControl` popup.
		 */
		Item,
	}
);
