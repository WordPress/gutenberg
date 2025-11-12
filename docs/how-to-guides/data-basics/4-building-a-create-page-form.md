# Building a Create page form

In the [previous part](/docs/how-to-guides/data-basics/3-building-an-edit-form.md) we created an *Edit page* feature, and in this part we will add a *Create page* feature. Here's a glimpse of what we're going to build:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/create-form/create-form-with-text.png)

### Step 1: Add a _Create a new page_ button

Let’s start by building a button to display the _create page_ form. It’s similar to an _Edit_ button we have built in the [part 3](/docs/how-to-guides/data-basics/3-building-an-edit-form.md):

```js
import { useDispatch } from '@wordpress/data';
import { Button, Modal, TextControl } from '@wordpress/components';

function CreatePageButton() {
	const [isOpen, setOpen] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );
	return (
		<>
			<Button onClick={ openModal } variant="primary">
				Create a new Page
			</Button>
			{ isOpen && (
				<Modal onRequestClose={ closeModal } title="Create a new page">
					<CreatePageForm
						onCancel={ closeModal }
						onSaveFinished={ closeModal }
					/>
				</Modal>
			) }
		</>
	);
}

function CreatePageForm() {
	// Empty for now
	return <div/>;
}

```

Great! Now let’s make `MyFirstApp` display our shiny new button:

```js
function MyFirstApp() {
	// ...
	return (
		<div>
			<div className="list-controls">
				<SearchControl onChange={ setSearchTerm } value={ searchTerm }/>
				<CreatePageButton/>
			</div>
			<PagesList hasResolved={ hasResolved } pages={ pages }/>
		</div>
	);
}
```

The final result should look as follows:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/create-form/create-button.png)

### Step 2: Extract a controlled PageForm

Now that the button is in place, we can focus entirely on building the form. This tutorial is about managing data, so we will not build a complete page editor. Instead, the form will only contain one field: post title.

Luckily, the `EditPageForm` we built in [part three](/docs/how-to-guides/data-basics/3-building-an-edit-form.md) already takes us 80% of the way there. The bulk of the user interface is already available, and we will reuse it in the `CreatePageForm`. Let’s start by extracting the form UI into a separate component:

```js
function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	// ...
	return (
		<PageForm
			title={ page.title }
			onChangeTitle={ handleChange }
			hasEdits={ hasEdits }
			lastError={ lastError }
			isSaving={ isSaving }
			onCancel={ onCancel }
			onSave={ handleSave }
		/>
	);
}

function PageForm( { title, onChangeTitle, hasEdits, lastError, isSaving, onCancel, onSave } ) {
	return (
		<div className="my-gutenberg-form">
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label="Page title:"
				value={ title }
				onChange={ onChangeTitle }
			/>
			{ lastError ? (
				<div className="form-error">Error: { lastError.message }</div>
			) : (
				false
			) }
			<div className="form-buttons">
				<Button
					onClick={ onSave }
					variant="primary"
					disabled={ !hasEdits || isSaving }
				>
					{ isSaving ? (
						<>
							<Spinner/>
							Saving
						</>
					) : 'Save' }
				</Button>
				<Button
					onClick={ onCancel }
					variant="tertiary"
					disabled={ isSaving }
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
```

This code quality change should not alter anything about how the application works. Let’s try to edit a page just to be sure:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/create-form/edit-page-form.png)

Great! The edit form is still there, and now we have a building block to power the new `CreatePageForm`.

### Step 3: Build a CreatePageForm

The only thing that `CreatePageForm` component must do is to provide the following seven properties needed to render the `PageForm` component:

* title
* onChangeTitle
* hasEdits
* lastError
* isSaving
* onCancel
* onSave

Let’s see how we can do that:

#### Title, onChangeTitle, hasEdits

The `EditPageForm` updated and saved an existing entity record that lived in the Redux state. Because of that, we relied on the `editedEntityRecords` selector.

In case of the `CreatePageForm` however, there is no pre-existing entity record. There is only an empty form. Anything that the user types is local to that form, which means we can keep track of it using the React’s `useState` hook:

```js
function CreatePageForm( { onCancel, onSaveFinished } ) {
	const [title, setTitle] = useState();
	const handleChange = ( title ) => setTitle( title );
	return (
		<PageForm
			title={ title }
			onChangeTitle={ setTitle }
			hasEdits={ !!title }
			{ /* ... */ }
		/>
	);
}
```

#### onSave, onCancel

In the `EditPageForm`, we dispatched the `saveEditedEntityRecord('postType', 'page', pageId )` action to save the edits that lived in the Redux state.

