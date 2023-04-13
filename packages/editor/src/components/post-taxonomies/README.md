# PostTaxonomies

`PostTaxonomies` is a component used to render the taxonomy picker
UI. It uses the `FlatTermSelector` or `HierarchicalTermSelector` components
based on the value of the `hierarchical` argument specified in
[register_taxonomy](https://codex.wordpress.org/Function_Reference/register_taxonomy).

The output of the respective taxonomy components can be customized using
the following filter:

-   `editor.PostTaxonomyType`

This hook can be used to render alternative UI based on the needs of that
taxonomy.

## Custom Taxonomy Selector

For example, to render alternative UI for the taxonomy `product-type`,
we can render custom markup or use the original component as shown below.

```js
var el = wp.element.createElement;

function customizeProductTypeSelector( OriginalComponent ) {
	return function ( props ) {
		if ( props.slug === 'product-type' ) {
			return el( 'div', {}, 'Product Type Selector' );
		} else {
			return el( OriginalComponent, props );
		}
	};
}

wp.hooks.addFilter(
	'editor.PostTaxonomyType',
	'my-plugin/set-custom-term-selector',
	customizeProductTypeSelector
);
```

Or, to use the hierarchical term selector with a non-hierarchical taxonomy `track`,
you can set the `HierarchicalTermSelector` component as shown below.

```js
const el = wp.element.createElement;
const HierarchicalTermSelector = wp.editor.PostTaxonomiesHierarchicalTermSelector;

function customizeTrackSelector( OriginalComponent ) {
	return function ( props ) {
		if ( props.slug === 'track' ) {
			return el( HierarchicalTermSelector, props );
		} else {
			return el( OriginalComponent, props );
		}
	};
}

wp.hooks.addFilter(
	'editor.PostTaxonomyType',
	'my-plugin/set-hierarchical-term-selector',
	customizeTrackSelector
);
```
