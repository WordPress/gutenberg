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
		onNumberOfItemsChange={ ( numberOfItems ) => setState( { numberOfItems } ) }
	/>
) );
```
