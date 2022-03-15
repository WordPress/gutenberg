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
	const [ isValidValue, setIsValidValue ] = useState( true );

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
		<>
			<NumberControl
				{ ...props }
				value={ value }
				onChange={ ( v, extra ) => {
					setValue( v );
					// Given how the component works internally, the `validity` property
					// is not guaranteed to always be defined on `event.target`. When the
					// `validity` property is not defined, you can assume the value
					// received as valid.
					setIsValidValue(
						extra.event.target.validity?.valid ?? true
					);
				} }
			/>
			<p>Is valid? { isValidValue ? 'Yes' : 'No' }</p>
		</>
	);
}

export const _default = () => {
	return <Example />;
};
