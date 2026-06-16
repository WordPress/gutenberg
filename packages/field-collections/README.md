# Field Collections

Client store and React hook for **entity field collections** — sets of fields
(serializable definitions plus non-serializable extensions) registered
server-side for a given entity (`postType`, `taxonomy`, `user`, …) and exposed
through `GET /wp/v2/field-collections`.

The serializable field definitions are registered in PHP via
`gutenberg_register_field_collection()` (one collocated `fields.php` per
collection). The non-serializable extensions (`getValue`, `render`, `Edit`,
elements carrying icons…) ship as lazily-imported script modules
(`@wordpress/field-collections/postType-*`). This package fetches the
definitions, lazily loads the matching extension module, and merges them by
field `id`.

Unlike `@wordpress/editor`, this package has **no editor dependency**: its store
and `useFieldCollections` hook depend only on
`@wordpress/{data,api-fetch,element,compose,url,private-apis}` and
`@wordpress/dataviews` types. The heavy field implementations
(`@wordpress/fields`, `@wordpress/media-fields`) are pulled in only by the
lazily-imported extension chunks.

## Installation

Install the module:

```bash
npm install @wordpress/field-collections --save
```

## Usage

```js
import { useFieldCollections } from '@wordpress/field-collections';

function MyComponent( { postType } ) {
	const fields = useFieldCollections( 'postType', postType );
	// `fields` is the merged Field[] for the entity.
}
```

To eliminate a loading flash, preload from a route loader:

```js
import { preloadFieldCollections } from '@wordpress/field-collections';

await preloadFieldCollections( 'postType', 'attachment' );
```

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
