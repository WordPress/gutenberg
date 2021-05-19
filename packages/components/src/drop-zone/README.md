# DropZone

`DropZone` is a Component creating a drop zone area taking the full size of its parent element. It supports dropping files, HTML content or any other HTML drop event.

## Usage

```jsx
import { DropZone } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyDropZone = withState( {
	hasDropped: false,
} )( ( { hasDropped, setState } ) => (
	<div>
		{ hasDropped ? 'Dropped!' : 'Drop something here' }
		<DropZone
			onFilesDrop={ () => setState( { hasDropped: true } ) }
			onHTMLDrop={ () => setState( { hasDropped: true } ) }
			onDrop={ () => setState( { hasDropped: true } ) }
		/>
	</div>
) );
```

## Props

The component accepts the following props:

### className

A CSS `class` to be _appended_ after the default `components-drop-zone` class.

-   Type: `String`
-   Default: `undefined`

### label

A string to be shown within the drop zone area.

-   Type: `String`
-   Default: `Drop files to upload`

### onFilesDrop

The function is called when dropping a file into the `DropZone`. It receives an array of dropped files as an argument.

-   Type: `Function`
-   Required: No
-   Default: `noop`

### onHTMLDrop

The function is called when dropping a file into the `DropZone`. It receives the HTML being dropped as an argument.

-   Type: `Function`
-   Required: No
-   Default: `noop`

### onDrop

The function is generic drop handler called if the `onFilesDrop` or `onHTMLDrop` are not called. It receives the drop `event` object as an argument.

-   Type: `Function`
-   Required: No
-   Default: `noop`
