/**
 * Internal dependencies
 */
import TimePicker from '..';

export default { title: 'Pickers/Time', component: TimePicker };

const mockProps = {
	currentTime: '2019-10-22T23:23:23',
	is12Hour: true,
};

export const _default = () => <TimePicker />;

export const specified = () => <TimePicker { ...mockProps } />;
