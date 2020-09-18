
/**
 * External dependencies
 */
import { button } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DatePicker from '../date';


export default {
	title: 'Components/DatePicker',
	component: DatePicker,
}

const DatePickerInstance = ( { currentDate, onDateChange } ) => {
	return <DatePicker
		currentDate={ currentDate }
		onDateChange={ onDateChange }
	/>;
};

export const _default = () => {
	const [ date, setDate ] = useState();

	button( 'Select Today', () => setDate( new Date() ) );
	return <DatePickerInstance
		currentDate={ date }
		onDateChange={ setDate }
	/>;
};
