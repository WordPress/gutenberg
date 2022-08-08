/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NumberControl from '../';

export default {
	title: 'Components (Experimental)/NumberControl',
	component: NumberControl,
	argTypes: {
		size: {
			control: {
				type: 'select',
				options: [ 'default', 'small', '__unstable-large' ],
			},
		},
		onChange: { action: 'onChange' },
	},
};

function Template( { onChange, ...props } ) {
	const [ value, setValue ] = useState( '0' );
	const [ isValidValue, setIsValidValue ] = useState( true );

	return (
		<>
			<NumberControl
				{ ...props }
				value={ value }
				onChange={ ( v, extra ) => {
					setValue( v );
					setIsValidValue( extra.event.target.validity.valid );
					onChange( v, extra );
				} }
			/>
			<p>Is valid? { isValidValue ? 'Yes' : 'No' }</p>
		</>
	);
}

export const Default = Template.bind( {} );
Default.args = {
	disabled: false,
	hideLabelFromVision: false,
	isPressEnterToChange: false,
	isShiftStepEnabled: true,
	label: 'Number',
	min: 0,
	max: 100,
	placeholder: '0',
	required: false,
	shiftStep: 10,
	size: 'default',
	step: '1',
};
