import type { ComponentProps } from 'react';
import type { Button, DistributiveOmit } from '@wordpress/components';
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
 * Border radius values, either a shorthand value or one per corner, where a
 * stored corner may be the number `0`. Global styles also pass the shared
 * radius of an inherited value as `all`.
 */
export type BorderRadiusValues =
	string | ( BorderRadiusConvertedValues & { all?: string } );

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
	 * Callback to handle onChange. Corners the change leaves alone keep their
	 * stored values, which may be the number `0`.
	 */
	onChange: ( values: BorderRadiusConvertedValues ) => void;
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
 * Props of the `LinkedButton` of `BorderRadiusControl`, which sets its own
 * look and label.
 */
export type BorderRadiusLinkedButtonProps = DistributiveOmit<
	ComponentProps< typeof Button >,
	'className' | 'size' | 'icon' | 'iconSize' | 'label'
> & {
	isLinked: boolean;
};
