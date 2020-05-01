/**
 * External dependencies
 */
import { withKnobs, boolean } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import { DatePicker, TimePicker, DateTimePicker } from '../';

export default {
	title: 'Components/DateTimePicker',
	component: DateTimePicker,
	decorators: [ withKnobs ],
};

export const _default = () => {
	const is12Hour = boolean( 'is12Hour', true );
	return <DateTimePicker is12Hour={ is12Hour } />;
};

export const timeOnly = () => {
	const is12Hour = boolean( 'is12Hour', true );
	return <TimePicker is12Hour={ is12Hour } />;
};

export const calendarOnly = () => {
	const is12Hour = boolean( 'is12Hour', true );
	return <DatePicker is12Hour={ is12Hour } />;
};
