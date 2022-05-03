export type DateTimeString = string;

export type ValidDateTimeInput = Date | string | number | null;

export interface TimePickerProps {
	/**
	 * The initial current time the time picker should render.
	 */
	currentTime?: ValidDateTimeInput;

	/**
	 * Whether we use a 12-hour clock. With a 12-hour clock, an AM/PM widget is
	 * displayed and the time format is assumed to be `MM-DD-YYYY` (as opposed
	 * to the default format `DD-MM-YYYY`).
	 */
	is12Hour?: boolean;

	/**
	 * The function called when a new time has been selected. It is passed the
	 * time as an argument.
	 */
	onChange?: ( time: DateTimeString ) => void;
}

export interface DatePickerEvent {
	/**
	 * The date of the event.
	 */
	date: Date;
}

export interface DatePickerProps {
	/**
	 * The current date and time at initialization. Optionally pass in a `null`
	 * value to specify no date is currently selected.
	 */
	currentDate?: ValidDateTimeInput;

	/**
	 * The function called when a new date has been selected. It is passed the
	 * date as an argument.
	 */
	onChange?: ( date: DateTimeString ) => void;

	/**
	 * A callback function which receives a Date object representing a day as an
	 * argument, and should return a Boolean to signify if the day is valid or
	 * not.
	 */
	isInvalidDate?: ( date: Date ) => boolean;

	/**
	 * A callback invoked when selecting the previous/next month in the date
	 * picker. The callback receives the new month date in the ISO format as an
	 * argument.
	 */
	onMonthPreviewed?: ( date: DateTimeString ) => void;

	/**
	 * List of events to show in the date picker. Each event will appear as a
	 * dot on the day of the event.
	 */
	events?: DatePickerEvent[];
}

export interface DateTimePickerProps extends DatePickerProps, TimePickerProps {
	/**
	 * The function called when a new date or time has been selected. It is
	 * passed the date and time as an argument.
	 */
	onChange?: ( date: DateTimeString | null ) => void;
}
