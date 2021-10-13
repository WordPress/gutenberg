/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { SyntheticEvent } from 'react';

/**
 * Internal dependencies
 */
import type { StateReducer } from '../input-control/reducer/state';
import type { InputChangeCallback } from '../input-control/types';

export type Value = number | string;

export type SelectSize = 'default' | 'small';

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
	 * Default value for the unit, used when switching units.
	 */
	default?: Value;
	/**
	 * An accessible label used by screen readers.
	 */
	a11yLabel?: string;
	/**
	 * A step value used when incrementing/decrementing the value.
	 */
	step?: number;
};

export type WPUnitControlUnitList = Array< WPUnitControlUnit > | false;

export type UnitControlOnChangeCallback = InputChangeCallback<
	SyntheticEvent< HTMLSelectElement | HTMLInputElement >,
	{ data?: WPUnitControlUnit }
>;

export type UnitSelectControlProps = {
	/**
	 * Whether the control can be focused via keyboard navigation.
	 */
	isUnitSelectTabbable?: boolean;
	/**
	 * A callback function invoked when the value is changed.
	 */
	onChange?: UnitControlOnChangeCallback;
	/**
	 * Size of the control option. Supports "default" and "small".
	 */
	size?: SelectSize;
	/**
	 * Current unit.
	 */
	unit?: string;
	/**
	 * Available units to select from.
	 */
	units?: WPUnitControlUnitList;
};

export type UnitControlProps = UnitSelectControlProps & {
	__unstableStateReducer?: StateReducer;
	/**
	 * If true, the unit `<select>` is hidden.
	 */
	disableUnits?: boolean;
	/**
	 * If true, the `ENTER` key press is required in order to trigger an `onChange`.
	 * If enabled, a change is also triggered when tabbing away (`onBlur`).
	 */
	isPressEnterToChange?: boolean;
	/**
	 * If true, and the selected unit provides a `default` value, this value is set
	 * when changing units.
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
	 * Current value. To set a unit, provide a unit with a value through the `value` prop.
	 */
	value: string;
};
