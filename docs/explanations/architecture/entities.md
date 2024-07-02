# Entities and Undo/Redo

The WordPress editors, whether it's the Post or Site Editor, manipulate what we call entity records. These are objects that represent a post, a page, a user, a term, a template, etc. They are the data that is stored in the database, and that is manipulated by the editor. Each editor can fetch, edit, and save multiple entity records at the same time. 

For instance, when opening a page in the Site Editor:

 - You can edit properties of the page itself (title, content, etc.)
 - You can edit properties of the template of the page (content of the template, design, etc.)
 - You can edit properties of template parts (header, footer) used with the template.

The editor keeps track of all these modifications and orchestrates the saving of all these modified records. This happens within the `@wordpress/core-data` package.


## Editing entities

To be able to edit an entity, you need to first fetch it and load it into the `core-data` store. For example, the following code loads the post with ID 1 into the store. (The entity is the post, the post 1 is the entity record).

````js
wp.data.select( 'core' ).getEntityRecord( 'postType', 'post', 1 );
````

Once the entity is loaded, you can edit it. For example, the following code sets the title of the post to "Hello World". For each fetched entity record, the `core-data` store keeps track of the following:

 - **The "persisted" record:** The last state of the record as it was fetched from the backend.
 - **A list of "edits":** Unsaved local modifications for one or several properties of the record. 
 
The package also exposes a set of actions to manipulate the fetched entity records.

To edit an entity record, you can call `editEntityRecord`, which takes the entity type, the entity ID, and the new entity record as parameters. The following example sets the title of the post with ID 1 to "Hello World".

````js
wp.data.dispatch( 'core' ).editEntityRecord( 'postType', 'post', 1, { title: 'Hello World' } );
````

Once you have edited an entity record, you can save it. The following code saves the post with ID 1.

````js
wp.data.dispatch( 'core' ).saveEditedEntityRecord( 'postType', 'post', 1 );
````

## Undo/Redo

Since the WordPress editors allow multiple entity records to be edited at the same time, the `core-data` package keeps track of all the entity records that have been fetched and edited in a common undo/redo stack. Each step in the undo/redo stack contains a list of "edits" that should be undone or redone at the same time when calling the `undo` or `redo` action.

And to be able to perform both undo and redo operations properly, each modification in the list of edits contains the following information:

 - **Entity kind and name:** Each entity in core-data is identified by the pair _(kind, name)_. This corresponds to the identifier of the modified entity. 
 - **Entity Record ID:** The ID of the modified record.
 - **Property:** The name of the modified property.
 - **From:** The previous value of the property (needed to apply the undo operation).
 - **To:** The new value of the property (needed to apply the redo operation).
 
For example, let's say a user edits the title of a post, followed by a modification to the post slug, and then a modification of the title of a reusable block used with the post. The following information is stored in the undo/redo stack:

 - `[ { kind: 'postType', name: 'post', id: 1, property: 'title', from: '', to: 'Hello World' } ]`
 - `[ { kind: 'postType', name: 'post', id: 1, property: 'slug', from: 'Previous slug', to: 'This is the slug of the hello world post' } ]`
 - `[ { kind: 'postType', name: 'wp_block', id: 2, property: 'title', from: 'Reusable Block', to: 'Awesome Reusable Block' } ]`

The store also keeps track of a "pointer" to the current "undo/redo" step. By default, the pointer always points to the last item in the stack. This pointer is updated when the user performs an undo or redo operation.

### Cached changes

The undo/redo core behavior also supports what we call "cached modifications". These are modifications that are not stored in the undo/redo stack right away. For instance, when a user starts typing in a text field, the value of the field is modified in the store, but this modification is not stored in the undo/redo stack until after the user moves to the next word or after a few milliseconds. This is done to avoid creating a new undo/redo step for each character typed by the user.

Cached changes are kept outside the undo/redo stack in what is called a "cache" of modifications, and these modifications are only stored in the undo/redo stack when we explicitly call `__unstableCreateUndoLevel` or when the next modification is not a cached one.

By default, all calls to `editEntityRecord` are considered "non-cached" unless the `isCached` option is passed as true. Example:

```js
wp.data.dispatch( 'core' ).editEntityRecord( 'postType', 'post', 1, { title: 'Hello World' }, { isCached: true } );
```
