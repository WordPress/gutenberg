/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import DateTimePicker from '..';
import { daysFromNow, isWeekend } from './utils';

const meta: ComponentMeta< typeof DateTimePicker > = {
	title: 'Components/DateTimePicker',
	component: DateTimePicker,
	argTypes: {
		currentDate: { control: 'date' },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof DateTimePicker > = ( args ) => (
	<DateTimePicker { ...args } />
);

export const Default: ComponentStory< typeof DateTimePicker > = Template.bind(
	{}
);

export const WithEvents: ComponentStory<
	typeof DateTimePicker
> = Template.bind( {} );
WithEvents.args = {
	currentDate: new Date(),
	events: [
		{ date: daysFromNow( 2 ) },
		{ date: daysFromNow( 4 ) },
		{ date: daysFromNow( 6 ) },
		{ date: daysFromNow( 8 ) },
	],
};

export const WithInvalidDates: ComponentStory<
	typeof DateTimePicker
> = Template.bind( {} );
WithInvalidDates.args = {
	currentDate: new Date(),
	isInvalidDate: isWeekend,
};
