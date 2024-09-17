# Core Data

Core Data is a [data module](https://github.com/WordPress/gutenberg/tree/HEAD/packages/data/README.md) intended to simplify access to and manipulation of core WordPress entities. It registers its own store and provides a number of selectors which resolve data from the WordPress REST API automatically, along with dispatching action creators to manipulate data. Core data is shipped with [`TypeScript definitions for WordPress data types`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/core-data/src/entity-types/README.md).

Used in combination with features of the data module such as [`subscribe`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/data/README.md#subscribe-function) or [higher-order components](https://github.com/WordPress/gutenberg/tree/HEAD/packages/data/README.md#higher-order-components), it enables a developer to easily add data into the logic and display of their plugin.

## Installation

Install the module

```bash
npm install @wordpress/core-data --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Example

Below is an example of a component which simply renders a list of authors:

```jsx
const { useSelect } = wp.data;

function MyAuthorsListBase() {
	const authors = useSelect( ( select ) => {
		return select( 'core' ).getUsers( { who: 'authors' } );
	}, [] );

	if ( ! authors ) {
		return null;
	}

	return (
		<ul>
			{ authors.map( ( author ) => (
				<li key={ author.id }>{ author.name }</li>
			) ) }
		</ul>
	);
}
```

## What's an entity?

An entity represents a data source. Each item within the entity is called an entity record. Available entities are defined in `rootEntitiesConfig` at ./src/entities.js.

As of right now, the default entities defined by this package map to the [REST API handbook](https://developer.wordpress.org/rest-api/reference/), though there is nothing in the design that prevents it from being used to interact with any other API.

What follows is a description of some of the properties of `rootEntitiesConfig`.

### Connecting the entity with the data source

#### baseURL

-   Type: string.
-   Example: `'/wp/v2/users'`.

This property maps the entity to a given endpoint, taking its relative URL as value.

#### baseURLParams

-   Type: `object`.
-   Example: `{ context: 'edit' }`.

Additional parameters to the request, added as a query string. Each property will be converted into a field/value pair. For example, given the `baseURL: '/wp/v2/users'` and the `baseURLParams: { context: 'edit' }` the URL would be `/wp/v2/users?context=edit`.

#### key

-   Type: `string`.
-   Example: `'slug'`.

The entity engine aims to convert the API response into a number of entity records. Responses can come in different shapes, which are processed differently.

Responses that represent a single object map to a single entity record. For example:

```json
{
	"title": "...",
	"description": "...",
	"...": "..."
}
```

Responses that represent a collection shaped as an array, map to as many entity records as elements of the array. For example:

```json
[
	{ "id": 1, "name": "...", "...": "..." },
	{ "id": 2, "name": "...", "...": "..." },
	{ "id": 3, "name": "...", "...": "..." }
]
```

There are also cases in which a response represents a collection shaped as an object, whose key is one of the property's values. Each of the nested objects should be its own entity record. For this case not to be confused with single object/entities, the entity configuration must provide the property key that holds the value acting as the object key. In the following example, the `slug` property's value is acting as the object key, hence the entity config must declare `key: 'slug'` for each nested object to be processed as an individual entity record:

```json
{
	"publish": { "slug": "publish", "name": "Published", "...": "..." },
	"draft": { "slug": "draft", "name": "Draft", "...": "..." },
	"future": { "slug": "future", "name": "Future", "...": "..." }
}
```

### Interacting with entity records

Entity records are unique. For entities that are collections, it's assumed that each record has an `id` property which serves as an identifier to manage it. If the entity defines a `key`, that property would be used as its identifier instead of the assumed `id`.

#### name

-   Type: `string`.
-   Example: `user`.

The name of the entity. To be used in the utilities that interact with it (selectors, actions, hooks).

#### kind

-   Type: `string`.
-   Example: `root`.

Entities can be grouped by `kind`. To be used in the utilities that interact with them (selectors, actions, hooks).

The package provides general methods to interact with the entities (`getEntityRecords`, `getEntityRecord`, etc.) by leveraging the `kind` and `name` properties:

```js
// Get the record collection for the user entity.
wp.data.select( 'core' ).getEntityRecords( 'root', 'user' );

// Get a single record for the user entity.
wp.data.select( 'core' ).getEntityRecord( 'root', 'user', recordId );
```

#### plural

-   Type: `string`.
-   Example: `statuses`.

In addition to the general utilities (`getEntityRecords`, `getEntityRecord`, etc.), the package dynamically creates nicer-looking methods to interact with the entity records of the `root` kind, both the collection and single records. Compare the general and nicer-looking methods as follows:

```js
// Collection
wp.data.select( 'core' ).getEntityRecords( 'root', 'user' );
wp.data.select( 'core' ).getUsers();

// Single record
wp.data.select( 'core' ).getEntityRecord( 'root', 'user', recordId );
wp.data.select( 'core' ).getUser( recordId );
```

Sometimes, the pluralized form of an entity is not regular (it is not formed by adding a `-s` suffix). The `plural` property of the entity config allows to declare an alternative pluralized form for the dynamic methods created for the entity. For example, given the `status` entity that declares the `statuses` plural, there are the following methods created for it:

```js
// Collection
wp.data.select( 'core' ).getStatuses();

// Single record
wp.data.select( 'core' ).getStatus( recordId );
```

## Actions

The following set of dispatching action creators are available on the object returned by `wp.data.dispatch( 'core' )`:

<!-- START TOKEN(Autogenerated actions|src/actions.js) -->

### addEntities

Returns an action object used in adding new entities.

_Parameters_

-   _entities_ `Array`: Entities received.

_Returns_

-   `Object`: Action object.

### deleteEntityRecord

Action triggered to delete an entity record.

_Parameters_

-   _kind_ `string`: Kind of the deleted entity.
-   _name_ `string`: Name of the deleted entity.
-   _recordId_ `number|string`: Record ID of the deleted entity.
-   _query_ `?Object`: Special query parameters for the DELETE API call.
-   _options_ `[Object]`: Delete options.
-   _options.\_\_unstableFetch_ `[Function]`: Internal use only. Function to call instead of `apiFetch()`. Must return a promise.
-   _options.throwOnError_ `[boolean]`: If false, this action suppresses all the exceptions. Defaults to false.

### editEntityRecord

Returns an action object that triggers an edit to an entity record.

_Parameters_

-   _kind_ `string`: Kind of the edited entity record.
-   _name_ `string`: Name of the edited entity record.
-   _recordId_ `number|string`: Record ID of the edited entity record.
-   _edits_ `Object`: The edits.
-   _options_ `Object`: Options for the edit.
-   _options.undoIgnore_ `[boolean]`: Whether to ignore the edit in undo history or not.

_Returns_

-   `Object`: Action object.

### receiveDefaultTemplateId

Returns an action object used to set the template for a given query.

_Parameters_

-   _query_ `Object`: The lookup query.
-   _templateId_ `string`: The resolved template id.

_Returns_

-   `Object`: Action object.

### receiveEntityRecords

Returns an action object used in signalling that entity records have been received.

_Parameters_

-   _kind_ `string`: Kind of the received entity record.
-   _name_ `string`: Name of the received entity record.
-   _records_ `Array|Object`: Records received.
-   _query_ `?Object`: Query Object.
-   _invalidateCache_ `?boolean`: Should invalidate query caches.
-   _edits_ `?Object`: Edits to reset.
-   _meta_ `?Object`: Meta information about pagination.

_Returns_

-   `Object`: Action object.

### receiveNavigationFallbackId

Returns an action object signalling that the fallback Navigation Menu id has been received.

_Parameters_

-   _fallbackId_ `integer`: the id of the fallback Navigation Menu

_Returns_

-   `Object`: Action object.

### receiveRevisions

Action triggered to receive revision items.

_Parameters_

-   _kind_ `string`: Kind of the received entity record revisions.
-   _name_ `string`: Name of the received entity record revisions.
-   _recordKey_ `number|string`: The key of the entity record whose revisions you want to fetch.
-   _records_ `Array|Object`: Revisions received.
-   _query_ `?Object`: Query Object.
-   _invalidateCache_ `?boolean`: Should invalidate query caches.
-   _meta_ `?Object`: Meta information about pagination.

### receiveThemeSupports

> **Deprecated** since WP 5.9, this is not useful anymore, use the selector directly.

Returns an action object used in signalling that the index has been received.

_Returns_

-   `Object`: Action object.

### receiveUploadPermissions

> **Deprecated** since WP 5.9, use receiveUserPermission instead.

Returns an action object used in signalling that Upload permissions have been received.

_Parameters_

-   _hasUploadPermissions_ `boolean`: Does the user have permission to upload files?

_Returns_

-   `Object`: Action object.

### redo

Action triggered to redo the last undoed edit to an entity record, if any.

### saveEditedEntityRecord

Action triggered to save an entity record's edits.

_Parameters_

-   _kind_ `string`: Kind of the entity.
-   _name_ `string`: Name of the entity.
-   _recordId_ `Object`: ID of the record.
-   _options_ `Object=`: Saving options.

### saveEntityRecord

Action triggered to save an entity record.

_Parameters_

-   _kind_ `string`: Kind of the received entity.
-   _name_ `string`: Name of the received entity.
-   _record_ `Object`: Record to be saved.
-   _options_ `Object`: Saving options.
-   _options.isAutosave_ `[boolean]`: Whether this is an autosave.
-   _options.\_\_unstableFetch_ `[Function]`: Internal use only. Function to call instead of `apiFetch()`. Must return a promise.
-   _options.throwOnError_ `[boolean]`: If false, this action suppresses all the exceptions. Defaults to false.

### undo

Action triggered to undo the last edit to an entity record, if any.

<!-- END TOKEN(Autogenerated actions|src/actions.js) -->

## Selectors

The following selectors are available on the object returned by `wp.data.select( 'core' )`:

<!-- START TOKEN(Autogenerated selectors|src/selectors.ts) -->

### canUser

Returns whether the current user can perform the given action on the given REST resource.

Calling this may trigger an OPTIONS request to the REST API via the `canUser()` resolver.

<https://developer.wordpress.org/rest-api/reference/>

_Parameters_

-   _state_ `State`: Data state.
-   _action_ `string`: Action to check. One of: 'create', 'read', 'update', 'delete'.
-   _resource_ `string | EntityResource`: Entity resource to check. Accepts entity object `{ kind: 'root', name: 'media', id: 1 }` or REST base as a string - `media`.
-   _id_ `EntityRecordKey`: Optional ID of the rest resource to check.

_Returns_

-   `boolean | undefined`: Whether or not the user can perform the action, or `undefined` if the OPTIONS request is still being made.

### canUserEditEntityRecord

Returns whether the current user can edit the given entity.

Calling this may trigger an OPTIONS request to the REST API via the `canUser()` resolver.

<https://developer.wordpress.org/rest-api/reference/>

_Parameters_

-   _state_ `State`: Data state.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record's id.

_Returns_

-   `boolean | undefined`: Whether or not the user can edit, or `undefined` if the OPTIONS request is still being made.

### getAuthors

> **Deprecated** since 11.3. Callers should use `select( 'core' ).getUsers({ who: 'authors' })` instead.

Returns all available authors.

_Parameters_

-   _state_ `State`: Data state.
-   _query_ `GetRecordsHttpQuery`: Optional object of query parameters to include with request. For valid query parameters see the [Users page](https://developer.wordpress.org/rest-api/reference/users/) in the REST API Handbook and see the arguments for [List Users](https://developer.wordpress.org/rest-api/reference/users/#list-users) and [Retrieve a User](https://developer.wordpress.org/rest-api/reference/users/#retrieve-a-user).

_Returns_

-   `ET.User[]`: Authors list.

### getAutosave

Returns the autosave for the post and author.

_Parameters_

-   _state_ `State`: State tree.
-   _postType_ `string`: The type of the parent post.
-   _postId_ `EntityRecordKey`: The id of the parent post.
-   _authorId_ `EntityRecordKey`: The id of the author.

_Returns_

-   `EntityRecord | undefined`: The autosave for the post and author.

### getAutosaves

Returns the latest autosaves for the post.

May return multiple autosaves since the backend stores one autosave per author for each post.

_Parameters_

-   _state_ `State`: State tree.
-   _postType_ `string`: The type of the parent post.
-   _postId_ `EntityRecordKey`: The id of the parent post.

_Returns_

-   `Array< any > | undefined`: An array of autosaves for the post, or undefined if there is none.

### getBlockPatternCategories

Retrieve the list of registered block pattern categories.

_Parameters_

-   _state_ `State`: Data state.

_Returns_

-   `Array< any >`: Block pattern category list.

### getBlockPatterns

Retrieve the list of registered block patterns.

_Parameters_

-   _state_ `State`: Data state.

_Returns_

-   `Array< any >`: Block pattern list.

### getCurrentTheme

Return the current theme.

_Parameters_

-   _state_ `State`: Data state.

_Returns_

-   `any`: The current theme.

### getCurrentThemeGlobalStylesRevisions

> **Deprecated** since WordPress 6.5.0. Callers should use `select( 'core' ).getRevisions( 'root', 'globalStyles', ${ recordKey } )` instead, where `recordKey` is the id of the global styles parent post.

Returns the revisions of the current global styles theme.

_Parameters_

-   _state_ `State`: Data state.

_Returns_

-   `Array< object > | null`: The current global styles.

### getCurrentUser

Returns the current user.

_Parameters_

-   _state_ `State`: Data state.

_Returns_

-   `ET.User< 'edit' >`: Current user object.

### getDefaultTemplateId

Returns the default template use to render a given query.

_Parameters_

-   _state_ `State`: Data state.
-   _query_ `TemplateQuery`: Query.

_Returns_

-   `string`: The default template id for the given query.

### getEditedEntityRecord

Returns the specified entity record, merged with its edits.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `ET.Updatable< EntityRecord > | false`: The entity record, merged with its edits.

### getEmbedPreview

Returns the embed preview for the given URL.

_Parameters_

-   _state_ `State`: Data state.
-   _url_ `string`: Embedded URL.

_Returns_

-   `any`: Undefined if the preview has not been fetched, otherwise, the preview fetched from the embed preview API.

### getEntitiesByKind

> **Deprecated** since WordPress 6.0. Use getEntitiesConfig instead

Returns the loaded entities for the given kind.

_Parameters_

-   _state_ `State`: Data state.
-   _kind_ `string`: Entity kind.

_Returns_

-   `Array< any >`: Array of entities with config matching kind.

### getEntitiesConfig

Returns the loaded entities for the given kind.

_Parameters_

-   _state_ `State`: Data state.
-   _kind_ `string`: Entity kind.

_Returns_

-   `Array< any >`: Array of entities with config matching kind.

### getEntity

> **Deprecated** since WordPress 6.0. Use getEntityConfig instead

Returns the entity config given its kind and name.

_Parameters_

-   _state_ `State`: Data state.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.

_Returns_

-   `any`: Entity config

### getEntityConfig

Returns the entity config given its kind and name.

_Parameters_

-   _state_ `State`: Data state.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.

_Returns_

-   `any`: Entity config

### getEntityRecord

Returns the Entity's record object by key. Returns `null` if the value is not yet received, undefined if the value entity is known to not exist, or the entity object if it exists and is received.

_Parameters_

-   _state_ `State`: State tree
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _key_ `EntityRecordKey`: Record's key
-   _query_ `GetRecordsHttpQuery`: Optional query. If requesting specific fields, fields must always include the ID. For valid query parameters see the [Reference](https://developer.wordpress.org/rest-api/reference/) in the REST API Handbook and select the entity kind. Then see the arguments available "Retrieve a [Entity kind]".

_Returns_

-   `EntityRecord | undefined`: Record.

### getEntityRecordEdits

Returns the specified entity record's edits.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `Optional< any >`: The entity record's edits.

### getEntityRecordNonTransientEdits

Returns the specified entity record's non transient edits.

Transient edits don't create an undo level, and are not considered for change detection. They are defined in the entity's config.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `Optional< any >`: The entity record's non transient edits.

### getEntityRecords

Returns the Entity's records.

_Parameters_

-   _state_ `State`: State tree
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _query_ `GetRecordsHttpQuery`: Optional terms query. If requesting specific fields, fields must always include the ID. For valid query parameters see the [Reference](https://developer.wordpress.org/rest-api/reference/) in the REST API Handbook and select the entity kind. Then see the arguments available for "List [Entity kind]s".

_Returns_

-   `EntityRecord[] | null`: Records.

### getEntityRecordsTotalItems

Returns the Entity's total available records for a given query (ignoring pagination).

_Parameters_

-   _state_ `State`: State tree
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _query_ `GetRecordsHttpQuery`: Optional terms query. If requesting specific fields, fields must always include the ID. For valid query parameters see the [Reference](https://developer.wordpress.org/rest-api/reference/) in the REST API Handbook and select the entity kind. Then see the arguments available for "List [Entity kind]s".

_Returns_

-   `number | null`: number | null.

### getEntityRecordsTotalPages

Returns the number of available pages for the given query.

_Parameters_

-   _state_ `State`: State tree
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _query_ `GetRecordsHttpQuery`: Optional terms query. If requesting specific fields, fields must always include the ID. For valid query parameters see the [Reference](https://developer.wordpress.org/rest-api/reference/) in the REST API Handbook and select the entity kind. Then see the arguments available for "List [Entity kind]s".

_Returns_

-   `number | null`: number | null.

### getLastEntityDeleteError

Returns the specified entity record's last delete error.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `any`: The entity record's save error.

### getLastEntitySaveError

Returns the specified entity record's last save error.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `any`: The entity record's save error.

### getRawEntityRecord

Returns the entity's record object by key, with its attributes mapped to their raw values.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _key_ `EntityRecordKey`: Record's key.

_Returns_

-   `EntityRecord | undefined`: Object with the entity's raw attributes.

### getRedoEdit

> **Deprecated** since 6.3

Returns the next edit from the current undo offset for the entity records edits history, if any.

_Parameters_

-   _state_ `State`: State tree.

_Returns_

-   `Optional< any >`: The edit.

### getReferenceByDistinctEdits

Returns a new reference when edited values have changed. This is useful in inferring where an edit has been made between states by comparison of the return values using strict equality.

_Usage_

    const hasEditOccurred = (
       getReferenceByDistinctEdits( beforeState ) !==
       getReferenceByDistinctEdits( afterState )
    );

_Parameters_

-   _state_ Editor state.

_Returns_

-   A value whose reference will change only when an edit occurs.

### getRevision

Returns a single, specific revision of a parent entity.

_Parameters_

-   _state_ `State`: State tree
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordKey_ `EntityRecordKey`: The key of the entity record whose revisions you want to fetch.
-   _revisionKey_ `EntityRecordKey`: The revision's key.
-   _query_ `GetRecordsHttpQuery`: Optional query. If requesting specific fields, fields must always include the ID. For valid query parameters see revisions schema in [the REST API Handbook](https://developer.wordpress.org/rest-api/reference/). Then see the arguments available "Retrieve a [entity kind]".

_Returns_

-   `RevisionRecord | Record< PropertyKey, never > | undefined`: Record.

### getRevisions

Returns an entity's revisions.

_Parameters_

-   _state_ `State`: State tree
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordKey_ `EntityRecordKey`: The key of the entity record whose revisions you want to fetch.
-   _query_ `GetRecordsHttpQuery`: Optional query. If requesting specific fields, fields must always include the ID. For valid query parameters see revisions schema in [the REST API Handbook](https://developer.wordpress.org/rest-api/reference/). Then see the arguments available "Retrieve a [Entity kind]".

_Returns_

-   `RevisionRecord[] | null`: Record.

### getThemeSupports

Return theme supports data in the index.

_Parameters_

-   _state_ `State`: Data state.

_Returns_

-   `any`: Index data.

### getUndoEdit

> **Deprecated** since 6.3

Returns the previous edit from the current undo offset for the entity records edits history, if any.

_Parameters_

-   _state_ `State`: State tree.

_Returns_

-   `Optional< any >`: The edit.

### getUserPatternCategories

Retrieve the registered user pattern categories.

_Parameters_

-   _state_ `State`: Data state.

_Returns_

-   `Array< UserPatternCategory >`: User patterns category array.

### getUserQueryResults

Returns all the users returned by a query ID.

_Parameters_

-   _state_ `State`: Data state.
-   _queryID_ `string`: Query ID.

_Returns_

-   `ET.User< 'edit' >[]`: Users list.

### hasEditsForEntityRecord

Returns true if the specified entity record has edits, and false otherwise.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `boolean`: Whether the entity record has edits or not.

### hasEntityRecords

Returns true if records have been received for the given set of parameters, or false otherwise.

_Parameters_

-   _state_ `State`: State tree
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _query_ `GetRecordsHttpQuery`: Optional terms query. For valid query parameters see the [Reference](https://developer.wordpress.org/rest-api/reference/) in the REST API Handbook and select the entity kind. Then see the arguments available for "List [Entity kind]s".

_Returns_

-   `boolean`: Whether entity records have been received.

### hasFetchedAutosaves

Returns true if the REST request for autosaves has completed.

_Parameters_

-   _state_ `State`: State tree.
-   _postType_ `string`: The type of the parent post.
-   _postId_ `EntityRecordKey`: The id of the parent post.

_Returns_

-   `boolean`: True if the REST request was completed. False otherwise.

### hasRedo

Returns true if there is a next edit from the current undo offset for the entity records edits history, and false otherwise.

_Parameters_

-   _state_ `State`: State tree.

_Returns_

-   `boolean`: Whether there is a next edit or not.

### hasUndo

Returns true if there is a previous edit from the current undo offset for the entity records edits history, and false otherwise.

_Parameters_

-   _state_ `State`: State tree.

_Returns_

-   `boolean`: Whether there is a previous edit or not.

### isAutosavingEntityRecord

Returns true if the specified entity record is autosaving, and false otherwise.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `boolean`: Whether the entity record is autosaving or not.

### isDeletingEntityRecord

Returns true if the specified entity record is deleting, and false otherwise.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `boolean`: Whether the entity record is deleting or not.

### isPreviewEmbedFallback

Determines if the returned preview is an oEmbed link fallback.

WordPress can be configured to return a simple link to a URL if it is not embeddable. We need to be able to determine if a URL is embeddable or not, based on what we get back from the oEmbed preview API.

_Parameters_

-   _state_ `State`: Data state.
-   _url_ `string`: Embedded URL.

_Returns_

-   `boolean`: Is the preview for the URL an oEmbed link fallback.

### isRequestingEmbedPreview

Returns true if a request is in progress for embed preview data, or false otherwise.

_Parameters_

-   _state_ `State`: Data state.
-   _url_ `string`: URL the preview would be for.

_Returns_

-   `boolean`: Whether a request is in progress for an embed preview.

### isSavingEntityRecord

Returns true if the specified entity record is saving, and false otherwise.

_Parameters_

-   _state_ `State`: State tree.
-   _kind_ `string`: Entity kind.
-   _name_ `string`: Entity name.
-   _recordId_ `EntityRecordKey`: Record ID.

_Returns_

-   `boolean`: Whether the entity record is saving or not.

<!-- END TOKEN(Autogenerated selectors|src/selectors.ts) -->

## Hooks

The following set of react hooks available to import from the `@wordpress/core-data` package:

<!-- START TOKEN(Autogenerated hooks|src/hooks/index.ts) -->

### useEntityBlockEditor

Hook that returns block content getters and setters for the nearest provided entity of the specified type.

The return value has the shape `[ blocks, onInput, onChange ]`. `onInput` is for block changes that don't create undo levels or dirty the post, non-persistent changes, and `onChange` is for persistent changes. They map directly to the props of a `BlockEditorProvider` and are intended to be used with it, or similar components or hooks.

_Parameters_

-   _kind_ `string`: The entity kind.
-   _name_ `string`: The entity name.
-   _options_ `Object`:
-   _options.id_ `[string]`: An entity ID to use instead of the context-provided one.

_Returns_

-   `[unknown[], Function, Function]`: The block array and setters.

### useEntityId

Hook that returns the ID for the nearest provided entity of the specified type.

_Parameters_

-   _kind_ `string`: The entity kind.
-   _name_ `string`: The entity name.

### useEntityProp

Hook that returns the value and a setter for the specified property of the nearest provided entity of the specified type.

_Parameters_

-   _kind_ `string`: The entity kind.
-   _name_ `string`: The entity name.
-   _prop_ `string`: The property name.
-   _\_id_ `[number|string]`: An entity ID to use instead of the context-provided one.

_Returns_

-   `[*, Function, *]`: An array where the first item is the property value, the second is the setter and the third is the full value object from REST API containing more information like `raw`, `rendered` and `protected` props.

### useEntityRecord

Resolves the specified entity record.

_Usage_

```js
import { useEntityRecord } from '@wordpress/core-data';

function PageTitleDisplay( { id } ) {
	const { record, isResolving } = useEntityRecord( 'postType', 'page', id );

	if ( isResolving ) {
		return 'Loading...';
	}

	return record.title;
}

// Rendered in the application:
// <PageTitleDisplay id={ 1 } />
```

In the above example, when `PageTitleDisplay` is rendered into an
application, the page and the resolution details will be retrieved from
the store state using `getEntityRecord()`, or resolved if missing.

```js
import { useCallback } from 'react';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { store as noticeStore } from '@wordpress/notices';
import { useEntityRecord } from '@wordpress/core-data';

function PageRenameForm( { id } ) {
	const page = useEntityRecord( 'postType', 'page', id );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticeStore );

	const setTitle = useCallback(
		( title ) => {
			page.edit( { title } );
		},
		[ page.edit ]
	);

	if ( page.isResolving ) {
		return 'Loading...';
	}

	async function onRename( event ) {
		event.preventDefault();
		try {
			await page.save();
			createSuccessNotice( __( 'Page renamed.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			createErrorNotice( error.message, { type: 'snackbar' } );
		}
	}

	return (
		<form onSubmit={ onRename }>
			<TextControl
				label={ __( 'Name' ) }
				value={ page.editedRecord.title }
				onChange={ setTitle }
			/>
			<button type="submit">{ __( 'Save' ) }</button>
		</form>
	);
}

// Rendered in the application:
// <PageRenameForm id={ 1 } />
```

In the above example, updating and saving the page title is handled
via the `edit()` and `save()` mutation helpers provided by
`useEntityRecord()`;

_Parameters_

-   _kind_ `string`: Kind of the entity, e.g. `root` or a `postType`. See rootEntitiesConfig in ../entities.ts for a list of available kinds.
-   _name_ `string`: Name of the entity, e.g. `plugin` or a `post`. See rootEntitiesConfig in ../entities.ts for a list of available names.
-   _recordId_ `string | number`: ID of the requested entity record.
-   _options_ `Options`: Optional hook options.

_Returns_

-   `EntityRecordResolution< RecordType >`: Entity record data.

_Changelog_

`6.1.0` Introduced in WordPress core.

### useEntityRecords

Resolves the specified entity records.

_Usage_

```js
import { useEntityRecords } from '@wordpress/core-data';

function PageTitlesList() {
	const { records, isResolving } = useEntityRecords( 'postType', 'page' );

	if ( isResolving ) {
		return 'Loading...';
	}

	return (
		<ul>
			{ records.map( ( page ) => (
				<li>{ page.title }</li>
			) ) }
		</ul>
	);
}

// Rendered in the application:
// <PageTitlesList />
```

In the above example, when `PageTitlesList` is rendered into an
application, the list of records and the resolution details will be retrieved from
the store state using `getEntityRecords()`, or resolved if missing.

_Parameters_

-   _kind_ `string`: Kind of the entity, e.g. `root` or a `postType`. See rootEntitiesConfig in ../entities.ts for a list of available kinds.
-   _name_ `string`: Name of the entity, e.g. `plugin` or a `post`. See rootEntitiesConfig in ../entities.ts for a list of available names.
-   _queryArgs_ `Record< string, unknown >`: Optional HTTP query description for how to fetch the data, passed to the requested API endpoint.
-   _options_ `Options`: Optional hook options.

_Returns_

-   `EntityRecordsResolution< RecordType >`: Entity records data.

_Changelog_

`6.1.0` Introduced in WordPress core.

### useResourcePermissions

Resolves resource permissions.

_Usage_

```js
import { useResourcePermissions } from '@wordpress/core-data';

function PagesList() {
	const { canCreate, isResolving } = useResourcePermissions( {
		kind: 'postType',
		name: 'page',
	} );

	if ( isResolving ) {
		return 'Loading ...';
	}

	return (
		<div>
			{ canCreate ? <button>+ Create a new page</button> : false }
			// ...
		</div>
	);
}

// Rendered in the application:
// <PagesList />
```

```js
import { useResourcePermissions } from '@wordpress/core-data';

function Page( { pageId } ) {
	const { canCreate, canUpdate, canDelete, isResolving } =
		useResourcePermissions( {
			kind: 'postType',
			name: 'page',
			id: pageId,
		} );

	if ( isResolving ) {
		return 'Loading ...';
	}

	return (
		<div>
			{ canCreate ? <button>+ Create a new page</button> : false }
			{ canUpdate ? <button>Edit page</button> : false }
			{ canDelete ? <button>Delete page</button> : false }
			// ...
		</div>
	);
}

// Rendered in the application:
// <Page pageId={ 15 } />
```

In the above example, when `PagesList` is rendered into an
application, the appropriate permissions and the resolution details will be retrieved from
the store state using `canUser()`, or resolved if missing.

_Parameters_

-   _resource_ `string | EntityResource`: Entity resource to check. Accepts entity object `{ kind: 'root', name: 'media', id: 1 }` or REST base as a string - `media`.
-   _id_ `IdType`: Optional ID of the resource to check, e.g. 10. Note: This argument is discouraged when using an entity object as a resource to check permissions and will be ignored.

_Returns_

-   `ResourcePermissionsResolution< IdType >`: Entity records data.

_Changelog_

`6.1.0` Introduced in WordPress core.

<!-- END TOKEN(Autogenerated hooks|src/hooks/index.ts) -->

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
