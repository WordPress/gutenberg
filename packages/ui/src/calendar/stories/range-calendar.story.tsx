import { fn } from 'storybook/test';
import { TZDate } from '@daypicker/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from '@wordpress/element';
import { RangeCalendar } from '../index';
import {
	toDate,
	SHARED_ARG_TYPES,
	DISABLED_DATES_SAMPLE,
	firstDayOfNextMonth,
	fourthDayOfNextMonth,
} from './shared';

const meta: Meta< typeof RangeCalendar > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Calendar/RangeCalendar',
	component: RangeCalendar,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
	render: ( { endMonth, ...args } ) => (
		<RangeCalendar { ...args } endMonth={ toDate( endMonth ) } />
	),
	argTypes: {
		...SHARED_ARG_TYPES,
		value: { control: false },
		defaultValue: { control: false },
	},
	args: {
		onMonthChange: fn(),
		onValueChange: fn(),
	},
};
export default meta;

type Story = StoryObj< typeof RangeCalendar >;

export const Default: Story = {};

export const DisabledDates: Story = {
	args: {
		disabled: DISABLED_DATES_SAMPLE,
	},
};

export const WithSelectedRangeAndMonth: Story = {
	args: {
		defaultValue: {
			from: firstDayOfNextMonth,
			to: fourthDayOfNextMonth,
		},
		defaultMonth: firstDayOfNextMonth,
	},
};

/**
 * Use `min` and `max` to constrain the number of nights the range may span, and
 * `excludeDisabled` to reset the range when it would include a disabled day.
 */
export const WithRangeConstraints: Story = {
	args: {
		min: 2,
		max: 7,
		excludeDisabled: true,
		disabled: { dayOfWeek: [ 0, 6 ] },
	},
};

/**
 * Shows days from adjacent months in the grid. Outside days use a lighter style
 * and are still interactive. Use `fixedWeeks` to keep the grid height constant.
 */
export const WithOutsideDays: Story = {
	args: {
		showOutsideDays: true,
		fixedWeeks: true,
	},
};

/**
 * When working with time zones, use the `TZDate` object from the
 * [`@date-fns/tz`](https://www.npmjs.com/package/@date-fns/tz) package instead
 * of the native `Date` object.
 */
export const WithTimeZone: Story = {
	render: function RangeCalendarWithTimeZone( { endMonth, ...args } ) {
		const [ range, setRange ] = useState< typeof args.value >( null );

		useEffect( () => {
			setRange(
				// Select from one week from today to two weeks from today
				// every time the timezone changes.
				{
					from: new TZDate(
						new Date().setDate( new Date().getDate() + 7 ),
						args.timeZone
					),
					to: new TZDate(
						new Date().setDate( new Date().getDate() + 14 ),
						args.timeZone
					),
				}
			);
		}, [ args.timeZone ] );

		return (
			<>
				<RangeCalendar
					{ ...args }
					endMonth={ toDate( endMonth ) }
					value={ range }
					onValueChange={ ( selectedDate, ...rest ) => {
						setRange(
							// Set controlled state to null if there's no selection
							! selectedDate ||
								( selectedDate.from === undefined &&
									selectedDate.to === undefined )
								? null
								: selectedDate
						);
						args.onValueChange?.( selectedDate, ...rest );
					} }
					disabled={ [
						{
							// Disable any date before today
							before: new TZDate( new Date(), args.timeZone ),
						},
					] }
				/>
				<p>
					Calendar set to { args.timeZone ?? 'current' } timezone,
					disabling selection for all dates before today, and starting
					with a default date range of 1 week from today to 2 weeks
					from today.
				</p>
			</>
		);
	},
	args: {
		timeZone: 'Pacific/Auckland',
	},
	argTypes: {
		disabled: {
			control: false,
		},
	},
};
