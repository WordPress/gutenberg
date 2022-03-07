# Part 4: Building a new page form

This part is about adding a *Create page* feature to our app. Here's a glimpse of what we're going to build:

### Step 1: Add a _Create_ button

```js
import { useDispatch } from '@wordpress/data';
import { Button, Modal, TextControl } from '@wordpress/components';

function PageCreateButton() {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );
	return (
		<>
			<Button onClick={ openModal } variant="primary">
				Edit
			</Button>
			{ isOpen && (
				<Modal onRequestClose={ closeModal } title="Create page">
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
	return <div />;
}

```

Let’s add it to the app:

```js
function MyFirstApp() {
	// ...
	return (
		<div>
			<SearchControl onChange={ setSearchTerm } value={ searchTerm } />
			<PageCreateButton />
			<PagesList hasResolved={ hasResolved } pages={ pages } />
		</div>
	);
}
```

It should look like this:

### Step 2: Extract a controlled PageForm

A Create page form is similar to an edit page form. We will extract the UI part first:

```js

export function EditPageForm( { pageId, onCancel, onSaveFinished } ) {
	const { page, lastError, isSaving, hasEdits } = useSelect(
		( select ) => ( {
			page: select( coreDataStore ).getEditedEntityRecord( 'postType', 'page', pageId ),
			lastError: select( coreDataStore ).getLastEntitySaveError( 'postType', 'page', pageId ),
			isSaving: select( coreDataStore ).isSavingEntityRecord( 'postType', 'page', pageId ),
			hasEdits: select( coreDataStore ).hasEditsForEntityRecord( 'postType', 'page', pageId ),
		} ),
		[ pageId ]
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
			title={page.title}
			onChangeTitle={handleChange}
			hasEdits={hasEdits}
			lastError={lastError}
			isSaving={isSaving}
			onCancel={onCancel}
			onSave={handleSave}
			/>
	);
}

export function PageForm( { title, onChangeTitle, hasEdits, lastError, isSaving, onCancel, onSave } ) {
	return (
		<div className="my-gutenberg-form">
			<TextControl
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
					disabled={ ! hasEdits || isSaving }
				>
					{ isSaving ? <Spinner /> : 'Save' }
				</Button>
				<Button onClick={ onCancel } variant="tertiary">
					Cancel
				</Button>
			</div>
		</div>
	);
}
```

### Step 3: Build a CreatePageForm
Let’s now build a CreatePageForm on top of PageForm

#### Title, onChangeTitle, hasEdits
We won’t use `editedEntityRecords`, just a regular React state.

```js
export function CreatePageForm( { onCancel, onSaveFinished } ) {
	const [ title, setTitle ] = useState();
	const handleChange = ( title ) => setTitle( title );
	return (
		<PageForm
			title={ title }
			onChange={ setTitle }
			hasEdits={ !! title }
			{ /* ... */ }
			/>
	);
}
```

#### onSave

Similarly for saving
```js
export function CreatePageForm( { onCancel, onSaveFinished } ) {
	const { saveEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		const savedRecord = await saveEntityRecord( 'postType', 'page', { title } );
		if ( savedRecord ) {
			onSaveFinished();
		}
	};
	return (
		<PageForm
			{ /* ... */ }
			onSave={ handleSave }
			/>
	);
}
```

#### lastError, isSaving

Finally, we cannot use page id to find the last error or saving status. That’s not a problem, though, let’s just not pass it:

```js
export function CreatePageForm( { onCancel, onSaveFinished } ) {
	// ...
	const { lastError, isSaving } = useSelect(
		( select ) => ( {
			lastError: select( coreDataStore ).getLastEntitySaveError( 'postType', 'page' ),
			isSaving: select( coreDataStore ).isSavingEntityRecord( 'postType', 'page' ),
		} ),
		[]
	);
	return (
		<PageForm
			{ /* ... */ }
			lastError={ lastError }
			isSaving={ isSaving }
			/>
	);}
```

Putting it all together:

```js

export function CreatePageForm( { onCancel, onSaveFinished } ) {
	const [ title, setTitle ] = useState();
	const { lastError, isSaving } = useSelect(
		( select ) => ( {
			lastError: select( coreDataStore ).getLastEntitySaveError( 'postType', 'page' ),
			isSaving: select( coreDataStore ).isSavingEntityRecord( 'postType', 'page' ),
		} ),
		[]
	);

	const { saveEntityRecord } = useDispatch( coreDataStore );
	const handleSave = async () => {
		const savedRecord = await saveEntityRecord( 'postType', 'page', { title } );
		if ( savedRecord ) {
			onSaveFinished();
		}
	};

	return (
		<PageForm
			title={ title }
			onChange={ setTitle }
			hasEdits={ !! title }
			onSave={ handleSave }
			lastError={ lastError }
			isSaving={ isSaving }
		/>
	);
}
```

All that’s left is to refresh the page and enjoy the form:

(screenshot)

## What's next?

* **Previous part:** [Building an edit form](#)(/docs/how-to-guides/data-basics/3-building-an-edit-form.md)
* (optional) Review the [finished app](#)(https://github.com/WordPress/gutenberg-examples/tree/trunk/09-code-data-basics-esnext) in the gutenberg-examples repository

