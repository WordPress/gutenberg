/**
 * Internal dependencies
 */
import type { InputControlProps } from '../input-control/types';

export type Props = InputControlProps & {
	/**
	 * If `true`, the default `input` HTML arrows will be hidden.
	 *
	 * @default false
	 */
	hideHTMLArrows?: boolean;
	/**
	 * If `true`, pressing `UP` or `DOWN` along with the `SHIFT` key will
	 * increment the value by the `shiftStep` value.
	 *
	 * @default true
	 */
	isShiftStepEnabled?: boolean;
	/**
	 * Amount to increment by when the `SHIFT` key is held down. This value is a
	 * multiplier to the `step` value. For example, if the `step` value is `5`,
	 * and `shiftStep` is `10`, each jump would increment/decrement by `50`.
	 *
	 * @default 10
	 */
	shiftStep?: number;
};
