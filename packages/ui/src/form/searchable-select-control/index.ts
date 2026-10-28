import { Trigger } from './trigger';
import { SearchableSelectControl as _SearchableSelectControl } from './searchable-select-control';
import { Group } from '../primitives/combobox/group';
import { GroupLabel } from '../primitives/combobox/group-label';
import { Separator } from '../primitives/combobox/separator';
import { Item } from '../primitives/searchable-select/item';
import { ItemDescription } from '../primitives/combobox/item-description';
import { ItemLabel } from '../primitives/combobox/item-label';
import { Collection } from '../primitives/combobox/collection';
import { useFilteredItems } from '../primitives/combobox/use-filtered-items';

Trigger.displayName = 'SearchableSelectControl.Trigger';

/**
 * A complete searchable select field with integrated label and description.
 */
export const SearchableSelectControl = Object.assign(
	_SearchableSelectControl,
	{
		/**
		 * The trigger button, passed through the `trigger` prop to customize
		 * its props while retaining the control's label and selected content.
		 */
		Trigger,
		Group,
		GroupLabel,
		Separator,
		Item,
		ItemLabel,
		ItemDescription,
		Collection,
		useFilteredItems,
	}
);
