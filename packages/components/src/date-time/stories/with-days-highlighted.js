/**
 * External dependencies
 */
import { button } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DateTimePicker } from '..';

export default {
	title: 'Components/DateTimePicker',
	component: DateTimePicker,
};

// Date utils, for demo purposes.
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const aFewDaysAfter = ( date ) => {
	// eslint-disable-next-line no-restricted-syntax
	return new Date( date.getTime() + DAY_IN_MS );
};

const now = new Date();

export const WithDaysHighlighted = () => {
	const [ date, setDate ] = useState( now );

	const [ highlights, setHighlights ] = useState( [
		{ date: aFewDaysAfter( now ) },
	] );

	console.log( { highlights } );

	button( 'Add random highlight', () => {
		const lastHighlight = highlights[ highlights.length - 1 ];
		setHighlights( [
			...highlights,
			{
				date: aFewDaysAfter( lastHighlight.date ),
				title: 'Event Title',
				type: 'test',
			},
			{
				date: aFewDaysAfter( lastHighlight.date ),
				title: 'Duplicated Event Title',
				type: 'duplicated',
			},
			{
				date: aFewDaysAfter( lastHighlight.date ),
				title: 'Duplicated Event Title',
				type: 'duplicated',
			},
			{
				date: aFewDaysAfter( lastHighlight.date ),
				title: 'Duplicated Event Title',
				type: 'duplicated',
			},
			{
				date: aFewDaysAfter( lastHighlight.date ),
				title: 'Duplicated Event Title',
				type: 'duplicated',
			},
			{
				date: aFewDaysAfter( lastHighlight.date ),
				title: 'Duplicated Event Title',
				type: 'duplicated',
			},
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
