# Adding a delete button

This part is about adding a *Delete* feature to our app. Here's a glimpse of what we're going to build:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/edit-form/form-finished.png)

### Step 1: Add a _Delete_ button

Let's start by adding the user interface element to our `PagesList` component:

```js
import { Button } from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';

const DeletePageButton = () => (
	<Button variant="primary">
		Delete
	</Button>
)

function PagesList( { hasResolved, pages } ) {
	if ( ! hasResolved ) {
		return <Spinner />;
	}
	if ( ! pages?.length ) {
		return <div>No results</div>;
	}

	return (
		<table className="wp-list-table widefat fixed striped table-view-list">
			<thead>
				<tr>
					<td>Title</td>
					<td style={{width: 120}}>Actions</td>
				</tr>
			</thead>
			<tbody>
				{ pages?.map( ( page ) => (
					<tr key={page.id}>
						<td>{ decodeEntities( page.title.rendered ) }</td>
						<td>
							<EditPageButton pageId={ page.id } />
							<DeletePageButton pageId={ page.id } />
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
```

The only change in `PagesList` is the additional component called _PageDeleteButton_:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/edit-form/edit-button.png)

### Step 2: Wire the button to a delete action

In Gutenberg data, we delete entity records from the WordPress REST API using the `deleteEntityRecord` action. It sends the request, processes the result, and updates the cached data in the Redux state.

Here's how you can try it in your browser's dev tools:

```js
// We need a valid page ID to call deleteEntityRecord, so let's get the first available one using getEntityRecords.
const pageId = wp.data.select( 'core' ).getEntityRecords( 'postType', 'page' )[0].id;

// Now let's delete that page:
const promise = wp.data.dispatch( 'core' ).deleteEntityRecord( 'postType', 'page', pageId );

// promise gets resolved or rejected when the API request succeeds or fails.
```

Once the REST API request is finished, you will notice one of the pages disappeared from the list. This is because that list is populated by using `useSelect()` and the `select( coreDataStore ).getEntityRecords( 'postType', 'page' )` selector. Anytime the underlying data changes, the list gets re-rendered with fresh data. That's pretty convenient!

Let's dispatch that action when `DeletePageButton` is clicked:

```js
const DeletePageButton = ({ pageId }) => {
	const { saveEditedEntityRecord } = useDispatch( coreDataStore );
	const handleDelete = () => deleteEntityRecord( 'postType', 'page', pageId );
	return (
		<Button variant="primary" onClick={ handleDelete }>
			Delete
		</Button>
	);
}
```

### Step 3: Add visual feedback

It may take a few moments for the REST API request to finish after the _Delete_ button is clicked. Let's communicate that with a `<Spinner />` component in a similar fashion as we did in the previous parts of this tutorial.

We'll need the `isDeletingEntityRecord` selector for that. It is similar to the `isSavingEntityRecord` selector we've already seen in the part 3: it returns `true` or `false` and never issues any HTTP requests:

```js
const DeletePageButton = ({ pageId }) => {
	// ...
	const { isDeleting } = useSelect(
		select => ({
			isDeleting: select( coreDataStore ).isDeletingEntityRecord( 'postType', 'page', pageId ),
		}),
		[ pageId ]
	)
	return (
		<Button variant="primary" onClick={ handleDelete } disabled={ isDeleting }>
			{ isDeleting ? (
				<>
					<Spinner/>
					Deleting...
				</>
			) : 'Delete' }
		</Button>
	);
}
```

Here's how it looks like in action:
...

### Step 4: Handle errors

We optimistically assumed that a *delete* operation would always succeed. Unfortunately, under the hood it is a REST API request that can fail in many ways:

* The website can be down
* The update may be invalid
* The page could have been deleted by someone else in the meantime

To tell the user when any of these happens, we need to extract the error information using the `getLastEntityDeleteError` selector:

```js
// Replace 9 with an actual page ID
wp.data.select( 'core' ).getLastEntityDeleteError( 'postType', 'page', 9 )
```

Here's how we can apply it in `DeletePageButton`:

```js
const DeletePageButton = ({ pageId }) => {
	// ...
	const { error, /* ... */ } = useSelect(
		select => ( {
			error: select( coreDataStore ).getLastEntityDeleteError( 'postType', 'page', pageId ),
			// ...
		} ),
		[pageId]
	);
	useEffect( () => {
		if ( error ) {
			alert( error );
		}
	}, [error] )

	// ...
}
```

Great! `DeletePageButton` is now fully aware of errors.

Let's see that error message in action. We'll trigger an invalid delete and let it fail. One way to do it is to set the `id` to `-1`::

```js
export function DeletePageButton( { pageId, onCancel, onSaveFinished } ) {
	// ...
	const handleDelete = () => deleteEntityRecord( 'postType', 'page', -1 );
	// ...
}
```

Once you refresh the page and click any `Delete` button, you should see the following error message:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/edit-form/form-error.png)

Fantastic! We can now **restore the previous version of `handleDelete`** and move on to the next step.

### Wiring it all together

All the pieces are in place, great! Here’s everything we built in this chapter in one place:

```js
import { useDispatch } from '@wordpress/data';
import { Button, Modal, TextControl } from '@wordpress/components';

function DeletePageButton( { pageId } ) {
	const { saveEditedEntityRecord } = useDispatch( coreDataStore );
	const handleDelete = () => deleteEntityRecord( 'postType', 'page', pageId );

	const { isDeleting } = useSelect(
		select => ( {
			error: select( coreDataStore ).getLastEntityDeleteError( 'postType', 'page', pageId ),
			isDeleting: select( coreDataStore ).isDeletingEntityRecord( 'postType', 'page', pageId ),
		} ),
		[ pageId ]
	);
	useEffect( () => {
		if ( error ) {
			alert( error );
		}
	}, [ error ] )

	return (
		<Button variant="primary" onClick={ handleDelete } disabled={ isDeleting }>
			{ isDeleting ? (
				<>
					<Spinner/>
					Deleting...
				</>
			) : 'Delete' }
		</Button>
	);
}
```

## What's next?

* **Previous part:** [Building a *Create page form*](/docs/how-to-guides/data-basics/4-building-a-create-page-form.md)
* (optional) Review the [finished app](https://github.com/WordPress/gutenberg-examples/tree/trunk/09-code-data-basics-esnext) in the gutenberg-examples repository
