/**
 * External dependencies
 */
import { button, select } from '@storybook/addon-knobs';

//import * as locals from 'date-fns/locale';
import * as locales from 'date-fns/esm/locale';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DatePicker from '../date';

export default {
	title: 'Components/DatePicker',
	component: DatePicker,
};

export const withLocales = () => {
	const [ date, setDate ] = useState();

	button( 'Select Today', () => setDate( new Date() ) );

	return (
		<DatePicker
			currentDate={ date }
			onChange={ setDate }
			locale={ select( 'locale', Object.keys( locales ) ) }
		/>
	);
};
