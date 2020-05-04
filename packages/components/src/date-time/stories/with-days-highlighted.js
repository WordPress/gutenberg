/**
 * External dependencies
 */
import { button } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

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
	return new Date( date.getTime() + ( 1 + Math.random() * 5 ) * DAY_IN_MS );
};

const now = new Date();

const DateTimePickerWithState = () => {
	const [ date, setDate ] = useState( now );

	const [ highlights, setHighlights ] = useState( [ aFewDaysAfter( now ) ] );

	button( 'Add random highlight', () => {
		const lastHighlight = highlights[ highlights.length - 1 ];
		setHighlights( [ ...highlights, aFewDaysAfter( lastHighlight ) ] );
	} );

	const isDayHighlighted = useCallback(
		( day ) =>
			highlights.some( ( highlight ) => day.isSame( highlight, 'day' ) ),
		[ highlights ]
	);

	return (
		<DateTimePicker
			currentDate={ date }
			onChange={ setDate }
			isDayHighlighted={ isDayHighlighted }
		/>
	);
};

export const withDaysHighlighted = () => {
	return <DateTimePickerWithState />;
};
