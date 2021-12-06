/**
 * Internal dependencies
 */
import TimePicker from '../time';

/**
 * External dependencies
 */
import { date, boolean } from '@storybook/addon-knobs';
import { noop } from 'lodash';

export default {
	title: 'Components/TimePicker',
	component: TimePicker,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	return (
		<TimePicker
			currentTime={
				new Date(
					date( 'currentTime', new Date( '1986-10-18T11:00:00' ) )
				)
			}
			is12Hour={ boolean( 'is12Hour', false ) }
			onChange={ noop }
		/>
	);
};
