import { forwardRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Calendar } from '../../../calendar';
import { TemporalInput } from './temporal-input';
import { fromCalendarDate, toCalendarDate } from './date-model';
import {
	assertDateConstraints,
	getDateError,
	parseDate,
	serializeDate,
} from './validation';
import type { DateInputProps } from './types';

/** An ISO date text input with custom validation and an optional calendar. */
export const DateInput = forwardRef< HTMLInputElement, DateInputProps >(
	function UnforwardedDateInput(
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
						'Use YYYY-MM-DD, for example %s.'
					),
					'2026-01-20'
				) }
				placeholder={ props.placeholder ?? 'YYYY-MM-DD' }
				parse={ parseDate }
				serialize={ serializeDate }
				getError={ ( text ) => getDateError( text, constraints ) }
				calendar={
					showCalendar
						? ( value, select ) => (
								<Calendar
									locale={ locale }
									timeZone="UTC"
									// eslint-disable-next-line jsx-a11y/no-autofocus -- Focus the calendar only after the user opens it.
									autoFocus
									defaultMonth={
										value
											? toCalendarDate( value )
											: undefined
									}
									value={
										value ? toCalendarDate( value ) : null
									}
									disabled={ ( date ) =>
										!! getDateError(
											fromCalendarDate( date ),
											constraints
										)
									}
									onValueChange={ (
										date,
										_triggerDate,
										_modifiers,
										event
									) =>
										select(
											date
												? fromCalendarDate( date )
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
	}
);
