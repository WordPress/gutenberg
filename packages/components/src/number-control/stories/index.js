/**
 * External dependencies
 */
import { boolean, number } from '@storybook/addon-knobs';

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
		isShiftStepEnabled: boolean( 'isShiftStepEnabled', true ),
		shiftStep: number( 'shiftStep', 10 ),
		step: number( 'step', 1 ),
	};

	return <NumberControl { ...props } value={ value } onChange={ setValue } />;
}

export const _default = () => {
	return <Example />;
};
