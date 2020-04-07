/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';

const ColumnsControl = ( { label, value, onChange, min, max } ) => (
	<RangeControl
		label={ label }
		max={ max }
		min={ min }
		onChange={ onChange }
		separatorType="fullWidth"
		value={ value }
		type="stepper"
	/>
);

export default ColumnsControl;
