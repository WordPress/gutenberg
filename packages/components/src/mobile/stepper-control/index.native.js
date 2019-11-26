/**
 * Internal dependencies
 */
import StepperCell from '../bottom-sheet/stepper-cell';

function StepperControl( { icon, label, minValue, maxValue, step, onChangeValue } ) {
	return <StepperCell
		icon={ icon }
		label={ label }
		maxValue={ maxValue }
		minValue={ minValue }
		onChangeValue={ onChangeValue }
		step={ step }
	/>;
}

export default StepperControl;
