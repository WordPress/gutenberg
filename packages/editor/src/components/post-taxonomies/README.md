PostTaxonomies
===========

`PostTaxonomies` is a Gutenberg component used to render the Taxonomy Picker
UI. It uses the FlatTermSelector or HierarchicalTermSelector components
based on the value of the `hierarchical` argument specified in
[register_taxonomy](https://codex.wordpress.org/Function_Reference/register_taxonomy).

The output of the respective Taxonomy components can be customized using
the Gutenberg Filters,

* editor.FlatTermSelector
* editor.HierarchicalTermSelector

These hooks can be used to render alternative UI based on the needs of that
Taxonomy.

## Custom Flat Term Selector

To modify the contents of the FlatTermSelector component use the hook `editor.FlatTermSelector`,

For example, to render alternative UI for the taxonomy `product-type`,
we can render custom markup or use the Original component as shown below.

```js
const { addFilter } = wp.hooks;

function CustomFlatTermSelector( OriginalFlatTermSelector ) {
	return ( props ) => {
		if ( props.slug === 'product-type' ) {
			return (
				<div>Custom Flat Term Selector</div>
			);
		} else {
			return <OriginalFlatTermSelector { ...props } />
		}
	}
};

addFilter(
	'editor.FlatTermSelector',
	'my-custom-plugin',
	CustomFlatTermSelector
);
```

## Custom Hierarchical Term Selector

Similarly, to modify the contents of the HierarchicalTermSelector component use the hook `editor.HierarchicalTermSelector`,

For example, to render alternative UI for the taxonomy `product-category`,
we can render custom markup or use the Original component as shown below.

```js
const { addFilter } = wp.hooks;

function CustomHierarchicalTermSelector( OriginalHierarchicalTermSelector ) {
	return ( props ) => {
		if ( props.slug === 'product-category' ) {
			return (
				<div>Custom HierarchicalTermSelector Term Selector</div>
			);
		} else {
			return <OriginalHierarchicalTermSelector { ...props } />
		}
	}
};

addFilter(
	'editor.HierarchicalTermSelector',
	'my-custom-plugin',
	CustomHierarchicalTermSelector
);
```
