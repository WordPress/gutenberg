import ColorGradientControl from '../colors-gradients/control';
import type { ColorPaletteControlProps } from './types';

export default function ColorPaletteControl( {
	onChange,
	value,
	...otherProps
}: ColorPaletteControlProps ) {
	return (
		<ColorGradientControl
			{ ...otherProps }
			onColorChange={ onChange }
			colorValue={ value }
			gradients={ [] }
			disableCustomGradients
		/>
	);
}
