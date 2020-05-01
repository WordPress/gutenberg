/**
 * External dependencies
 */
import { object } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DateTimePicker } from '..';

export default {
	title: 'Components/DateTimePicker',
	component: DateTimePicker,
};

const DateTimePickerWithState = () => {
	const [ date, setDate ] = useState( new Date( '2022-05-01 10:30' ) );
	const events = object( 'Events', [
		{
			title: '1 other post scheduled',
			date: new Date( '2022-05-15 10:30' ),
		},
		{
			title: 'Happy birthday Damian!',
			date: new Date( '2022-05-18 15:00' ),
		},
	] );
	return (
		<DateTimePicker
			currentDate={ date }
			onChange={ setDate }
			events={ events }
		/>
	);
};

export const withEventsHighlighted = () => {
	return <DateTimePickerWithState />;
};
