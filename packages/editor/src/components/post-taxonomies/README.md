PostTaxonomies
===========

`PostTaxonomies` is a Gutenberg component used to render the Taxonomy Picker
UI. It uses the FlatTermSelector or HierarchicalTermSelector components
based on the value of the `hierarchical` argument specified in
[register_taxonomy](https://codex.wordpress.org/Function_Reference/register_taxonomy).

The output of the respective Taxonomy components can be customized using
the Gutenberg Filter,

* editor.PostTaxonomies

This hook can be used to render alternative UI based on the needs of that
Taxonomy.

## Custom Taxonomy Selector

For example, to render alternative UI for the taxonomy `product-type`,
we can render custom markup or use the Original component as shown below.

```js
const { addFilter } = wp.hooks;

function ProductTypeSelector( OriginalFlatTermSelector ) {
	return ( props ) => {
		if ( props.slug === 'product-type' ) {
			return (
				<div>Product Type Selector</div>
			);
		} else {
			return <OriginalFlatTermSelector { ...props } />
		}
	}
};

addFilter(
	'editor.PostTaxonomyType',
	'my-custom-plugin',
	ProductTypeSelector
);
```
