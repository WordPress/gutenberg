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
		required
		value={ value }
	/>
);

export default ColumnsControl;
