import { forwardRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { RangeCalendar } from '../../../calendar';
import { TemporalInput } from './temporal-input';
import { fromCalendarDate, toCalendarDate } from './date-model';
import {
	assertDateConstraints,
	getDateError,
	getRangeError,
	parseRange,
	serializeRange,
} from './validation';
import type { DateRangeInputProps } from './types';

/** A date range in one text field, with an optional range calendar. */
export const DateRangeInput = forwardRef<
	HTMLInputElement,
	DateRangeInputProps
>( function UnforwardedDateRangeInput(
	{ min, max, isDateUnavailable, showCalendar = false, locale, ...props },
	ref
) {
	const constraints = { min, max, isDateUnavailable };
	assertDateConstraints( constraints );
	return (
		<TemporalInput
			{ ...props }
			inputRef={ ref }
			formatDescription={ sprintf(
				/* translators: %s: Example ISO date value. */ __(
					'Use YYYY-MM-DD/YYYY-MM-DD, for example %s.'
				),
				'2026-01-20/2026-01-22'
			) }
			placeholder={ props.placeholder ?? 'YYYY-MM-DD/YYYY-MM-DD' }
			parse={ parseRange }
			serialize={ serializeRange }
			getError={ ( text ) => getRangeError( text, constraints ) }
			calendar={
				showCalendar
					? ( value, select ) => (
							<RangeCalendar
								locale={ locale }
								timeZone="UTC"
								// eslint-disable-next-line jsx-a11y/no-autofocus -- Focus the calendar only after the user opens it.
								autoFocus
								defaultMonth={
									value?.from
										? toCalendarDate( value.from )
										: undefined
								}
								value={
									value
										? {
												from: value.from
													? toCalendarDate(
															value.from
														)
													: undefined,
												to: value.to
													? toCalendarDate( value.to )
													: undefined,
											}
										: null
								}
								disabled={ ( date ) =>
									!! getDateError(
										fromCalendarDate( date ),
										constraints
									)
								}
								onValueChange={ (
									range,
									_triggerDate,
									_modifiers,
									event
								) =>
									select(
										range
											? {
													from: range.from
														? fromCalendarDate(
																range.from
															)
														: undefined,
													to: range.to
														? fromCalendarDate(
																range.to
															)
														: undefined,
												}
											: null,
										event
									)
								}
							/>
						)
					: undefined
			}
		/>
	);
} );
