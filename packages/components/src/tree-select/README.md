# TreeSelect

TreeSelect component is used to generate select input fields.

## Usage

Render a user interface to select the parent page in a hierarchy of pages:

```jsx
import { useState } from 'react';
import { TreeSelect } from '@wordpress/components';

const MyTreeSelect = () => {
	const [ page, setPage ] = useState( 'p21' );

	return (
		<TreeSelect
		  __nextHasNoMarginBottom
			label="Parent page"
			noOptionLabel="No parent page"
			onChange={ ( newPage ) => setPage( newPage ) }
			selectedId={ page }
			tree={ [
				{
					name: 'Page 1',
					id: 'p1',
					children: [
						{ name: 'Descend 1 of page 1', id: 'p11' },
						{ name: 'Descend 2 of page 1', id: 'p12' },
					],
				},
				{
					name: 'Page 2',
					id: 'p2',
					children: [
						{
							name: 'Descend 1 of page 2',
							id: 'p21',
							children: [
								{
									name: 'Descend 1 of Descend 1 of page 2',
									id: 'p211',
								},
							],
						},
					],
				},
			] }
		/>
	);
}
```

## Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the SelectControl component being used.

### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

### noOptionLabel

If this property is added, an option will be added with this label to represent empty selection.

-   Type: `String`
-   Required: No

### onChange

A function that receives the id of the new node element that is being selected.

-   Type: `function`
-   Required: Yes

### selectedId

The id of the currently selected node.

-   Type: `string` | `string[]`
-   Required: No

### tree

An array containing the tree objects with the possible nodes the user can select.

-   Type: `Object[]`
-   Required: No

#### __nextHasNoMarginBottom

Start opting into the new margin-free styles that will become the default in a future version.

-   Type: `Boolean`
-   Required: No
-   Default: `false`
