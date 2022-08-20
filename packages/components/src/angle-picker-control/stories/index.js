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
		__nextHasNoMarginBottom: { control: { type: 'boolean' } },
	},
};

const AnglePickerWithState = ( args ) => {
	const [ angle, setAngle ] = useState();
	return (
		<AnglePickerControl { ...args } value={ angle } onChange={ setAngle } />
	);
};

export const Default = AnglePickerWithState.bind( {} );
