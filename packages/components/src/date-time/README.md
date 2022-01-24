# DateTimePicker

DateTimePicker is a React component that renders a calendar and clock for date and time selection. The calendar and clock components can be accessed individually using the `DatePicker` and `TimePicker` components respectively.

![Date Time component](https://wordpress.org/gutenberg/files/2019/07/date-time-picker.png)

## Best practices

Date pickers should:

-   Use smart defaults and highlight the current date.

## Usage

Render a DateTimePicker.

```jsx
import { DateTimePicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyDateTimePicker = () => {
	const [ date, setDate ] = useState( new Date() );

	return (
		<DateTimePicker
			currentDate={ date }
			onChange={ ( newDate ) => setDate( newDate ) }
			is12Hour={ true }
		/>
	);
}
```

## Props

The component accepts the following props:

### currentDate

The current date and time at initialization. Optionally pass in a `null` value to specify no date is currently selected.

-   Type: `string`
-   Required: No
-   Default: today's date

### onChange

The function called when a new date or time has been selected. It is passed the `currentDate` as an argument.

-   Type: `Function`
-   Required: Yes

### is12Hour

Whether we use a 12-hour clock. With a 12-hour clock, an AM/PM widget is displayed and the time format is assumed to be MM-DD-YYYY.

-   Type: `bool`
-   Required: No
-   Default: false

### isInvalidDate

A callback function which receives a Date object representing a day as an argument, and should return a Boolean to signify if the day is valid or not.

-   Type: `Function`
-   Required: No

### onMonthPreviewed

A callback invoked when selecting the previous/next month in the date picker. The callback receives the new month date in the ISO format as an argument.

- Type: `Function`
- Required: No
