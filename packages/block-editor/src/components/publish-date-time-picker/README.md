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
					title={ __( 'Select post date' ) }
				/>
			) }
		/>
	);
};
```

## Props

`PublishDateTimePicker` supports all of the props that
[`DateTimePicker`](/packages/components/src/date-time#Props) supports, plus:

### title

The title displayed in the header of the popover that contains the `DateTimePicker`.

- Type: `String`
- Required: No
- Default: `Publish`

### onClose

Called when the user presses the close button.

- Type: `Function`
- Required: No

### showPopoverHeader

Whether to render the popover header, which holds the title, the close button
and a "Reset" action that clears the date. Set it to `false` when the picker is
rendered inline, where the surrounding UI already provides a heading; the
"Reset" action then renders as a button below the picker.

- Type: `Boolean`
- Required: No
- Default: `true`

### canReset

Whether there is a date to reset. When `false` the "Reset" action is not
rendered at all, since clearing an already unset date does nothing.

- Type: `Boolean`
- Required: No
- Default: `true`
