
/**
 * External dependencies
 */
import { boolean } from '@storybook/addon-knobs';

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

const DatePickerInstance = ( { is12Hour } ) => {
	const [ date, setDate ] = useState();

	return (
		<DatePicker
			currentDate={ date }
			onDateChange={ setDate }
			is12Hour={ is12Hour }
		/>
	);
};

export const _default = () => {
	const is12Hour = boolean( 'Is 12 hour (shows AM/PM)', false );
	return <DatePickerInstance is12Hour={ is12Hour } />;
};
