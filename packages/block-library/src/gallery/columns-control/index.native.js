/**
 * WordPress dependencies
 */
import { StepperControl } from '@wordpress/components';

const ColumnsControl = ( { label, value, onChange, min, max } ) => (
	<StepperControl
		label={ label }
		max={ max }
		min={ min }
		onChange={ onChange }
		separatorType="fullWidth"
		value={ value }
	/>
);

export default ColumnsControl;
