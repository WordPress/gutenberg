/**
 * External dependencies
 */
import type { Colord } from 'colord';

export type ColorType = 'rgb' | 'hsl' | 'hex';
export type ColorCopyButtonProps = {
	color: Colord;
	colorType: ColorType;
};
