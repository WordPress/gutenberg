# QueryControls

## Usage

```jsx
import { QueryControls } from '@wordpress/components';
import { useState } from '@wordpress/element';

const QUERY_DEFAULTS = {
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
};

const MyQueryControls = () => {
	const [ query, setQuery ] = useState( QUERY_DEFAULTS );
	const { orderBy, order, category, categories, numberOfItems } = query;

	const updateQuery = ( newQuery ) => {
		setQuery( { ...query, ...newQuery } );
	};

	return (
		<QueryControls
			{ ...{ orderBy, order, numberOfItems } }
			onOrderByChange={ ( newOrderBy ) => updateQuery( { orderBy: newOrderBy } ) }
			onOrderChange={ ( newOrder ) => updateQuery( { order: newOrder } ) }
			categoriesList={ categories }
			selectedCategoryId={ category }
			onCategoryChange={ ( newCategory ) => updateQuery( { category: newCategory } ) }
			onNumberOfItemsChange={ ( newNumberOfItems ) =>
				updateQuery( { numberOfItems: newCategory } )
			}
		/>
	);
};
```

## Multiple category selector

The `QueryControls` component now supports multiple category selection, to replace the single category selection available so far. To enable it use the component with the new props instead: `categorySuggestions` in place of `categoriesList` and the `selectedCategories` array instead of `selectedCategoryId` like so:

```jsx
const QUERY_DEFAULTS = {
	orderBy: 'title',
	order: 'asc',
	selectedCategories: [ 1 ],
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
};

const MyQueryControls = () => {
	const [ query, setQuery ] = useState( QUERY_DEFAULTS );
	const { orderBy, order, selectedCategories, categories, numberOfItems } = query;

	const updateQuery = ( newQuery ) => {
		setQuery( { ...query, ...newQuery } );
	};

	return (
		<QueryControls
			{ ...{ orderBy, order, numberOfItems } }
			onOrderByChange={ ( newOrderBy ) => updateQuery( { orderBy: newOrderBy } ) }
			onOrderChange={ ( newOrder ) => updateQuery( { order: newOrder } ) }
			categorySuggestions={ categories }
			selectedCategories={ selectedCategories }
			onCategoryChange={ ( category ) => updateQuery( { selectedCategories: category } ) }
			onNumberOfItemsChange={ ( newNumberOfItems ) =>
				updateQuery( { numberOfItems: newCategory } )
			}
		/>
	);
};
```

The format of the categories list also needs to be updated to match what `FormTokenField` expects for making suggestions.
