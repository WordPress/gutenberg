# Building an edit form

In this part, we will add an edit feature to the pages list we built in the last step:

![](/docs/how-to-guides/data-basics/media/edit-form/form-finished.png)

Let’s see how we can get there step by step.

### Adding an edit button

Firstly, we need to add an *Edit* button to the `PagesList` component. The minimal required change looks like this:

```js
import { Button } from '@wordpress/components';

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
					<td>{ page.title.rendered }</td>
					<td>
						<PageEditButton pageId={ page.id } />
					</td>
				</tr>
			) ) }
			</tbody>
		</table>
	);
}

const PageEditButton = () => (
	<Button variant="primary">
		Edit
	</Button>
)
```

Once you refresh the page, you should see the following:

![](/docs/how-to-guides/data-basics/media/edit-form/edit-button.png)

The button is in place, but it doesn't do anything yet. We want it to display the page edit form. A convenient way to make it happen is by using the [`Modal` component from the `@wordpress/components` package](https://developer.wordpress.org/block-editor/reference-guides/components/modal/). Let's update the  `PageEditButton` accordingly:

```js
import { Button, Modal, TextControl } from '@wordpress/components';

function PageEditButton({ pageId }) {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );
	return (
		<>
			<Button
				onClick={ openModal }
				variant="primary"
			>
				Edit
			</Button>
			{ isOpen && (
				<Modal onRequestClose={ closeModal } title="Edit page">
					<EditPageForm
						pageId={pageId}
						onCancel={closeModal}
						onSaveFinished={closeModal}
					/>
				</Modal>
			) }
		</>
	)
}

export function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	return (
		<div className="my-gutenberg-form">
			<TextControl
				value=''
				label='Page title:'
			/>
			<div className="form-buttons">
				<Button onClick={ onSaveFinished } variant="primary">
					Save
				</Button>
				<Button onClick={ onCancel } variant="tertiary">
					Cancel
				</Button>
			</div>
		</div>
	);
}
```

When you click the *Edit* button now, you should see the following modal:

![](/docs/how-to-guides/data-basics/media/edit-form/form-scaffold.png)

Great! We now have a basic user interface to work with. Our `EditPageForm` doesn't do anything yet, though. Let's change that!

### Populating the title field

