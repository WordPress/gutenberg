/**
 * External dependencies
 */
import type {
	Colord,
	HslColor,
	HsvaColor,
	HsvColor,
	RgbaColor,
	RgbColor,
} from 'colord';
import type { HslaColor } from 'react-colorful';
/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import type { useDeprecatedProps } from './use-deprecated-props';

export type ColorType = 'rgb' | 'hsl' | 'hex';
export type ColorCopyButtonProps = {
	color: Colord;
	colorType: ColorType;
};

export type LegacyAdapterProps = Parameters< typeof useDeprecatedProps >[ 0 ];

export type ColorPickerProps = WordPressComponentProps<
	{
		enableAlpha?: boolean;
		color?: string;
		onChange?: ( color: string ) => void;
		defaultValue?: string;
		copyFormat?: ColorType;
	},
	'div',
	false
>;

export interface PickerProps {
	color: Colord;
	enableAlpha: boolean;
	onChange: ( nextColor: Colord ) => void;
}

export interface ColorInputProps {
	colorType: 'hsl' | 'hex' | 'rgb';
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

export interface InputWithSliderProps {
	min: number;
	max: number;
	value: number;
	label: string;
	abbreviation: string;
	onChange: ( value: number ) => void;
}

export interface HexInputProps {
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

export interface HslInputProps {
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

export interface RgbInputProps {
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

/**
 * @deprecated
 */
export type LegacyColor =
	| string
	| {
			hex: string;
			hsl: HslColor | HslaColor;
			hsv: HsvColor | HsvaColor;
			rgb: RgbColor | RgbaColor;
			/**
			 * @deprecated
			 */
			oldHue: number;
			/**
			 * @deprecated
			 */
			source: 'hex';
	  };

/**
 * @deprecated
 */
export interface LegacyProps {
	color?: LegacyColor;
	/**
	 * @deprecated
	 */
	onChangeComplete: ( colors: LegacyColor ) => void;
	/**
	 * @deprecated
	 */
	oldHue: string;
	className: string;
	/**
	 * @deprecated
	 */
	disableAlpha: boolean;
	onChange?: never;
}
