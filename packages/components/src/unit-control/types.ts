/**
 * External dependencies
 */
import type { CSSProperties, SyntheticEvent } from 'react';

/**
 * Internal dependencies
 */
import type { StateReducer } from '../input-control/reducer/state';
import type {
	InputChangeCallback,
	InputControlProps,
	Size as InputSize,
} from '../input-control/types';

export type SelectSize = InputSize;

export type WPUnitControlUnit = {
	/**
	 * The value for the unit, used in a CSS value (e.g `px`).
	 */
	value: string;
	/**
	 * The label used in a dropdown selector for the unit.
	 */
	label: string;
	/**
	 * Default value (quantity) for the unit, used when switching units.
	 */
	default?: number;
	/**
	 * An accessible label used by screen readers.
	 */
	a11yLabel?: string;
	/**
	 * A step value used when incrementing/decrementing the value.
	 */
	step?: number;
};

export type UnitControlOnChangeCallback = InputChangeCallback<
	SyntheticEvent< HTMLSelectElement | HTMLInputElement >,
	{ data?: WPUnitControlUnit }
>;

export type UnitSelectControlProps = {
	/**
	 * Whether the control can be focused via keyboard navigation.
	 *
	 * @default true
	 */
	isUnitSelectTabbable?: boolean;
	/**
	 * A callback function invoked when the value is changed.
	 */
	onChange?: UnitControlOnChangeCallback;
	/**
	 * Size of the control option. Supports "default" and "small".
	 *
	 * @default 'default'
	 */
	size?: SelectSize;
	/**
	 * Current unit.
	 */
	unit?: string;
	/**
	 * Available units to select from.
	 *
	 * @default CSS_UNITS
	 */
	units?: WPUnitControlUnit[];
};

// TODO: when available, should (partially) extend `NumberControl` props.
export type UnitControlProps = UnitSelectControlProps &
	Pick< InputControlProps, 'hideLabelFromVision' > & {
		__unstableStateReducer?: StateReducer;
		__unstableInputWidth?: CSSProperties[ 'width' ];
		/**
		 * If `true`, the unit `<select>` is hidden.
		 *
		 * @default false
		 */
		disableUnits?: boolean;
		/**
		 * If `true`, the `ENTER` key press is required in order to trigger an `onChange`.
		 * If enabled, a change is also triggered when tabbing away (`onBlur`).
		 *
		 * @default false
		 */
		isPressEnterToChange?: boolean;
		/**
		 * If `true`, and the selected unit provides a `default` value, this value is set
		 * when changing units.
		 *
		 * @default false
		 */
		isResetValueOnUnitChange?: boolean;
		/**
		 * If this property is added, a label will be generated using label property as the content.
		 */
		label?: string;
		/**
		 * Callback when the `unit` changes.
		 */
		onUnitChange?: UnitControlOnChangeCallback;
		/**
		 * Current value. If passed as a string, the current unit will be inferred from this value.
		 * For example, a `value` of "50%" will set the current unit to `%`.
		 */
		value?: string | number;
		/**
		 * If true, pressing `UP` or `DOWN` along with the `SHIFT` key will increment
		 * the value by the `shiftStep` value.
		 *
		 * @default true
		 */
		isShiftStepEnabled?: boolean;
		/**
		 * Amount to increment by when the `SHIFT` key is held down. This shift value
		 * is a multiplier to the `step` value. For example, if the `step` value is `5`,
		 * and `shiftStep` is `10`, each jump would increment/decrement by `50`.
		 *
		 * @default 10
		 */
		shiftStep?: number;
	};
