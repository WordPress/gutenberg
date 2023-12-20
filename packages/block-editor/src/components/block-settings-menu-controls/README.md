# BlockSettingsMenuControls

Block Settings Menu Controls appear in the block settings dropdown menu when the more options are shown for a block that is being edited. The controls appear in both HTML and visual editing modes, and thus should contain settings that affect the entire block.

## Usage

```jsx
import { BlockSettingsMenuControls } from '@wordress/block-editor';
import MyButton from './my-toggle-button';

function ReusableBlocksMenuItems() {
	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => <MyToggleButton onToggle={ onClose } /> }
		</BlockSettingsMenuControls>
	);
}
```

## Props

### `__unstableDisplayLocation`

-   **Type:** `String`
-   **Default:** `undefined`

A string representing the location where the component is being displayed within the UI. This can be used to conditionalize certain behaviors including the display of associated components. This behaviour will likely be refactored to a React.Context implementation.
