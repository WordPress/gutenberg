/**
 * Internal dependencies
 */
import DatePicker from '..';

export default { title: 'Pickers/Date', component: DatePicker };

const mockProps = {
	currentDate: '2019-10-22T23:23:23',
	isInvalidDate: false,
	// eslint-disable-next-line no-console
	onChange: ( date ) => console.log( `date changed to ${ date }` ),
};

// eslint-disable-next-line no-console
export const _default = () => <DatePicker onChange={ ( date ) => console.log( `date changed to ${ date }` ) } />;

export const specified = () => <DatePicker { ...mockProps } />;
