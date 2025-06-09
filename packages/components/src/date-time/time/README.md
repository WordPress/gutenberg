# TimePicker

TimePicker is a React component that renders a clock for time selection. It can be used independently or as part of the `DateTimePicker` component.

## Usage

Render a TimePicker.

```jsx
import { TimePicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyTimePicker = () => {

  const [ time, setTime ] = useState( new Date() );
  return (
    <TimePicker
      currentTime={ date }
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

* Required: No
* Default: current time

### `onChange`: `( time: string ) => void`

The function called when a new time has been selected. It is passed the time as an ISO-formatted string.

* Required: No

### `is12Hour`: `boolean`

Whether we use a 12-hour clock. With a 12-hour clock, an AM/PM widget is displayed and the time format is assumed to be `MM-DD-YYYY` (as opposed to the default format `DD-MM-YYYY`).

* Type: `bool`
* Required: No
* Default: false

### `dateOrder`: `'dmy' | 'mdy' | 'ymd'`

The order of day, month, and year. This prop overrides the time format determined by `is12Hour` prop.
* Type: `string`
* Required: No
* Default: `'dmy'` (or `'mdy'` when `is12Hour` is true)

### `hideLabelFromVision`: `boolean`

Whether to visually hide field labels while keeping them accessible to screen readers.

* Type: `bool`
* Required: No
* Default: false
