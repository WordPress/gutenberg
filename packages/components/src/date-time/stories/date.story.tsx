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
import DatePicker from '../date';
import { daysFromNow, isWeekend } from './utils';

const meta: ComponentMeta< typeof DatePicker > = {
	title: 'Components/DatePicker',
	component: DatePicker,
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

const Template: ComponentStory< typeof DatePicker > = ( {
	currentDate,
	onChange,
	...args
} ) => {
	const [ date, setDate ] = useState( currentDate );
	useEffect( () => {
		setDate( currentDate );
	}, [ currentDate ] );
	return (
		<DatePicker
			{ ...args }
			currentDate={ date }
			onChange={ ( newDate ) => {
				setDate( newDate );
				onChange?.( newDate );
			} }
		/>
	);
};

export const Default: ComponentStory< typeof DatePicker > = Template.bind( {} );

export const WithEvents: ComponentStory< typeof DatePicker > = Template.bind(
	{}
);
WithEvents.args = {
	currentDate: new Date(),
	events: [
		{ date: daysFromNow( 2 ) },
		{ date: daysFromNow( 4 ) },
		{ date: daysFromNow( 6 ) },
		{ date: daysFromNow( 8 ) },
	],
};

export const WithInvalidDates: ComponentStory< typeof DatePicker > =
	Template.bind( {} );
WithInvalidDates.args = {
	currentDate: new Date(),
	isInvalidDate: isWeekend,
};
