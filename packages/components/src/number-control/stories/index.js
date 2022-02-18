/**
 * External dependencies
 */
import { boolean, number, text } from '@storybook/addon-knobs';

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
	parameters: {
		knobs: { disable: false },
	},
};

function Example() {
	const [ value, setValue ] = useState( '0' );

	const props = {
		disabled: boolean( 'disabled', false ),
		hideLabelFromVision: boolean( 'hideLabelFromVision', false ),
		isPressEnterToChange: boolean( 'isPressEnterToChange', false ),
		isShiftStepEnabled: boolean( 'isShiftStepEnabled', true ),
		label: text( 'label', 'Number' ),
		min: number( 'min', 0 ),
		max: number( 'max', 100 ),
		placeholder: text( 'placeholder', '0' ),
		required: boolean( 'required', false ),
		shiftStep: number( 'shiftStep', 10 ),
		step: text( 'step', '1' ),
	};

	return (
		<NumberControl
			{ ...props }
			value={ value }
			onChange={ ( v ) => setValue( v ) }
		/>
	);
}

export const _default = () => {
	return <Example />;
};
