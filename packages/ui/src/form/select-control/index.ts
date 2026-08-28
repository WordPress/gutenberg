import { SelectControl as _SelectControl } from './select-control';
import { Group } from '../primitives/select/group';
import { GroupLabel } from '../primitives/select/group-label';
import { Item } from './item';

Group.displayName = 'SelectControl.Group';
GroupLabel.displayName = 'SelectControl.GroupLabel';
Item.displayName = 'SelectControl.Item';

/**
 * A complete select field with integrated label and description.
 */
export const SelectControl = Object.assign( _SelectControl, {
	/**
	 * Groups related items together with an associated label rendered by
	 * `SelectControl.GroupLabel`.
	 */
	Group,
	/**
	 * Renders a label for a `SelectControl.Group`.
	 */
	GroupLabel,
	/**
	 * An item rendered inside a `SelectControl` popup.
	 */
	Item,
} );
