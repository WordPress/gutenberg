# Media Utils

The media utils package provides a set of artifacts to abstract media functionality that may be useful in situations where there is a need to deal with media uploads or with the media library, e.g., artifacts that extend or implement a block-editor.
This package is meant to be used by the WordPress core. It may not work as expected outside WordPress usages.

## Installation

Install the module

```bash
npm install @wordpress/media-utils --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as IE browsers then using [core-js](https://github.com/zloirock/core-js) will add polyfills for these methods._

## Usage

### uploadMedia

Media upload util is a function that allows the invokers to upload files to the WordPress media library.
As an example, provided that `myFiles` is an array of file objects, `onFileChange` on onFileChange is a function that receives an array of objects containing the description of WordPress media items and `handleFileError` is a function that receives an object describing a possible error, the following code uploads a file to the WordPress media library:

```js
wp.mediaUtils.utils.uploadMedia( {
	filesList: myFiles,
	onFileChange: handleFileChange,
	onError: handleFileError,
} );
```

The following code uploads a file named foo.txt with foo as content to the media library and alerts its URL:

```js
wp.mediaUtils.utils.uploadMedia( {
	filesList: [ new File( [ 'foo' ], 'foo.txt', { type: 'text/plain' } ) ],
	onFileChange: ( [ fileObj ] ) => alert( fileObj.url ),
	onError: console.error,
} );
```

Beware that first onFileChange is called with temporary blob URLs and then with the final URL's this allows to show the result in an optimistic UI as if the upload was already completed. E.g.: when uploading an image, one can show the image right away in the UI even before the upload is complete.

### MediaUpload

Media upload component provides a UI button that allows users to open the WordPress media library. It is normally used in conjunction with the filter `editor.MediaUpload`.
The component follows the interface specified in https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/media-upload/README.md, and more details regarding its usage can be checked there.
