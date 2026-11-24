import type { CheckboxGroup as _CheckboxGroup } from '@base-ui/react/checkbox-group';
import type { ComponentProps } from '../../../utils/types';
import type { Stack } from '../../../stack';

export type CheckboxGroupProps = ComponentProps< typeof _CheckboxGroup > & {
	/** The checkboxes and optional nested items in the group. */
	children?: React.ReactNode;
};

export type CheckboxGroupNestedItemsProps = React.ComponentProps<
	typeof Stack
>;
