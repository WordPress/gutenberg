# BottomSheet Header

BottomSheet Header components provide styled elements for composing header UI within a `BottomSheet`.

## Usage

```jsx
import { BottomSheet } from '@wordpress/components';

export default = () => (
	<BottomSheet>
		<BottomSheet.Header>
			<BottomSheet.Header.BackButton onPress={ () => {} } />
			<BottomSheet.Header.Title>A Sheet Title</BottomSheet.Header.Title>
			<BottomSheet.Header.ApplyButton onPress={ () => {} } />
		</BottomSheet.Header>
	</BottomSheet>
);
```

## BottomSheet.Header

Provides structural styles for left-center-right layout for header UI.

## BottomSheet.Header.Title

Displays a styled title for a bottom sheet.

## BottomSheet.Header.ApplyButton

Displays a styled button to apply settings of bottom sheet controls.

### Props

#### onPress

Callback invoked once the button is pressed.

## BottomSheet.Header.BackButton

Displays a styled button to navigate backwards from a bottom sheet.

### Props

#### onPress

Callback invoked once the button is pressed.

## BottomSheet.Header.CancelButton

Displays a styled button to dismiss a full screen bottom sheet.

### Props

#### onPress

Callback invoked once the button is pressed.

## BottomSheet.Header.CloseButton

Displays a styled button to dismiss a full screen bottom sheet.

### Props

#### onPress

Callback invoked once the button is pressed.
