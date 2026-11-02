import type { InputProps } from '../input/types';

export interface DateInputChangeDetails {
	/** The native event that caused the change. */
	event: Event;
	reason: 'input-change';
	/** Reject this change. Controlled consumers can also retain their value. */
	cancel: () => void;
	readonly isCanceled: boolean;
}

export interface DateConstraints {
	/** Earliest selectable ISO date, inclusive. */
	min?: string;
	/** Latest selectable ISO date, inclusive. */
	max?: string;
	/** Whether a date is unavailable. Receives a Gregorian YYYY-MM-DD date. */
	isDateUnavailable?: ( date: string ) => boolean;
}

export interface DateInputProps
	extends
		Omit<
			InputProps,
			| 'value'
			| 'defaultValue'
			| 'onValueChange'
			| 'type'
			| 'min'
			| 'max'
			| 'pattern'
		>,
		DateConstraints {
	/** Gregorian YYYY-MM-DD date. Null is empty; undefined is uncontrolled. */
	value?: string | null;
	/** Initial Gregorian YYYY-MM-DD date in uncontrolled mode. */
	defaultValue?: string | null;
	/** Called with a complete ISO date or null when cleared. Invalid drafts remain local. */
	onValueChange?: (
		value: string | null,
		details: DateInputChangeDetails
	) => void;
	/** Locale for numeric Gregorian date editing. Defaults to the runtime locale. */
	locale?: string;
}
