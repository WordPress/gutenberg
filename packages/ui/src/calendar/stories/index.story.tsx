import { fn } from 'storybook/test';
import { TZDate } from 'react-day-picker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from '@wordpress/element';
import { Calendar } from '../index';
import {
	toDate,
	SHARED_ARG_TYPES,
	DISABLED_DATES_SAMPLE,
	firstDayOfNextMonth,
} from './shared';

const meta: Meta< typeof Calendar > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Calendar',
	component: Calendar,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Recently promoted from a private API. The visual design and the prop surface may still change in a minor release.',
		},
	},
	render: ( { endMonth, ...args } ) => (
		<Calendar { ...args } endMonth={ toDate( endMonth ) } />
	),
	argTypes: SHARED_ARG_TYPES,
	args: {
		onMonthChange: fn(),
		onSelect: fn(),
	},
};
export default meta;

type Story = StoryObj< typeof Calendar >;

export const Default: Story = {};

export const DisabledDates: Story = {
	args: {
		disabled: DISABLED_DATES_SAMPLE,
	},
};

export const WithSelectedDateAndMonth: Story = {
	args: {
		defaultSelected: firstDayOfNextMonth,
		defaultMonth: firstDayOfNextMonth,
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
	render: function CalendarWithTimeZone( { endMonth, ...args } ) {
		const [ selected, setSelected ] = useState< TZDate | null >( null );

		useEffect( () => {
			setSelected(
				// Select one week from today every time the time zone changes.
				new TZDate(
					new Date().setDate( new Date().getDate() + 7 ),
					args.timeZone
				)
			);
		}, [ args.timeZone ] );

		return (
			<>
				<Calendar
					{ ...args }
					endMonth={ toDate( endMonth ) }
					selected={ selected }
					onSelect={ ( selectedDate, ...rest ) => {
						setSelected(
							selectedDate
								? new TZDate( selectedDate, args.timeZone )
								: null
						);
						args.onSelect?.( selectedDate, ...rest );
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
					with a default date of 1 week from today.
				</p>
			</>
		);
	},
	args: {
		timeZone: 'Pacific/Auckland',
	},
	argTypes: {
		selected: {
			control: false,
		},
		defaultSelected: {
			control: false,
		},
		disabled: {
			control: false,
		},
	},
};
