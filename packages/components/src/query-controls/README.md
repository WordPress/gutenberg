# QueryControls

## Development Guidelines

### Usage

```jsx
import { QueryControls } from '@wordpress/components';
import { useState } from '@wordpress/element';

const QUERY_DEFAULTS = {
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
	maxItems: 20,
	minItems: 1,	
	numberOfItems: 10,
	order: 'asc',
	orderBy: 'title',	
};

const MyQueryControls = () => {
	const [ query, setQuery ] = useState( QUERY_DEFAULTS );
	const { category, categories, maxItems, minItems, numberOfItems, order, orderBy  } = query;

	const updateQuery = ( newQuery ) => {
		setQuery( { ...query, ...newQuery } );
	};

	return (
		<QueryControls
			{ ...{ maxItems, minItems, numberOfItems, order, orderBy } }
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

### Multiple category selector

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

### Props

#### authorList

An array of author IDs that is passed into an `AuthorSelect` sub-component.

-   Type: `Array`
-   Required: No
-   Platform: Web

#### selectedAuthorId

The selected author ID.

-   Type: `Number`
-   Required: No
-   Platform: Web

#### categoriesList

An array of category IDs; renders a `CategorySelect` sub-component when passed in conjunction with `onCategoryChange`.

-   Type: `Array`
-   Required: No
-   Platform: Web

#### categorySuggestions

An array of category names; renders a `FormTokenField` component when passed in conjunction with `onCategoryChange`.

-   Type: `Array`
-   Required: No
-   Platform: Web

#### maxItems

-   Type: `Number`
-   Required: No
-   Default: 100
-   Platform: Web

#### minItems

-   Type: `Number`
-   Required: No
-   Default: 1
-   Platform: Web

#### numberOfItems

The selected number of items to retrieve via the query.

-   Type: `Number`
-   Required: No
-   Platform: Web

#### onAuthorChange

A function that receives the new author value. If this is not specified, the author controls are not included.

-   Type: `Function`
-   Required: No
-   Platform: Web

#### onCategoryChange

A function that receives the new author value. If this is not specified, the category controls are not included.

-   Type: `Function`
-   Required: No
-   Platform: Web

#### onNumberOfItemsChange

A function that receives the new number of items value. If this is not specified, then the number of items range control is not included.

-   Type: `Function`
-   Required: No
-   Platform: Web

#### onOrderChange

A function that receives the new order value. If this or onOrderByChange are not specified, then the order controls are not included.

-   Type: `Function`
-   Required: No
-   Platform: Web

#### onOrderByChange

A function that receives the new orderby value. If this or onOrderChange are not specified, then the order controls are not included.

-   Type: `Function`
-   Required: No
-   Platform: Web

#### order

The order in which to retrieve posts. Can be 'asc' or 'desc'.

-   Type: `String`
-   Required: No
-   Platform: Web

#### orderBy

The meta key by which to order posts. Can be 'date' or 'title'.

-   Type: `String`
-   Required: No
-   Platform: Web

#### selectedCategories

The selected categories for the `categorySuggestions`.

-   Type: `Array`
-   Required: No
-   Platform: Web

#### selectedCategoryId

The selected category for the `categoriesList`.

-   Type: `Number`
-   Required: No
-   Platform: Web
