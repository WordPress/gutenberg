
/**
 * External dependencies
 */

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

const DatePickerInstance = () => {
	const [ date, setDate ] = useState();

	return (
		<DatePicker
			currentDate={ date }
			onDateChange={ setDate }
		/>
	);
};

export const _default = () => {
	return <DatePickerInstance />;
};
