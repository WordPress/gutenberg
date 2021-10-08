/**
 * External dependencies
 */
import type { ColorFormats } from 'tinycolor2';
import { HslColorPicker, HslaColorPicker } from 'react-colorful';

interface PickerProps {
	color: ColorFormats.HSL | ColorFormats.HSLA;
	enableAlpha: boolean;
	onChange: ( nextColor: ColorFormats.HSL | ColorFormats.HSLA ) => void;
}

export const Picker = ( { color, enableAlpha, onChange }: PickerProps ) => {
	// RC accepts s and l as a range from 0 - 100, whereas tinycolor expects a decimal value representing the percentage
	// so we need to make sure that we're giving RC the correct color format that it expects
	const reactColorfulColor = {
		h: color.h,
		s: color.s <= 1 ? Math.floor( color.s * 100 ) : color.s,
		l: color.l <= 1 ? Math.floor( color.l * 100 ) : color.l,
		a: ( color as ColorFormats.HSLA ).a,
	};

	const Component = enableAlpha ? HslaColorPicker : HslColorPicker;

	return <Component color={ reactColorfulColor } onChange={ onChange } />;
};
