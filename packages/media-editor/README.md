# Media Editor

Media editor components for WordPress.

## Installation

```bash
npm install @wordpress/media-editor --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

```jsx
import {
	MediaEditorProvider,
	MediaPreview,
	MediaForm,
	type Field,
} from '@wordpress/media-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

function MyMediaEditor( { mediaId } ) {
	const media = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'postType',
				'attachment',
				mediaId
			),
		[ mediaId ]
	);

	const { editEntityRecord } = useDispatch( coreStore );

	const handleChange = ( updates ) => {
		editEntityRecord( 'postType', 'attachment', mediaId, updates );
	};

	// Define fields using the Field type from @wordpress/dataviews
	const fields: Field[] = [
		{ id: 'title', label: 'Title', type: 'text' },
		{ id: 'alt_text', label: 'Alt Text', type: 'text' },
		{ id: 'caption', label: 'Caption', type: 'textarea' },
		{ id: 'description', label: 'Description', type: 'textarea' },
	];

	return (
		<MediaEditorProvider
			value={ media }
			onChange={ handleChange }
			settings={ { fields } }
		>
			<div style={ { display: 'flex', gap: '24px' } }>
				<div style={ { flex: 1 } }>
					<MediaPreview />
				</div>
				<div style={ { width: '360px' } }>
					<MediaForm />
				</div>
			</div>
		</MediaEditorProvider>
	);
}
```

## API

### `<MediaEditorProvider>`

Context provider that supplies media data and actions to child components.

**Props:**

-   `value`: (optional) Media object from the WordPress REST API
-   `onChange`: (optional) Callback when media is updated `(updates: Partial<Media>) => void`. If not provided, the MediaEditor can be used in a read-only mode, which is useful for preview-only scenarios where editing is not needed.
-   `settings`: (optional) Configuration object
    -   `settings.fields`: Array of field definitions (uses `Field` type from `@wordpress/dataviews`)
-   `children`: Child components

### `<MediaPreview>`

Displays a preview of the media file. Automatically detects and renders images, videos, audio, or generic files based on MIME type.

**Props:**

Accepts any props that will be spread onto the preview container element (useful for click handlers, accessibility attributes, etc.)

### `<MediaForm>`

Form for editing media metadata using `DataForm` from `@wordpress/dataviews`.

**Props:**

-   `form`: Optional form configuration (uses `Form` type from `@wordpress/dataviews`)
-   `header`: Optional header content to display above the form

## TypeScript

This package is written in TypeScript and exports all relevant types:

```typescript
import type {
	Media,
	MediaEditorProviderProps,
	MediaPreviewProps,
	MediaFormProps,
	Field,
	Form,
} from '@wordpress/media-editor';
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
