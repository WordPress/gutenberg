export type Value = number | string;

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
