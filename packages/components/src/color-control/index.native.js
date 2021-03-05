/**
 * Internal dependencies
 */
import ColorCell from '../mobile/bottom-sheet/color-cell';

function ColorControl( {
	label,
	onPress,
	color,
	withColorIndicator,
	...props
} ) {
	return (
		<ColorCell
			label={ label }
			onPress={ onPress }
			color={ color }
			withColorIndicator={ withColorIndicator }
			{ ...props }
		/>
	);
}

export default ColorControl;
