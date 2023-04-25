/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useState, forwardRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { default as DatePicker } from '../date';
import { default as TimePicker } from '../time';
import type { DateTimePickerProps } from '../types';
import { Wrapper, CalendarHelp } from './styles';
import { HStack } from '../../h-stack';
import { Heading } from '../../heading';
import { Spacer } from '../../spacer';

export { DatePicker, TimePicker };

const noop = () => {};

function UnforwardedDateTimePicker(
	{
		currentDate,
		is12Hour,
		isInvalidDate,
		onMonthPreviewed = noop,
		onChange,
		events,
		startOfWeek,
		__nextRemoveHelpButton = false,
		__nextRemoveResetButton = false,
	}: DateTimePickerProps,
	ref: ForwardedRef< any >
) {
	if ( ! __nextRemoveHelpButton ) {
		deprecated( 'Help button in wp.components.DateTimePicker', {
			since: '13.4',
			version: '15.8', // One year of plugin releases.
			hint: 'Set the `__nextRemoveHelpButton` prop to `true` to remove this warning and opt in to the new behaviour, which will become the default in a future version.',
		} );
	}
	if ( ! __nextRemoveResetButton ) {
		deprecated( 'Reset button in wp.components.DateTimePicker', {
			since: '13.4',
			version: '15.8', // One year of plugin releases.
			hint: 'Set the `__nextRemoveResetButton` prop to `true` to remove this warning and opt in to the new behaviour, which will become the default in a future version.',
		} );
	}

	const [ calendarHelpIsVisible, setCalendarHelpIsVisible ] =
		useState( false );

	function onClickDescriptionToggle() {
		setCalendarHelpIsVisible( ! calendarHelpIsVisible );
	}

	return (
		<Wrapper ref={ ref } className="components-datetime" spacing={ 4 }>
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
						startOfWeek={ startOfWeek }
					/>
				</>
			) }
			{ calendarHelpIsVisible && (
				<CalendarHelp
					className="components-datetime__calendar-help" // Unused, for backwards compatibility.
				>
					<Heading level={ 4 }>{ __( 'Click to Select' ) }</Heading>
					<ul>
						<li>
							{ __(
								'Click the right or left arrows to select other months in the past or the future.'
							) }
						</li>
						<li>{ __( 'Click the desired day to select it.' ) }</li>
					</ul>
					<Heading level={ 4 }>
						{ __( 'Navigating with a keyboard' ) }
					</Heading>
					<ul>
						<li>
							<abbr
								aria-label={ _x( 'Enter', 'keyboard button' ) }
							>
								↵
							</abbr>
							{
								' ' /* JSX removes whitespace, but a space is required for screen readers. */
							}
							<span>{ __( 'Select the date in focus.' ) }</span>
						</li>
						<li>
							<abbr aria-label={ __( 'Left and Right Arrows' ) }>
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
							<abbr aria-label={ __( 'Page Up and Page Down' ) }>
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
				</CalendarHelp>
			) }
			{ ( ! __nextRemoveResetButton || ! __nextRemoveHelpButton ) && (
				<HStack
					className="components-datetime__buttons" // Unused, for backwards compatibility.
				>
					{ ! __nextRemoveResetButton &&
						! calendarHelpIsVisible &&
						currentDate && (
							<Button
								className="components-datetime__date-reset-button" // Unused, for backwards compatibility.
								variant="link"
								onClick={ () => onChange?.( null ) }
							>
								{ __( 'Reset' ) }
							</Button>
						) }
					<Spacer />
					{ ! __nextRemoveHelpButton && (
						<Button
							className="components-datetime__date-help-toggle" // Unused, for backwards compatibility.
							variant="link"
							onClick={ onClickDescriptionToggle }
						>
							{ calendarHelpIsVisible
								? __( 'Close' )
								: __( 'Calendar Help' ) }
						</Button>
					) }
				</HStack>
			) }
		</Wrapper>
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
 *       __nextRemoveHelpButton
 *       __nextRemoveResetButton
 *     />
 *   );
 * };
 * ```
 */
export const DateTimePicker = forwardRef( UnforwardedDateTimePicker );

export default DateTimePicker;
