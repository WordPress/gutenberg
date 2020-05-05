/**
 * Internal dependencies
 */
import ColorCell from '../mobile/bottom-sheet/color-cell';

function ColorControl( {
	label,
	help,
	instanceId,
	className,
	onPress,
	color,
	...props
} ) {
	const id = `inspector-color-control-${ instanceId }`;

	return (
		<ColorCell
			label={ label }
			id={ id }
			help={ help }
			className={ className }
			aria-describedby={ !! help ? id + '__help' : undefined }
			onPress={ onPress }
			color={ color }
			{ ...props }
		/>
	);
}

export default ColorControl;
