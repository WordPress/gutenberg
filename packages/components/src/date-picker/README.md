# DateTimePicker

DatePicker is a React component that renders a calendar date selection.

## Best practices

Date pickers should:

- Use smart defaults and highlight the current date.

## Usage

Render a DatePicker.

```jsx
import { DatePicker } from '@wordpress/components';

const MyDatePicker = ({ date }) => (
		<DatePicker
			currentDate={ date }
			onChange={ ( date ) => console.log(date) }
		/>
	);
});
```

## Props

The component accepts the following props:

### currentDate

The current date and time at initialization. Optionally pass in a `null` value to specify no date is currently selected.

- Type: `string`
- Required: No
- Default: today's date

### onChange

The function called when a new date or time has been selected. It is passed the `currentDate` as an argument.

- Type: `Function`
- Required: Yes

### isInvalidDate

A callback function which receives a Date object representing a day as an argument, and should return a Boolean to signify if the day is valid or not.

- Type: `Function`
- Required: No