We need to populate the input field with the actual page title. But how can we do that when the `EditPageForm` only has access to the `pageId` and not the actual `page`? Enter the [`getEntityRecord`](/docs/reference-guides/data/data-core/#getentityrecord) selector.

[`getEntityRecord`](/docs/reference-guides/data/data-core/#getentityrecord) retrieves the appropriate from WordPress REST API, or reuses the one already retrieved if available. Here’s how to try it in your browser's dev tools:

```js
wp.data.select( 'core' ).getEntityRecord( 'postType', 'page', 9 );  // Replace 9 with an actual page ID
```

The records we're interested in are already cached by the `getEntityRecords` call inside the `MyFirstApp` component, so `getEntityRecord` won't trigger any extra HTTP requests.

Let's put it to use in `EditPageForm`:

```js
export function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	const page = useSelect(
		select => select( coreDataStore ).getEntityRecord( 'postType', 'page', pageId ),
		[pageId]
	);
	return (
		<div className="my-gutenberg-form">
			<TextControl
				label='Page title:'
				value={ page.title }
			/>
			{ /* ... */ }
		</div>
	);
}
```

![](/docs/how-to-guides/data-basics/media/edit-form/form-populated.png)

Splendid, it looks like a real form already! Unfortunately, the input field isn't editable yet – let's fix that.

### Making the title field editable

The `TextControl` we use has a `value`, but that `value` never changes. We're missing an `onChange` handler that would update it. You may have seen a pattern similar to this one in other React apps:

```js
export function VanillaReactForm({ initialTitle }) {
	const [title, setTitle] = useState( initialTitle );
	return (
		<TextControl
			value={ title }
			onChange={ setTitle }
		/>
	);
}
```

Working with entity records in Gutenberg data is similar. The counterpart of `setTitle` is a `editEntityRecord` action. It takes the entity kind, name, id, and changes, and stores them in a state for later. Here's how you can try out in your browser's dev tools:

```js
// Replace 9 with an actual page ID
wp.data.dispatch( 'core' ).editEntityRecord( 'postType', 'page', 9, { title: 'updated title' } );
```

How do we know if it worked? We could use `getEntityRecord` to check the current title:

```js
// Replace 9 with an actual page ID
wp.data.select( 'core' ).getEntityRecord( 'postType', 'page', 9 ).title
```

But, surprisingly, it shows the original title without any changes. What is going on?

Gutenberg Data distinguishes between *Entity Records* and *Edited Entity Records*. Calling `getEntityRecord` always returns the data retrieved from the API. This allows us to edit the pages without affecting the titles displayed inside of `PagesList`.

To work with the API data with user edits applied, we need to use `getEditedEntityRecord`:

```js
// Replace 9 with an actual page ID
wp.data.select( 'core' ).getEditedEntityRecord( 'postType', 'page', 9 ).title
// 'updated title'
```

This is how it all comes together in `EditPageForm`:

```js
import { useDispatch } from '@wordpress/data';

export function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	const page = useSelect(
		select => select(coreDataStore).getEditedEntityRecord('postType', 'page', pageId),
		[ pageId ]
	);
	const { editEntityRecord } = useDispatch( coreDataStore );
	const handleChange = ( title ) => editEntityRecord( 'postType', 'page', pageId, { title } );

	return (
		<div className="my-gutenberg-form">
			<TextControl
				label="Page title:"
				value={ page.title }
				onChange={ handleChange }
			/>
			<div className="form-buttons">
				<Button onClick={ onSaveFinished } variant="primary">
					Save
				</Button>
				<Button onClick={ onCancel } variant="tertiary">
					Cancel
				</Button>
			</div>
		</div>
	);
}
```

And here's how it looks like:

![](/docs/how-to-guides/data-basics/media/edit-form/form-editable.png)

#### `useState` vs `editEntityRecord`

There are three major upsides of using `editEntityRecord` instead of React's `useState`.

First, we can lean on Gutenberg data to save the edits with the same ease as it retrieves the data.

Second, we get access to undo and redo features.

Third, other components have access to the changes. For example, we could make the `PagesList` display the currently edited title by leveraging `getEditedEntityRecord`.

### Saving the updated title

The form can now be interacted with, but it still cannot be saved. In Gutenberg data, we save changes using the `saveEditedEntityRecord` action. It sends the updates to the WordPress REST API, processes the result, and updates the cached data in the Redux state. The return is a promise resolved once the save operation is finished.

Here's an example you may try in your browser's devtools:

```js
// Replace 9 with an actual page ID
wp.data.dispatch( 'core' ).editEntityRecord( 'postType', 'page', 9, { title: 'updated title' } );
wp.data.dispatch( 'core' ).saveEditedEntityRecord( 'postType', 'page', 9 );
```

The above snippet saved a new title. Unlike before, the updated title is now returned by `getEntityRecord`:

```js
// Replace 9 with an actual page ID
wp.data.select( 'core' ).getEntityRecord( 'postType', 'page', 9 ).title
// "updated title"
```

This is how the `EditPageForm` looks like with a working *Save* button:

```js
export function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	// ...
	const { saveEditedEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		await saveEditedEntityRecord( 'postType', 'page', pageId );
		onSaveFinished();
	};

	return (
		<div className="my-gutenberg-form">
			{/* ... */}
			<div className="form-buttons">
				<Button onClick={ handleSave } variant="primary">
					Save
				</Button>
				{/* ... */}
			</div>
		</div>
	);
}
```

### Handle errors

We optimistically assumed that a *save* operation will always succeed. Unfortunately, it may fail in many ways: the website can be down, the update may be invalid, or the page could have been deleted by someone else in the meantime. Let's tell the user about anything that goes wrong.

We have to make two adjustments. Firstly, we don't want to close the form modal when the update fails. The promise returned by `saveEditedEntityRecord` is resolved with an updated record only if the update actually worked. When something goes wrong, it resolves with an empty value. Let's use it to keep the modal open:

```js
export function EditPageForm( { pageId, onSaveFinished } ) {
	// ...
	const handleSave = async () => {
		const updatedRecord = await saveEditedEntityRecord('postType', 'page', pageId);
		if ( updatedRecord ) {
			onSaveFinished();
		}
	};
	// ...
}
```

Great! Now, let's display an error message. The failure details can be grabbed using the `getLastEntitySaveError` selector:

```js
// Replace 9 with an actual page ID
wp.data.select( 'core' ).getLastEntitySaveError( 'postType', 'page', 9 )
```

Here's how we can use it in `EditPageForm`:

```js
export function EditPageForm( { pageId, onSaveFinished } ) {
	// ...
    const { lastError, page } = useSelect(
        select => ({
			page: select(coreDataStore).getEditedEntityRecord('postType', 'page', pageId),
			lastError: select(coreDataStore).getLastEntitySaveError('postType', 'page', pageId)
		}),
        [ pageId ]
	)
	// ...
	return (
		<>
			{/* ... */}
			{ lastError ? (
				<div className="form-error">
					Error: { lastError.message }
				</div>
			) : false }
			{/* ... */}
		</>
	);
}
```

Great! `EditPageForm` is now fully aware of errors.

Let's see that error message in action. We'll trigger an invalid update and let it fail. Post title is hard to break, so let's set a `date` property to `-1` instead – that's a guaranteed validation error:

```js
export function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	// ...
	const handleChange = ( title ) => editEntityRecord( 'postType', 'page', pageId, { title, date: -1 } );
	// ...
}
```

Once you refresh the page, open the form, change the title, and hit save you should see the following error message:

![](./media/edit-form/form-error.png)

Fantastic! We can now restore the previous version of `handleChange` and move on to the next step.

### Status indicator

There are two more problems with our form: We can click *Save* even when there are no changes, and when we do we can’t be quite sure whether it’s doing anything.

We can clear it up by communicating _Saving_ and _No changes detected_ to the user. Two selectors are going to be useful here: `isSavingEntityRecord` and `hasEditsForEntityRecord`. Unlike `getEntityRecord`, they do not issue any HTTP requests. Instead, they only return the information about the current entity record state.

Let's use them in `EditPageForm`:

```js
export function EditPageForm( { pageId, onSaveFinished } ) {
	// ...
	const { isSaving, hasEdits, /* ... */ } = useSelect(
		select => ({
			isSaving: select(coreDataStore).isSavingEntityRecord('postType', 'page', pageId),
			hasEdits: select(coreDataStore).hasEditsForEntityRecord('postType', 'page', pageId),
			// ...
		}),
		[ pageId ]
	)
}
```

We can now use `isSaving` and `hasEdits` to display a spinner when saving is in progress, and grey out the save button when there are no edits:

```js

export function EditPageForm( { pageId, onSaveFinished } ) {
	// ...
	return (
		// ...
		<div className="form-buttons">
			<Button onClick={ handleSave } variant="primary" disabled={ ! hasEdits || isSaving }>
				{isSaving ? <Spinner/> : 'Save'}
			</Button>
		</div>
		// ...
	);
}
```

Note that we disable the save button when there are no edits, but also when the page is currently being saved. This is to prevent the user from accidentally pressing the button twice..

Here's how it looks like in action:

![](./media/edit-form/form-inactive.png)
![](./media/edit-form/form-spinner.png)

### Wiring it all together

All the pieces are in place, great! Here’s everything we built in this chapter in one place:

```js
import { useDispatch } from '@wordpress/data';
import { Button, Modal, TextControl } from '@wordpress/components';

function PageEditButton({ pageId }) {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );
	return (
		<>
			<Button
				onClick={ openModal }
				variant="primary"
			>
				Edit
			</Button>
			{ isOpen && (
				<Modal onRequestClose={ closeModal } title="Edit page">
					<EditPageForm
						pageId={pageId}
						onCancel={closeModal}
						onSaveFinished={closeModal}
					/>
				</Modal>
			) }
		</>
	)
}

export function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	const { page, lastError, isSaving, hasEdits } = useSelect(
		select => ({
			page: select(coreDataStore).getEditedEntityRecord('postType', 'page', pageId),
			lastError: select(coreDataStore).getLastEntitySaveError('postType', 'page', pageId),
			isSaving: select(coreDataStore).isSavingEntityRecord('postType', 'page', pageId),
			hasEdits: select(coreDataStore).hasEditsForEntityRecord('postType', 'page', pageId),
		}),
		[ pageId ]
	)

	const { saveEditedEntityRecord, editEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		const savedRecord = await saveEditedEntityRecord('postType', 'page', pageId);
		if ( savedRecord ) {
			onSaveFinished();
		}
	};
	const handleChange = ( title ) => editEntityRecord( 'postType', 'page', page.id, { title } );

	return (
		<div className="my-gutenberg-form">
			<TextControl
				label="Page title:"
				value={ page.title }
				onChange={ handleChange }
			/>
			{ lastError ? (
				<div className="form-error">
					Error: { lastError.message }
				</div>
			) : false }
			<div className="form-buttons">
				<Button onClick={ handleSave } variant="primary" disabled={ ! hasEdits || isSaving }>
					{isSaving ? <Spinner/> : 'Save'}
				</Button>
				<Button onClick={ onCancel } variant="tertiary">
					Cancel
				</Button>
			</div>
		</div>
	);
}
```

## What's next?

* **Previous part:** [Building a list of pages](/docs/how-to-guides/data-basics/2-building-a-list-of-pages.md)
* **Next part:** Building a *New Page* form (coming soon)
* (optional) Review the [finished app](https://github.com/WordPress/gutenberg-examples/tree/trunk/09-code-data-basics-esnext) in the gutenberg-examples repository
