import type { InputProps } from '../input/types';

export interface DateInputChangeDetails {
	/** The native event that caused the change. */
	event: Event;
	/** Whether typing or calendar selection caused the change. */
	reason: 'input-change' | 'calendar-selection';
	/** Reject this change. Controlled consumers can also retain their value. */
	cancel: () => void;
	readonly isCanceled: boolean;
}

export interface TextValueProps< T > extends Omit<
	InputProps,
	| 'value'
	| 'defaultValue'
	| 'onValueChange'
	| 'type'
	| 'min'
	| 'max'
	| 'pattern'
	| 'suffix'
> {
	/** The selected value (controlled). Null is empty; undefined is uncontrolled. */
	value?: T | null;
	/** The initial value (uncontrolled). */
	defaultValue?: T | null;
	/** Called for complete values or clearing. Invalid drafts stay in the input. */
	onValueChange?: (
		value: T | null,
		details: DateInputChangeDetails
	) => void;
}

export interface DateConstraints {
	/** Earliest selectable ISO date, inclusive. */
	min?: string;
	/** Latest selectable ISO date, inclusive. */
	max?: string;
	/** Whether a date is unavailable. Ranges apply this to their endpoints. */
	isDateUnavailable?: ( date: string ) => boolean;
}

export interface CalendarOptions {
	/**
	 * Show a button that opens a calendar.
	 * @default false
	 */
	showCalendar?: boolean;
	/** Calendar locale. Text entry always uses Gregorian ISO dates. */
	locale?: string;
}

export interface DateInputProps
	extends TextValueProps< string >, DateConstraints, CalendarOptions {}

export interface DateRangeValue {
	from: string | undefined;
	to?: string;
}

export interface DateRangeInputProps
	extends
		TextValueProps< DateRangeValue >,
		DateConstraints,
		CalendarOptions {}

export interface TimeInputProps extends TextValueProps< string > {
	/**
	 * Smallest displayed time unit.
	 * @default 'minute'
	 */
	precision?: 'minute' | 'second';
	/** Earliest local time, inclusive, in the selected precision. */
	min?: string;
	/** Latest local time, inclusive, in the selected precision. */
	max?: string;
}
