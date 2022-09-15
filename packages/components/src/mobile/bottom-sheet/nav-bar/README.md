# BottomSheet NavBar

BottomSheet NavBar components provide styled elements for composing a NavBar UI within a `BottomSheet`. It makes several other components available, which can then be used to compose the NavBar's content.

## Usage

```jsx
import { BottomSheet } from '@wordpress/components';

export default = () => (
	<BottomSheet>
		<BottomSheet.NavBar>
			<BottomSheet.NavBar.BackButton onPress={ () => {} } />
			<BottomSheet.NavBar.Heading>A Sheet Title</BottomSheet.NavBar.Heading>
			<BottomSheet.NavBar.ApplyButton onPress={ () => {} } />
		</BottomSheet.NavBar>
	</BottomSheet>
);
```

## BottomSheet.NavBar

Provides structural styles for left-center-right layout for header UI.

## BottomSheet.NavBar.Heading

Displays a styled title for a bottom sheet.

## BottomSheet.NavBar.ApplyButton

Displays a styled button to apply settings of bottom sheet controls.

### Props

#### onPress

Callback invoked once the button is pressed.

## BottomSheet.NavBar.BackButton

Displays a styled button to navigate backwards from a bottom sheet.
Note that the backwards navigation needs to be implemented in the callback that is passed in onPress.

### Props

#### onPress

Callback invoked once the button is pressed.

## BottomSheet.NavBar.DismissButton

Displays a styled button to dismiss the bottom sheet screen.
Note that the bottomSheet dismissal needs to be implemented in the callback that is passed in onPress.

### Props

#### onPress

Callback invoked once the button is pressed.

#### iosText 

Used to display iOS text if different from "Cancel".
