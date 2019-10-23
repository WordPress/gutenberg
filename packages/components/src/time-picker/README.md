# TimePicker

TimePicker is a React component that renders a clock for time selection.

## Usage

Render a TimePicker.

```jsx
import { TimePicker } from '@wordpress/components';

const MyTimePicker = ({ date, is12HourTime }) => (
    <TimePicker
        currentTime={ date }
        is12Hour={ is12HourTime }
    />
);
```

## Props

The component accepts the following props:

### currentTime

The current date and time at initialization. Optionally pass in a `null` value to specify no date is currently selected.

- Type: `string`
- Required: No
- Default: current's date and time

### is12Hour

Whether we use a 12-hour clock. With a 12-hour clock, an AM/PM widget is displayed and the time format is assumed to be DD-MM-YYYY. 24-hour clock will have time formatted as MM-DD-YYYY.

- Type: `bool`
- Required: No
