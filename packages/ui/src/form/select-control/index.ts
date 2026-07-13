import { SelectControl as _SelectControl } from './select-control';
import { Item } from './item';

Item.displayName = 'SelectControl.Item';

/**
 * A complete select field with integrated label and description.
 */
export const SelectControl = Object.assign( _SelectControl, {
	/**
	 * An item rendered inside a `SelectControl` popup.
	 */
	Item,
} );
