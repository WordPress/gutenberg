/**
 * Internal dependencies
 */
import { RgbInput } from './rgb-input';
import { HslInput } from './hsl-input';
import { HexInput } from './hex-input';
import type { ColorInputProps } from './types';

export const ColorInput = ( {
	colorType,
	color,
	hsla,
	onChange,
	onHSLChange,
	enableAlpha,
}: ColorInputProps ) => {
	switch ( colorType ) {
		case 'hsl':
			return (
				<HslInput
					hsla={ hsla }
					onChange={ onHSLChange }
					enableAlpha={ enableAlpha }
				/>
			);
		case 'rgb':
			return (
				<RgbInput
					color={ color }
					onChange={ onChange }
					enableAlpha={ enableAlpha }
				/>
			);
		default:
		case 'hex':
			return (
				<HexInput
					color={ color }
					onChange={ onChange }
					enableAlpha={ enableAlpha }
				/>
			);
	}
};
