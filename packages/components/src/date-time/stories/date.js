/**
 * Internal dependencies
 */
import DatePicker from '../date';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

export default { title: 'Components/DatePicker', component: DatePicker };

export const _default = () => {
	const [ date, setDate ] = useState();

	return <DatePicker currentDate={ date } onChange={ setDate } />;
};