In the `CreatePageForm` however, we do not have any edits in the Redux state, nor we do have a `pageId`. The action we need to dispatch in this case is called [`saveEntityRecord`](https://developer.wordpress.org/block-editor/reference-guides/data/data-core/#saveentityrecord) (without the word _Edited_ in the name) and it accepts an object representing the new entity record instead of a `pageId`.

The data passed to `saveEntityRecord` is sent via a POST request to the appropriate REST API endpoint. For example, dispatching the following action:

```js
saveEntityRecord( 'postType', 'page', { title: "Test" } );
```

Triggers a POST request to the [`/wp/v2/pages` WordPress REST API](https://developer.wordpress.org/rest-api/reference/pages/) endpoint with a  single field in the request body: `title=Test`.

Now that we know more about `saveEntityRecord`, let's use it in `CreatePageForm`.

```js
function CreatePageForm( { onSaveFinished, onCancel } ) {
	// ...
	const { saveEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		const savedRecord = await saveEntityRecord(
			'postType',
			'page',
			{ title }
		);
		if ( savedRecord ) {
			onSaveFinished();
		}
	};
	return (
		<PageForm
			{ /* ... */ }
			onSave={ handleSave }
			onCancel={ onCancel }
		/>
	);
}
```

There is one more detail to address: our newly created pages are not yet picked up by the `PagesList`. Accordingly to the REST API documentation, the `/wp/v2/pages` endpoint creates (`POST` requests) pages with `status=draft` by default, but _returns_ (`GET` requests) pages with `status=publish`. The solution is to pass the `status` parameter explicitly:

```js
function CreatePageForm( { onSaveFinished, onCancel } ) {
	// ...
	const { saveEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		const savedRecord = await saveEntityRecord(
			'postType',
			'page',
			{ title, status: 'publish' }
		);
		if ( savedRecord ) {
			onSaveFinished();
		}
	};
	return (
		<PageForm
			{ /* ... */ }
			onSave={ handleSave }
			onCancel={ onCancel }
		/>
	);
}
```

Go ahead and apply that change to your local `CreatePageForm` component, and let’s tackle the remaining two props.

#### lastError, isSaving

The `EditPageForm`  retrieved the error and progress information via the `getLastEntitySaveError` and `isSavingEntityRecord` selectors. In both cases, it passed the following three arguments: `( 'postType', 'page', pageId )`.

In `CreatePageForm` however, we do not have a `pageId`. What now? We can skip the `pageId` argument to retrieve the information about the entity record without any id – this will be the newly created one. The `useSelect` call is thus very similar to the one from `EditPageForm`:

```js
function CreatePageForm( { onCancel, onSaveFinished } ) {
	// ...
	const { lastError, isSaving } = useSelect(
		( select ) => ( {
			// Notice the missing pageId argument:
			lastError: select( coreDataStore )
				.getLastEntitySaveError( 'postType', 'page' ),
			// Notice the missing pageId argument
			isSaving: select( coreDataStore )
				.isSavingEntityRecord( 'postType', 'page' ),
		} ),
		[]
	);
	// ...
	return (
		<PageForm
			{ /* ... */ }
			lastError={ lastError }
			isSaving={ isSaving }
		/>
	);
}
```

And that’s it! Here's what our new form looks like in action:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/create-form/create-saving.png)
![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/create-form/created-item.png)

### Wiring it all together

Here’s everything we built in this chapter in one place:

```js
function CreatePageForm( { onCancel, onSaveFinished } ) {
	const [title, setTitle] = useState();
	const { lastError, isSaving } = useSelect(
		( select ) => ( {
			lastError: select( coreDataStore )
				.getLastEntitySaveError( 'postType', 'page' ),
			isSaving: select( coreDataStore )
				.isSavingEntityRecord( 'postType', 'page' ),
		} ),
		[]
	);

	const { saveEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		const savedRecord = await saveEntityRecord(
			'postType',
			'page',
			{ title, status: 'publish' }
		);
		if ( savedRecord ) {
			onSaveFinished();
		}
	};

	return (
		<PageForm
			title={ title }
			onChangeTitle={ setTitle }
			hasEdits={ !!title }
			onSave={ handleSave }
			lastError={ lastError }
			onCancel={ onCancel }
			isSaving={ isSaving }
		/>
	);
}

function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	const { page, lastError, isSaving, hasEdits } = useSelect(
		( select ) => ( {
			page: select( coreDataStore ).getEditedEntityRecord( 'postType', 'page', pageId ),
			lastError: select( coreDataStore ).getLastEntitySaveError( 'postType', 'page', pageId ),
			isSaving: select( coreDataStore ).isSavingEntityRecord( 'postType', 'page', pageId ),
			hasEdits: select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'page', pageId ),
		} ),
		[pageId]
	);

	const { saveEditedEntityRecord, editEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		const savedRecord = await saveEditedEntityRecord( 'postType', 'page', pageId );
		if ( savedRecord ) {
			onSaveFinished();
		}
	};
	const handleChange = ( title ) => editEntityRecord( 'postType', 'page', page.id, { title } );

	return (
		<PageForm
			title={ page.title }
			onChangeTitle={ handleChange }
			hasEdits={ hasEdits }
			lastError={ lastError }
			isSaving={ isSaving }
			onCancel={ onCancel }
			onSave={ handleSave }
		/>
	);
}

function PageForm( { title, onChangeTitle, hasEdits, lastError, isSaving, onCancel, onSave } ) {
	return (
		<div className="my-gutenberg-form">
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label="Page title:"
				value={ title }
				onChange={ onChangeTitle }
			/>
			{ lastError ? (
				<div className="form-error">Error: { lastError.message }</div>
			) : (
				false
			) }
			<div className="form-buttons">
				<Button
					onClick={ onSave }
					variant="primary"
					disabled={ !hasEdits || isSaving }
				>
					{ isSaving ? (
						<>
							<Spinner/>
							Saving
						</>
					) : 'Save' }
				</Button>
				<Button
					onClick={ onCancel }
					variant="tertiary"
					disabled={ isSaving }
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
```

All that’s left is to refresh the page and enjoy the form:

![](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/how-to-guides/data-basics/media/create-form/create-form-with-text.png)

## What's next?

* **Next part:** [Adding a delete button](/docs/how-to-guides/data-basics/5-adding-a-delete-button.md)
* **Previous part:** [Building an edit form](/docs/how-to-guides/data-basics/3-building-an-edit-form.md)
* (optional) Review the [finished app](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/data-basics-59c8f8) in the block-development-examples repository
