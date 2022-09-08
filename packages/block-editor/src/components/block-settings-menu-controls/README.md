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

### `context`

-   **Type:** `String`
-   **Default:** `undefined`

A string representing the context where the component is being included. This can be used to conditionalise certain beheaviours.
