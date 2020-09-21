/**
 * Internal dependencies
 */
import TimePicker from '../time';

/**
 * External dependencies
 */
import { date, boolean } from '@storybook/addon-knobs';
import { useState, createElement } from 'react';

export default { title: 'Components/TimePicker', component: TimePicker };

const TimePickerWithState = () => {
	const [ currentTime, setCurrentTime ] = useState(
		new Date( date( 'currentTime', new Date( '1986-10-18T11:00:00' ) ) )
	);
	return (
		<TimePicker
			currentTime={ currentTime }
			is12Hour={ boolean( 'is12Hour', false ) }
			onChange={ setCurrentTime }
		/>
	);
};

export const _default = () => createElement( TimePickerWithState );
