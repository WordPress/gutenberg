---
sidebar_position: 3
---

# Block Editor Settings

You can customize the block editor by providing a `settings` prop to the `BlockEditorProvider` component. This prop accepts an object with the following properties:

## __experimentalFeatures

The experimental features setting is an object that allows you to enable/disable common block editor features. For instance, the following settings enables support for text, background colors and allow users to pick a custom color or one of the defined theme palette colors. Core block types and third-party block types using the block supports feature will automatically take these settings into account.

```js
import { BlockEditorProvider, BlockCanvas } from '@wordpress/block-editor';

const features = {
	color: {
		custom: true,
		text: true,
		background: true,
		palette: {
			theme: [
				{ name: 'red', color: '#f00', slug: 'red' },
				{ name: 'white', color: '#fff', slug: 'white' },
				{ name: 'blue', color: '#00f', slug: 'blue' },
			],
		},
	},
};

export default function App() {
	return (
		<BlockEditorProvider settings={ { __experimentalFeatures: features } }>
			<BlockCanvas />
		</BlockEditorProvider>
	);
}
```

## styles

The styles setting is an array of editor styles to enqueue in the iframe/canvas of the block editor. Each style is an object with a `css` property. Example:

```jsx
const styles = [
	{
		css: `
			body {
				font-family: Arial;
				font-size: 16px;
			}

			p {
				font-size: inherit;
				line-height: inherit;
			}

			ul {
				list-style-type: disc;
			}

			ol {
				list-style-type: decimal;
			}
		`,
	},
];
```

## mediaUpload

Some core blocks, like the image or video blocks, allow users to render media within the block editor. By default, you can use external URLs but if you want to allow users to upload media from their computer, you need to provide a `mediaUpload` function. Here's a quick example of such function:

```jsx
async function mediaUpload( {
	additionalData = {},
	filesList,
	onError = noop,
	onFileChange,
} ) {
	const uploadedMedia = [];
	for ( const file of filesList ) {
		try {
			const data = await someApiCallToUploadTheFile( file );
			const mediaObject = {
				alt: data.alt,
				caption: data.caption,
				title: data.title,
				url: data.url,
			};
			uploadedMedia.push( mediaObject );
		} catch ( error ) {
			onError( {
				code: 'SOME_ERROR_CODE',
				message:
					mediaFile.name +
					' : Sorry, an error happened while uploading this file.',
				file: mediaFile,
			} );
		}
		if ( uploadedMedia.length ) {
			onFileChange( uploadedMedia );
		}
	}
}
```

Providing a `mediaUpload` function also enables drag and dropping files into the editor to upload them.

## inserterMediaCategories

The inserter media categories setting is an array of media categories to display in the inserter. Each category is an object with `name` and `labels` values, a `fetch` function and a few extra keys. Example:

```jsx
const inserterMediaCategories = {
    name: 'openverse',
    labels: {
        name: 'Openverse',
        search_items: 'Search Openverse',
    },
    mediaType: 'image',
    async fetch( query = {} ) {
        const defaultArgs = {
            mature: false,
            excluded_source: 'flickr,inaturalist,wikimedia',
            license: 'pdm,cc0',
        };
        const finalQuery = { ...query, ...defaultArgs };
        // Sometimes you might need to map the supported request params according to the `InserterMediaRequest`
        // interface. In this example the `search` query param is named `q`.
        const mapFromInserterMediaRequest = {
            per_page: 'page_size',
            search: 'q',
        };
        const url = new URL( 'https://api.openverse.engineering/v1/images/' );
        Object.entries( finalQuery ).forEach( ( [ key, value ] ) => {
            const queryKey = mapFromInserterMediaRequest[ key ] || key;
            url.searchParams.set( queryKey, value );
        } );
        const response = await window.fetch( url, {
            headers: {
                'User-Agent': 'WordPress/inserter-media-fetch',
            },
        } );
        const jsonResponse = await response.json();
        const results = jsonResponse.results;
        return results.map( ( result ) => ( {
            ...result,
            // If your response result includes an `id` prop that you want to access later, it should
            // be mapped to `InserterMediaItem`'s `sourceId` prop. This can be useful if you provide
            // a report URL getter.
            // Additionally you should always clear the `id` value of your response results because
            // it is used to identify WordPress media items.
            sourceId: result.id,
            id: undefined,
            caption: result.caption,
            previewUrl: result.thumbnail,
        } ) );
    },
    getReportUrl: ( { sourceId } ) =>
        `https://wordpress.org/openverse/image/${ sourceId }/report/`,
    isExternalResource: true,
}
```

## hasFixedToolbar

Whether the `BlockTools` component renders the toolbar in a fixed position or if follows the position of the selected block. Defaults to `false`.

## focusMode

The focus mode is a special mode where any block that is not selected is shown with a reduced opacity, giving more prominence to the selected block. Defaults to `false`.

## keepCaretInsideBlock

By default, arrow keys can be used to navigate across blocks. You can turn off that behavior and keep the caret inside the currently selected block using this setting. Defaults to `false`.

## codeEditingEnabled

Allows the user to edit the currently selected block using an HTML code editor. Note that using the code editor is not supported by all blocks and that it has the potential to create invalid blocks depending on the markup the user provides. Defaults to `true`.

## canLockBlocks

Whether the user can lock blocks. Defaults to `true`.
