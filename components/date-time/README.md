DateTimePicker
=======

DateTimePicker is a React component to render a calendar and clock for selecting a date and time. The calendar and clock components can be accessed individually using the `DatePicker` and `TimePicker` components respectively.

## Usage

Render a DateTimePicker.

```jsx
import { DateTimePicker } from '@wordpress/components';
import { getSettings } from '@wordpress/date';

function selectTime( date, onUpdateDate ) {
	const settings = getSettings();

	// To know if the current timezone is a 12 hour time with look for "a" in the time format.
	// We also make sure this a is not escaped by a "/".
	const is12HourTime = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only the lower case a
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings
			.split( '' ).reverse().join( '' ) // Reverse the string and test for "a" not followed by a slash
	);

	return (
		<DateTimePicker
		    currentDate={ date }
		    utcOffset={ settings.timezone.offset }
		    onChange={ onUpdateDate }
		    locale={ settings.l10n.locale }
		    is12Hour={ is12HourTime }
		    showTodayButton
		    />
	);
}
```

## Props

The component accepts the following props:

### currentDate

The current date and time at initialization.

- Type: `string`
- Required: Yes

### onChange

The function called when a new date or time has been selected. It is passed the `currentDate` as an argument.

- Type: `Function`
- Required: No
- Default: `noop`

### utcOffset

The offset of current timezone. This prop is required if `showTodayButton` is true.

- Type: `integer`
- Required: No

### locale

The localization for the display of the date and time.

- Type: `string`
- Required: No

### is12Hour

Whether the current timezone is a 12 hour time.

- Type: `bool`
- Required: No

### showTodayButton

Whether to display the "Today" button in the date-picker.

- Type: `bool`
- Required: No
