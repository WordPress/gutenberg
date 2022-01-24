/**
 * External dependencies
 */
import { boolean, button } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DateTimePicker from '../';

export default {
	title: 'Components/DateTimePicker',
	component: DateTimePicker,
	parameters: {
		knobs: { disable: false },
	},
};

const DateTimePickerWithState = ( { is12Hour } ) => {
	const [ date, setDate ] = useState();

	return (
		<DateTimePicker
			currentDate={ date }
			onChange={ setDate }
			is12Hour={ is12Hour }
		/>
	);
};

export const _default = () => {
	const is12Hour = boolean( 'Is 12 hour (shows AM/PM)', false );
	return <DateTimePickerWithState is12Hour={ is12Hour } />;
};

// Date utils, for demo purposes.
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const aFewDaysAfter = ( date ) => {
	// eslint-disable-next-line no-restricted-syntax
	return new Date( date.getTime() + ( 1 + Math.random() * 5 ) * DAY_IN_MS );
};

const now = new Date();

export const WithDaysHighlighted = () => {
	const [ date, setDate ] = useState( now );

	const [ highlights, setHighlights ] = useState( [
		{ date: aFewDaysAfter( now ) },
	] );

	button( 'Add random highlight', () => {
		const lastHighlight = highlights[ highlights.length - 1 ];
		setHighlights( [
			...highlights,
			{ date: aFewDaysAfter( lastHighlight.date ) },
		] );
	} );

	return (
		<DateTimePicker
			currentDate={ date }
			onChange={ setDate }
			events={ highlights }
		/>
	);
};
