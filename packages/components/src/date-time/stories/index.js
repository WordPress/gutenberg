/**
 * Internal dependencies
 */
import { DateTimePicker } from '..';

export default { title: 'Pickers/DateTime', component: DateTimePicker };

const mockProps = {
	currentDate: '2019-10-22T23:23:23',
	is12Hour: true,
	isInvalidDate: false,
	// eslint-disable-next-line no-console
	onChange: () => console.log( 'date changed' ),
};

export const _default = () => <DateTimePicker />;

export const specified = () => <DateTimePicker { ...mockProps } />;
