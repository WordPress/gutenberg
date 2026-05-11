# TimePicker

TimePicker is a React component that renders form inputs for time and date selection. It can be used independently or as part of the `DateTimePicker` component.

**Note:** `TimePicker` also exposes a compound sub-component, `TimePicker.TimeInput`, which can be used independently to render a time input field without the full picker UI.

## Usage

Render a TimePicker.

```jsx
import { useState } from 'react';
import { TimePicker } from '@wordpress/components';

const MyTimePicker = () => {
	const [ time, setTime ] = useState( new Date() );

	return (
		<TimePicker
			currentTime={ time }
			onChange={ ( newTime ) => setTime( newTime ) }
			is12Hour
		/>
	);
};
```

## Props

The component accepts the following props:

### `currentTime`: `Date | string | number | null`

The current time at initialization. Optionally pass in a `null` value to specify no time is currently selected.

-   Required: No
-   Default: current time

### `onChange`: `( time: string ) => void`

The function called when a new time has been selected. It is passed the time as an ISO-formatted string.

-   Required: No

### `is12Hour`: `boolean`

Whether we use a 12-hour clock. With a 12-hour clock, an AM/PM widget is displayed.

-   Required: No
-   Default: false

### `dateOrder`: `'dmy' | 'mdy' | 'ymd'`

The order of day, month, and year. This prop overrides the time format determined by `is12Hour` prop.

-   Required: No
-   Default: `'dmy'` (or `'mdy'` when `is12Hour` is `true`)

### `hideLabelFromVision`: `boolean`

Whether to visually hide field labels while keeping them accessible to screen readers.

-   Required: No
-   Default: false

## TimePicker.TimeInput

A standalone time input component. Values are passed as an object in 24-hour format (`{ hours: number, minutes: number }`).

### Usage

```jsx
import { useState } from 'react';
import { TimePicker } from '@wordpress/components';

const MyTimeInput = () => {
	const [ time, setTime ] = useState( { hours: 13, minutes: 30 } );

	return (
		<TimePicker.TimeInput
			value={ time }
			onChange={ setTime }
			label="Time"
		/>
	);
};
```

### Props

#### `value`: `{ hours: number, minutes: number }`

The time input value in 24-hour format.

-   Required: No

#### `defaultValue`: `{ hours: number, minutes: number }`

An optional default value for the control when used in uncontrolled mode. If left `undefined`, the current time will be used.

-   Required: No

#### `onChange`: `( time: { hours: number, minutes: number } ) => void`

Called when the time changes. Receives the new value as an object with `hours` and `minutes`.

-   Required: No

#### `is12Hour`: `boolean`

Whether to use a 12-hour clock. With a 12-hour clock, an AM/PM widget is displayed.

-   Required: No

#### `label`: `string`

The label for the time input.

-   Required: No
