# Field Collections

Client store and React hook for **entity field collections** — sets of fields
(serializable definitions plus non-serializable extensions) registered
server-side for a given entity (`postType`, `taxonomy`, `user`, …) and exposed
through `GET /wp/v2/field-collections`.

The serializable field definitions are registered in PHP via
`gutenberg_register_field_collection()`. For post types, the default registrar
(`gutenberg_register_default_post_type_field_collections()`) generates a
collection from each REST-enabled post type's `supports`, so most post types get
one automatically without a bespoke `fields.php`. The non-serializable
extensions (`getValue`, `render`, `Edit`, elements carrying icons…) ship as
lazily-imported script modules (`@wordpress/field-collections/postType-*`). This
package fetches the definitions, lazily loads each extension module the
collection lists in `fields_modules`, and merges them by field `id`.

### Tailoring a collection

Two PHP filters let you adjust any collection — including an auto-generated one
— without re-registering it:

-   `gutenberg_field_collection_fields` — `( array $fields, string $id, string $kind, ?string $name )`
    to remove, reorder, relabel, or add serializable field definitions.
-   `gutenberg_field_collection_modules` — `( string[] $modules, string $id, string $kind, ?string $name )`
    to append a script module of non-serializable extensions. Modules merge in
    order, so a later module overrides an earlier one property by property
    (last wins). Use this to attach behavior to a field you added, or to
    override a default field's behavior.

```php
add_filter( 'gutenberg_field_collection_fields', function ( $fields, $id, $kind, $name ) {
	if ( 'postType' === $kind && 'product' === $name ) {
		$fields[] = array( 'id' => 'sku', 'type' => 'text', 'label' => __( 'SKU' ) );
	}
	return $fields;
}, 10, 4 );

add_filter( 'gutenberg_field_collection_modules', function ( $modules, $id, $kind, $name ) {
	if ( 'postType' === $kind && 'product' === $name ) {
		$modules[] = '@my-plugin/product-field-extensions';
	}
	return $modules;
}, 10, 4 );
```

A field removed via the fields filter is fully gone client-side; any extension
still shipped for its id is simply ignored, since the merge is driven by the
serializable field list.

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
