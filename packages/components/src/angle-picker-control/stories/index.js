/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import AnglePickerControl from '../';

export default {
	title: 'Components/AnglePickerControl',
	component: AnglePickerControl,
	argTypes: {
		label: { control: { type: 'text' } },
	},
};

const AnglePickerWithState = ( args ) => {
	const [ angle, setAngle ] = useState();
	return (
		<AnglePickerControl { ...args } value={ angle } onChange={ setAngle } />
	);
};

export const Default = AnglePickerWithState.bind( {} );
Default.args = {
	__nextHasNoMarginBottom: true,
};
