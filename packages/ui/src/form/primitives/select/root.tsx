import { Select as _Select } from '@base-ui/react/select';
import type { SelectRootProps } from './types';

/**
 * A component that lets users choose one option from a list.
 *
 * When using object values, pass an `items` array so `Select.Trigger` can
 * auto-resolve the selected item's label. By default, items should use a
 * `{ value, label }` shape, or provide `itemToStringLabel` for a custom shape.
 *
 * Object values are compared with `Object.is` by default, so use the same
 * object references for `value` / `defaultValue` and `Select.Item` values, or
 * provide `isItemEqualToValue`.
 */
export function Root< Value = unknown >( props: SelectRootProps< Value > ) {
	return <_Select.Root< Value, false > { ...props } />;
}
