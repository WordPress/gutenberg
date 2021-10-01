/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ChangeEvent } from 'react';

/**
 * Internal dependencies
 */
import type { InputControlLabelProps } from '../input-control/types';

export type Value = number | string;

export type Size = 'default' | 'small';

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

export type UnitControlLabelProps = InputControlLabelProps;

export type UnitSelectControlProps = {
	className: string;
	isTabbable: boolean;
	options?: Array< WPUnitControlUnit >;
	onChange?: (
		nextValue: string | undefined,
		extra: {
			event: ChangeEvent< HTMLSelectElement >;
			data: WPUnitControlUnit;
		}
	) => void;
	size?: Size;
	value: string;
};
