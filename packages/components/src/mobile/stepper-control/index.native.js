/**
 * Internal dependencies
 */
import StepperCell from '../bottom-sheet/stepper-cell';

function StepperControl( {
	icon,
	label,
	max,
	min,
	onChange,
	separatorType,
	step,
	value,
} ) {
	return (
		<StepperCell
			icon={ icon }
			label={ label }
			max={ max }
			min={ min }
			onChange={ onChange }
			separatorType={ separatorType }
			step={ step }
			value={ value }
		/>
	);
}

export default StepperControl;
