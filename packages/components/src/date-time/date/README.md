# DatePicker

DatePicker is a React component that renders a calendar for date selection. It can be used independently or as part of the `DateTimePicker` component.

* Use smart defaults and highlight the current date.

## Usage

Render a DatePicker.
```jsx
import { DatePicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyDatePicker = () => {
  const [ date, setDate ] = useState( new Date() );

  return (
    <DatePicker
      currentDate={ date }
      onChange={ ( newDate ) => setDate( newDate ) }
    />
  );
};
```

## Props

The component accepts the following props:

### `currentDate`: `Date | string | number | null`

The current date at initialization. Optionally pass in a `null` value to specify no date is currently selected.

* Required: No
* Default: today's date

### `onChange`: `( date: string | null ) => void`

The function called when a new date has been selected. It is passed the `currentDate` as an argument.

* Required: No

### `events`: `[{ date: Date }]`

List of events to show in the date picker aria label. Events will appear as a dot on the day of the event. Date can be Date(), string or number.

* Type: `Array`
* Required: No

### `isInvalidDate`: `( date: Date ) => boolean`

A callback function which receives a Date object representing a day as an argument, and should return a Boolean to signify if the day is valid or not.

* Required: No

### `onMonthPreviewed`: `( date: Date ) => void`

A callback invoked when selecting the previous/next month in the date picker. The callback receives the new month date in the ISO format as an argument.

* Required: No

### `startOfWeek`: `number`

The day that the week should start on. 0 for Sunday, 1 for Monday, etc.

* Required: No
* Default: 0
