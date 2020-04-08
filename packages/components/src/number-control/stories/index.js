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
	title: 'Components/NumberControl',
	component: NumberControl,
};

function Example() {
	const [ value, setValue ] = useState( '' );

	const props = {
		label: text( 'label', 'Number' ),
		isShiftStepEnabled: boolean( 'isShiftStepEnabled', true ),
		shiftStep: number( 'shiftStep', 10 ),
		step: number( 'step', 1 ),
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
