/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DateTimePicker from '../date-time';
import { daysFromNow, isWeekend } from './utils';

const meta: ComponentMeta< typeof DateTimePicker > = {
	title: 'Components/DateTimePicker',
	component: DateTimePicker,
	argTypes: {
		currentDate: { control: 'date' },
		onChange: { action: 'onChange', control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof DateTimePicker > = ( {
	currentDate,
	onChange,
	...args
} ) => {
	const [ date, setDate ] = useState( currentDate );
	useEffect( () => {
		setDate( currentDate );
	}, [ currentDate ] );
	return (
		<DateTimePicker
			{ ...args }
			currentDate={ date }
			onChange={ ( newDate ) => {
				setDate( newDate );
				onChange?.( newDate );
			} }
		/>
	);
};

export const Default: ComponentStory< typeof DateTimePicker > = Template.bind(
	{}
);
Default.args = {
	__nextRemoveHelpButton: true,
	__nextRemoveResetButton: true,
};

export const WithEvents: ComponentStory< typeof DateTimePicker > =
	Template.bind( {} );
WithEvents.args = {
	currentDate: new Date(),
	events: [
		{ date: daysFromNow( 2 ) },
		{ date: daysFromNow( 4 ) },
		{ date: daysFromNow( 6 ) },
		{ date: daysFromNow( 8 ) },
	],
};

export const WithInvalidDates: ComponentStory< typeof DateTimePicker > =
	Template.bind( {} );
WithInvalidDates.args = {
	currentDate: new Date(),
	isInvalidDate: isWeekend,
};
