# QueryControls

## Usage

```jsx
import { QueryControls } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyQueryControls = withState( {
	orderBy: 'title',
	order: 'asc',
	category: 1,
	categories: [
		{
			id: 1,
			name: 'Category 1',
			parent: 0,
		},
		{
			id: 2,
			name: 'Category 1b',
			parent: 1,
		},
		{
			id: 3,
			name: 'Category 2',
			parent: 0,
		},
	],
	numberOfItems: 10,
} )( ( { orderBy, order, category, categories, numberOfItems, setState } ) => (
	<QueryControls
		{ ...{ orderBy, order, numberOfItems } }
		onOrderByChange={ ( orderBy ) => setState( { orderBy } ) }
		onOrderChange={ ( order ) => setState( { order } ) }
		categoriesList={ categories }
		selectedCategoryId={ category }
		onCategoryChange={ ( category ) => setState( { category } ) }
		onNumberOfItemsChange={ ( numberOfItems ) =>
			setState( { numberOfItems } )
		}
	/>
) );
```

## Multiple category selector

The `QueryControls` component now supports multiple category selection, to replace the single category selection available so far. To enable it use the component with the new props instead: `categorySuggestions` in place of `categoriesList` and the `selectedCategories` array instead of `selectedCategoryId` like so:

```jsx
const MyQueryControls = withState( {
	orderBy: 'title',
	order: 'asc',
	selectedCategories: [ 1 ],
	categories: {
		'Category 1': {
			id: 1,
			name: 'Category 1',
			parent: 0,
		},
		'Category 1b': {
			id: 2,
			name: 'Category 1b',
			parent: 1,
		},
		'Category 2': {
			id: 3,
			name: 'Category 2',
			parent: 0,
		},
	},
	numberOfItems: 10,
} )( ( { orderBy, order, category, categories, numberOfItems, setState } ) => (
	<QueryControls
		{ ...{ orderBy, order, numberOfItems } }
		onOrderByChange={ ( orderBy ) => setState( { orderBy } ) }
		onOrderChange={ ( order ) => setState( { order } ) }
		categorySuggestions={ categories }
		selectedCategories={ selectedCategories }
		onCategoryChange={ ( category ) => setState( { category } ) }
		onNumberOfItemsChange={ ( numberOfItems ) =>
			setState( { numberOfItems } )
		}
	/>
) );
```

The format of the categories list also needs to be updated to match what `FormTokenField` expects for making suggestions.
