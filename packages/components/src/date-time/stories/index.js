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

export const _default = () => {
	const [ date, setDate ] = useState();
	const is12Hour = boolean( 'Is 12 hour (shows AM/PM)', false );
	return (
		<DateTimePicker
			currentDate={ date }
			onChange={ setDate }
			is12Hour={ is12Hour }
		/>
	);
};
