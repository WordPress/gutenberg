import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState, useEffect } from '@wordpress/element';
import { getSettings, setSettings } from '@wordpress/date';
import TimePicker from '../time-picker';

const meta: Meta< typeof TimePicker > = {
	title: 'Components/@wordpress-components/Selection & Input/Time & Date/TimePicker',
	id: 'components-timepicker',
	component: TimePicker,
	subcomponents: { 'TimePicker.TimeInput': TimePicker.TimeInput },
	argTypes: {
		currentTime: { control: 'date' },
		onChange: { action: 'onChange', control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof TimePicker > = ( {
	currentTime,
	onChange,
	...args
} ) => {
	const [ time, setTime ] = useState( currentTime );
	useEffect( () => {
		setTime( currentTime );
	}, [ currentTime ] );
	return (
		<TimePicker
			{ ...args }
			currentTime={ time }
			onChange={ ( newTime ) => {
				setTime( newTime );
				onChange?.( newTime );
			} }
		/>
	);
};

export const Default: StoryFn< typeof TimePicker > = Template.bind( {} );
Default.args = {
	currentTime: new Date(),
};

/**
 * When the site time zone from the `@wordpress/date` settings differs from the
 * user's, the time picker shows the site time zone's abbreviation. Hovering or
 * activating the abbreviation shows the full time zone name.
 *
 * This story sets a site time zone that differs from your browser's.
 */
export const WithSiteTimeZone = Template.bind( {} );
WithSiteTimeZone.args = {
	currentTime: new Date(),
};
WithSiteTimeZone.parameters = {
	docs: {
		// Render in its own iframe, so the global settings don't apply to the
		// other stories on the docs page.
		story: { inline: false, height: '220px' },
	},
};
WithSiteTimeZone.beforeEach = () => {
	const settings = getSettings();
	const browserOffset = -new Date().getTimezoneOffset() / 60;
	setSettings( {
		...settings,
		timezone:
			browserOffset === -4
				? {
						offset: 9,
						offsetFormatted: '9',
						string: 'Asia/Tokyo',
						abbr: 'JST',
					}
				: {
						offset: -4,
						offsetFormatted: '-4',
						string: 'America/Port_of_Spain',
						abbr: 'AST',
					},
	} );
	return () => setSettings( settings );
};

const TimeInputTemplate: StoryFn< typeof TimePicker.TimeInput > = ( args ) => {
	return <TimePicker.TimeInput { ...args } />;
};

/**
 * The time input can be used in isolation as `<TimePicker.TimeInput />`. In this case, the `value` will be passed
 * as an object in 24-hour format (`{ hours: number, minutes: number }`).
 */
export const TimeInput = TimeInputTemplate.bind( {} );
TimeInput.args = {
	label: 'Time',
};
// Hide TimePicker controls because they don't apply to TimeInput
TimeInput.parameters = { controls: { include: [] } };
