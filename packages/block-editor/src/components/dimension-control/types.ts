import type { Preset } from '../preset-input-control/types';

/**
 * Dimension size presets, by origin.
 */
export interface DimensionSizes {
	default?: Preset[];
	theme?: Preset[];
	custom?: Preset[];
}

/**
 * Props of `DimensionControl`.
 */
export interface DimensionControlProps {
	/**
	 * A label for the control.
	 */
	label?: string;
	/**
	 * Called when the dimension value changes.
	 */
	onChange: ( value?: string ) => void;
	/**
	 * The current dimension value.
	 */
	value?: string | number;
	/**
	 * Placeholder text for the custom-value input.
	 */
	placeholder?: string;
	/**
	 * Additional CSS class on the wrapping fieldset.
	 */
	className?: string;
	/**
	 * Optional dimension size presets. Falls back to settings from the store.
	 */
	dimensionSizes?: DimensionSizes;
}
