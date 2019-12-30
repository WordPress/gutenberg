/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';

export default function ColorPaletteControl( {
	colors,
	disableCustomColors,
	label,
	onChange,
	value,
} ) {
	return (
		<ColorGradientControl
			{ ...{ colors, disableCustomColors, label } }
			onColorChange={ onChange }
			colorValue={ value }
			gradients={ [] }
			disableCustomGradients={ true }
		/>
	);
}
