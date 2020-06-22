/**
 * Internal dependencies
 */
import ColorGradientControl from '../colors-gradients/control';

export default function ColorPaletteControl( {
	onChange,
	value,
	...otherProps
} ) {
	return (
		<ColorGradientControl
			{ ...otherProps }
			onColorChange={ onChange }
			colorValue={ value }
			gradients={ [] }
			disableCustomGradients={ true }
		/>
	);
}
