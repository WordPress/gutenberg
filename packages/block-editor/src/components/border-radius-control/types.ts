import type { ComponentProps } from 'react';
import type { Button } from '@wordpress/components';
import type { Preset } from '../preset-input-control/types';

/**
 * A corner of the border radius.
 */
export type BorderRadiusCorner =
	'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/**
 * The radius of each corner.
 */
export type BorderRadiusCornerValues = Partial<
	Record< BorderRadiusCorner, string >
>;

/**
 * Corner values whose presets are converted to their sizes.
 */
export type BorderRadiusConvertedValues = Partial<
	Record< BorderRadiusCorner, string | number >
>;

/**
 * Border radius values, either a shorthand value or one per corner. Global
 * styles also pass the shared radius of an inherited value as `all`.
 */
export type BorderRadiusValues =
	string | ( BorderRadiusCornerValues & { all?: string } );

/**
 * The selected units of the flat radius and each corner.
 */
export type BorderRadiusUnits = Partial<
	Record< BorderRadiusCorner | 'flat', string >
>;

/**
 * Border radius presets, by origin.
 */
export interface BorderRadiusPresets {
	default?: Preset[];
	theme?: Preset[];
	custom?: Preset[];
}

/**
 * Props of `BorderRadiusControl`.
 */
export interface BorderRadiusControlProps {
	/**
	 * Callback to handle onChange.
	 */
	onChange: ( values: BorderRadiusCornerValues ) => void;
	/**
	 * Border radius values.
	 */
	values?: BorderRadiusValues;
	/**
	 * Border radius presets.
	 */
	presets?: BorderRadiusPresets;
}

/**
 * Props of the `LinkedButton` of `BorderRadiusControl`.
 */
export type BorderRadiusLinkedButtonProps = ComponentProps< typeof Button > & {
	isLinked: boolean;
};
