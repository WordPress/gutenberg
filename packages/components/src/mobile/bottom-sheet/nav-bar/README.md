# BottomSheet Header

BottomSheet Header components provide styled elements for composing header UI within a `BottomSheet`.

## Usage

```jsx
import { BottomSheet } from '@wordpress/components';

export default = () => (
	<BottomSheet>
		<BottomSheet.NavBar>
			<BottomSheet.NavBar.BackButton onPress={ () => {} } />
			<BottomSheet.NavBar.Title>A Sheet Title</BottomSheet.NavBar.Title>
			<BottomSheet.NavBar.ApplyButton onPress={ () => {} } />
		</BottomSheet.NavBar>
	</BottomSheet>
);
```

## BottomSheet.NavBar

Provides structural styles for left-center-right layout for header UI.

## BottomSheet.NavBar.Title

Displays a styled title for a bottom sheet.

## BottomSheet.NavBar.ApplyButton

Displays a styled button to apply settings of bottom sheet controls.

### Props

#### onPress

Callback invoked once the button is pressed.

## BottomSheet.NavBar.BackButton

Displays a styled button to navigate backwards from a bottom sheet.

### Props

#### onPress

Callback invoked once the button is pressed.

## BottomSheet.NavBar.DismissButton

Displays a styled button to dismiss a full screen bottom sheet.

### Props

#### onPress

Callback invoked once the button is pressed.

#### iosText 

Used to display iOS text if different from "Cancel". 