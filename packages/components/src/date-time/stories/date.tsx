/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

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
		events: { control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof DatePicker > = ( args ) => (
	<DatePicker { ...args } />
);

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

export const WithInvalidDates: ComponentStory<
	typeof DatePicker
> = Template.bind( {} );
WithInvalidDates.args = {
	currentDate: new Date(),
	isInvalidDate: isWeekend,
};
