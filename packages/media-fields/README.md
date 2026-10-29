# Media Fields

This package provides reusable field definitions for displaying and editing media attachment properties in WordPress DataViews. It's primarily intended for internal use within Gutenberg and may change significantly between releases.

## Usage

### Available Fields

This package exports field definitions for common media attachment properties:

- `altTextField` - Alternative text for images
- `captionField` - Media caption text
- `descriptionField` - Detailed description
- `filenameField` - File name (read-only)
- `filesizeField` - File size with human-readable formatting
- `mediaDimensionsField` - Image dimensions (width × height)
- `mediaThumbnailField` - Thumbnail preview
- `mimeTypeField` - MIME type display

### Using Media Fields in DataViews

```jsx
import {
	altTextField,
	captionField,
	filesizeField,
} from '@wordpress/media-fields';
import { DataViews } from '@wordpress/dataviews';

const fields = [
	altTextField,
	captionField,
	filesizeField,
];

export function MyMediaLibrary( { items } ) {
	return (
		<DataViews
			data={ items }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
		/>
	);
}
```

## Contributing to this package

This package is part of the Gutenberg project. To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
