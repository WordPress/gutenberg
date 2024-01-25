# `PublishDateTimePicker`

`<PublishDateTimePicker />` is a component used to select the date and time that
a post will be published. It wraps the `<DateTimePicker />` component found in
`@wordpress/components` and adds additional post-specific controls.

See [the documentation for DateTimePicker](/packages/components/src/date-time)
for more information.

## Usage

```jsx
import { useState } from 'react';
import { Dropdown, Button } from '@wordpress/components';
import { __experimentalPublishDateTimePicker as PublishDateTimePicker } from '@wordpress/block-editor';

const MyDateTimePicker = () => {
	const [ date, setDate ] = useState( new Date() );

	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					Select post date
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<PublishDateTimePicker
					currentDate={ date }
					onChange={ ( newDate ) => setDate( newDate ) }
					onClose={ onClose }
				/>
			) }
		/>
	);
};
```

## Props

`PublishDateTimePicker` supports all of the props that
[`DateTimePicker`](/packages/components/src/date-time#Props) supports, plus:

### onClose

Called when the user presses the close button.

- Type: `Function`
- Required: No
