import type { Checkbox as _Checkbox } from '@base-ui/react/checkbox';
import type { ComponentProps } from '../../../utils/types';

export type CheckboxProps = ComponentProps< typeof _Checkbox.Root > & {
	/**
	 * Enlarge the hit target without changing the visual size.
	 *
	 * Use this when there is no visible label.
	 *
	 * @default false
	 */
	expandHitTarget?: boolean;
};
