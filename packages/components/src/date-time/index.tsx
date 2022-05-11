/**
 * External dependencies
 */
// Needed to initialise the default datepicker styles.
// See: https://github.com/airbnb/react-dates#initialize
import 'react-dates/initialize';
import { noop } from 'lodash';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useState, forwardRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import { default as DatePicker } from './date';
import { default as TimePicker } from './time';
import type { DateTimePickerProps } from './types';

export { DatePicker, TimePicker };

function UnforwardedDateTimePicker(
	{
		currentDate,
		is12Hour,
		isInvalidDate,
		onMonthPreviewed = noop,
		onChange,
		events,
	}: DateTimePickerProps,
	ref: ForwardedRef< any >
) {
	const [ calendarHelpIsVisible, setCalendarHelpIsVisible ] = useState(
		false
	);

	function onClickDescriptionToggle() {
		setCalendarHelpIsVisible( ! calendarHelpIsVisible );
	}

	return (
		<div ref={ ref } className="components-datetime">
			{ ! calendarHelpIsVisible && (
				<>
					<TimePicker
						currentTime={ currentDate }
						onChange={ onChange }
						is12Hour={ is12Hour }
					/>
					<DatePicker
						currentDate={ currentDate }
						onChange={ onChange }
						isInvalidDate={ isInvalidDate }
						events={ events }
						onMonthPreviewed={ onMonthPreviewed }
					/>
				</>
			) }
			{ calendarHelpIsVisible && (
				<>
					<div className="components-datetime__calendar-help">
						<h4>{ __( 'Click to Select' ) }</h4>
						<ul>
							<li>
								{ __(
									'Click the right or left arrows to select other months in the past or the future.'
								) }
							</li>
							<li>
								{ __( 'Click the desired day to select it.' ) }
							</li>
						</ul>
						<h4>{ __( 'Navigating with a keyboard' ) }</h4>
						<ul>
							<li>
								<abbr
									aria-label={ _x(
										'Enter',
										'keyboard button'
									) }
								>
									↵
								</abbr>
								{
									' ' /* JSX removes whitespace, but a space is required for screen readers. */
								}
								<span>
									{ __( 'Select the date in focus.' ) }
								</span>
							</li>
							<li>
								<abbr
									aria-label={ __( 'Left and Right Arrows' ) }
								>
									←/→
								</abbr>
								{
									' ' /* JSX removes whitespace, but a space is required for screen readers. */
								}
								{ __(
									'Move backward (left) or forward (right) by one day.'
								) }
							</li>
							<li>
								<abbr aria-label={ __( 'Up and Down Arrows' ) }>
									↑/↓
								</abbr>
								{
									' ' /* JSX removes whitespace, but a space is required for screen readers. */
								}
								{ __(
									'Move backward (up) or forward (down) by one week.'
								) }
							</li>
							<li>
								<abbr
									aria-label={ __( 'Page Up and Page Down' ) }
								>
									{ __( 'PgUp/PgDn' ) }
								</abbr>
								{
									' ' /* JSX removes whitespace, but a space is required for screen readers. */
								}
								{ __(
									'Move backward (PgUp) or forward (PgDn) by one month.'
								) }
							</li>
							<li>
								<abbr aria-label={ __( 'Home and End' ) }>
									{ /* Translators: Home/End reffer to the 'Home' and 'End' buttons on the keyboard.*/ }
									{ __( 'Home/End' ) }
								</abbr>
								{
									' ' /* JSX removes whitespace, but a space is required for screen readers. */
								}
								{ __(
									'Go to the first (Home) or last (End) day of a week.'
								) }
							</li>
						</ul>
					</div>
				</>
			) }
			<div className="components-datetime__buttons">
				{ ! calendarHelpIsVisible && currentDate && (
					<Button
						className="components-datetime__date-reset-button"
						variant="link"
						onClick={ () => onChange?.( null ) }
					>
						{ __( 'Reset' ) }
					</Button>
				) }
				<Button
					className="components-datetime__date-help-toggle"
					variant="link"
					onClick={ onClickDescriptionToggle }
				>
					{ calendarHelpIsVisible
						? __( 'Close' )
						: __( 'Calendar Help' ) }
				</Button>
			</div>
		</div>
	);
}

/**
 * DateTimePicker is a React component that renders a calendar and clock for
 * date and time selection. The calendar and clock components can be accessed
 * individually using the `DatePicker` and `TimePicker` components respectively.
 *
 * ```jsx
 * import { DateTimePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDateTimePicker = () => {
 *   const [ date, setDate ] = useState( new Date() );
 *
 *   return (
 *     <DateTimePicker
 *       currentDate={ date }
 *       onChange={ ( newDate ) => setDate( newDate ) }
 *       is12Hour
 *     />
 *   );
 * };
 * ```
 */
export const DateTimePicker = forwardRef( UnforwardedDateTimePicker );

export default DateTimePicker;
