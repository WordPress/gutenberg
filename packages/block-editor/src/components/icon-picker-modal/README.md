# IconPickerModal

`<IconPickerModal />` renders a full-screen modal for selecting an icon from a provided list. It includes a search field that filters icons by name and label.

## Usage

```jsx
import { useState } from '@wordpress/element';
import { IconPickerModal } from '@wordpress/block-editor';

const icons = [
	{ name: 'star', label: 'Star', content: '<svg viewBox="0 0 24 24">…</svg>' },
];

function MyIconPicker() {
	const [ isOpen, setIsOpen ] = useState( true );
	const [ value, setValue ] = useState();

	if ( ! isOpen ) return null;

	return (
		<IconPickerModal
			icons={ icons }
			value={ value }
			onSelect={ ( name ) => {
				setValue( name );
				setIsOpen( false );
			} }
			onRequestClose={ () => setIsOpen( false ) }
		/>
	);
}
```

## Props

### `icons`

The icon list to display.

-   Type: `Array<{ name: string, label: string, content: string }>`
-   Default: `[]`

### `value`

The currently selected icon `name`.

-   Type: `string`
-   Required: No

### `onSelect`

Called with the selected icon `name`.

-   Type: `(name: string) => void`
-   Required: No

### `onRequestClose`

Called when the modal should be closed.

-   Type: `() => void`
-   Required: Yes

### `title`

Modal title.

-   Type: `string`
-   Default: `Icon library`
