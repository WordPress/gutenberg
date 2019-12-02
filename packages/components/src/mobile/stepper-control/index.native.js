/**
 * Internal dependencies
 */
import StepperCell from '../bottom-sheet/stepper-cell';

function StepperControl( {
	icon,
	label,
	maxValue,
	minValue,
	onChangeValue,
	separatorType,
	step,
	value,
} ) {
	return <StepperCell
		icon={ icon }
		label={ label }
		maxValue={ maxValue }
		minValue={ minValue }
		onChangeValue={ onChangeValue }
		separatorType={ separatorType }
		step={ step }
		value={ value }
	/>;
}

export default StepperControl;
