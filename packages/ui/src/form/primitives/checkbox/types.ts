import type { Checkbox as _Checkbox } from '@base-ui/react/checkbox';
import type { ComponentProps } from '../../../utils/types';

export type CheckboxRootProps = ComponentProps< typeof _Checkbox.Root > & {
	/**
	 * The indicator to render inside the checkbox.
	 *
	 * When omitted, a default checkmark/indeterminate indicator is rendered.
	 */
	children?: React.ReactNode;
};

export type CheckboxIndicatorProps = ComponentProps<
	typeof _Checkbox.Indicator
> & {
	/**
	 * The content of the indicator.
	 *
	 * When omitted, default checkmark/indeterminate icons are rendered.
	 */
	children?: React.ReactNode;
};
