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
import { DateTimePicker } from '../';

export default {
	title: 'Components/DateTimePicker',
	component: DateTimePicker,
};

const DateTimePickerWithState = ( { is12Hour } ) => {
	const [ date, setDate ] = useState();

	return (
		<DateTimePicker
			currentDate={ date }
			onChange={ setDate }
			is12Hour={ is12Hour }
		/>
	);
};

export const _default = () => {
	const is12Hour = boolean( 'Is 12 hour (shows AM/PM)', false );
	return <DateTimePickerWithState is12Hour={ is12Hour } />;
};
