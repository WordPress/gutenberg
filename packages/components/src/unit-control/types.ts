export interface WPUnitControlUnit {
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
	default?: string | number;
	/**
	 * An accessible label used by screen readers.
	 */
	a11yLabel?: string;
	/**
	 * A step value used when incrementing/decrementing the value.
	 */
	step?: number;
}

export interface UseCustomUnitsProps {
	/**
	 * Collection of all potentially units, to be filtered by `availableUnits`.
	 */
	units?: Array< WPUnitControlUnit >;
	/**
	 * Collection of unit value strings. Example: `[ 'px', 'em', 'rem' ]`.
	 * Typically provided by the `spacing.units` settings path in theme.json.
	 */
	availableUnits?: Array< string >;
	/**
	 * Collection of default values for defined units. Example: `{ px: '350', em: '15' }`.
	 */
	defaultValues: Record< string, string | number >;
}
