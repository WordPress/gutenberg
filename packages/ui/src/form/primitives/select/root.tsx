import { Select as _Select } from '@base-ui/react/select';
import type { SelectRootProps } from './types';
import { DirectionProvider } from '../../../utils/direction-provider';

/**
 * A component that lets users choose one option from a list.
 *
 * Prefer `SelectControl` when using with a standard label and description.
 *
 * For object values with a `{ value, label }` shape, the trigger uses `label`
 * directly when the serialized value is nonempty. Empty values follow the
 * placeholder rules instead.
 * For custom object shapes, provide `itemToStringLabel`.
 * Pass `items` when primitive values need label mapping, or when a null-valued
 * option supplies the placeholder label.
 *
 * Object values are compared with `Object.is` by default, so use the same
 * object references for `value` / `defaultValue` and `Select.Item` values, or
 * provide `isItemEqualToValue`.
 */
export function Root< Value = unknown >( props: SelectRootProps< Value > ) {
	return (
		<DirectionProvider>
			<_Select.Root< Value, false > { ...props } />
		</DirectionProvider>
	);
}
