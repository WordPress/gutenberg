import { CheckboxGroup as _CheckboxGroup } from './checkbox-group';
import { CheckboxGroupNestedItems } from './nested-items';

CheckboxGroupNestedItems.displayName = 'CheckboxGroup.NestedItems';

/**
 * A low-level primitive that groups checkboxes so they share one selected-values
 * state.
 *
 * Prefer composing `CheckboxControl` inside the group for labeled items. Wrap
 * related groups in `Fieldset` for a legend and description.
 */
export const CheckboxGroup = Object.assign( _CheckboxGroup, {
	/**
	 * A layout wrapper that indents nested checkbox items.
	 */
	NestedItems: CheckboxGroupNestedItems,
} );
