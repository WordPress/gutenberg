# **core**: WordPress Core Data

## Selectors

### isRequestingEmbedPreview

Returns true if a request is in progress for embed preview data, or false
otherwise.

*Parameters*

 * state: Data state.
 * url: URL the preview would be for.

### getAuthors

Returns all available authors.

*Parameters*

 * state: Data state.

*Returns*

Authors list.

### getCurrentUser

Returns the current user.

*Parameters*

 * state: Data state.

*Returns*

Current user object.

### getUserQueryResults

Returns all the users returned by a query ID.

*Parameters*

 * state: Data state.
 * queryID: Query ID.

*Returns*

Users list.

### getEntitiesByKind

Returns whether the entities for the give kind are loaded.

*Parameters*

 * state: Data state.
 * kind: Entity kind.

*Returns*

Whether the entities are loaded

### getEntity

Returns the entity object given its kind and name.

*Parameters*

 * state: Data state.
 * kind: Entity kind.
 * name: Entity name.

*Returns*

Entity

### getEntityRecord

Returns the Entity's record object by key.

*Parameters*

 * state: State tree
 * kind: Entity kind.
 * name: Entity name.
 * key: Record's key

*Returns*

Record.

### getEntityRecords

Returns the Entity's records.

*Parameters*

 * state: State tree
 * kind: Entity kind.
 * name: Entity name.
 * query: Optional terms query.

*Returns*

Records.

### getThemeSupports

Return theme supports data in the index.

*Parameters*

 * state: Data state.

*Returns*

Index data.

### getEmbedPreview

Returns the embed preview for the given URL.

*Parameters*

 * state: Data state.
 * url: Embedded URL.

*Returns*

Undefined if the preview has not been fetched, otherwise, the preview fetched from the embed preview API.

### isPreviewEmbedFallback

Determines if the returned preview is an oEmbed link fallback.

WordPress can be configured to return a simple link to a URL if it is not embeddable.
We need to be able to determine if a URL is embeddable or not, based on what we
get back from the oEmbed preview API.

*Parameters*

 * state: Data state.
 * url: Embedded URL.

*Returns*

Is the preview for the URL an oEmbed link fallback.

### hasUploadPermissions (deprecated)

Returns whether the current user can upload media.

Calling this may trigger an OPTIONS request to the REST API via the
`canUser()` resolver.

https://developer.wordpress.org/rest-api/reference/

*Deprecated*

Deprecated since 5.0. Callers should use the more generic `canUser()` selector instead of
            `hasUploadPermissions()`, e.g. `canUser( 'create', 'media' )`.

*Parameters*

 * state: Data state.

*Returns*

Whether or not the user can upload media. Defaults to `true` if the OPTIONS
                  request is being made.

### canUser

Returns whether the current user can perform the given action on the given
REST resource.

Calling this may trigger an OPTIONS request to the REST API via the
`canUser()` resolver.

https://developer.wordpress.org/rest-api/reference/

*Parameters*

 * state: Data state.
 * action: Action to check. One of: 'create', 'read', 'update', 'delete'.
 * resource: REST resource to check, e.g. 'media' or 'posts'.
 * id: Optional ID of the rest resource to check.

*Returns*

Whether or not the user can perform the action,
                            or `undefined` if the OPTIONS request is still being made.

### getAutosaves

Returns the latest autosaves for the post.

May return multiple autosaves since the backend stores one autosave per
author for each post.

*Parameters*

 * state: State tree.
 * postType: The type of the parent post.
 * postId: The id of the parent post.

*Returns*

An array of autosaves for the post, or undefined if there is none.

### getAutosave

Returns the autosave for the post and author.

*Parameters*

 * state: State tree.
 * postType: The type of the parent post.
 * postId: The id of the parent post.
 * authorId: The id of the author.

*Returns*

The autosave for the post and author.

### hasFetchedAutosave

Returns true if the REST request for an autosave has completed.

*Parameters*

 * state: State tree.
 * postType: The type of the parent post.
 * postId: The id of the parent post.

*Returns*

True if the REST request was completed. False otherwise.

## Actions

### receiveUserQuery

Returns an action object used in signalling that authors have been received.

*Parameters*

 * queryID: Query ID.
 * users: Users received.

### receiveCurrentUser

Returns an action used in signalling that the current user has been received.

*Parameters*

 * currentUser: Current user object.

### addEntities

Returns an action object used in adding new entities.

*Parameters*

 * entities: Entities received.

### receiveEntityRecords

Returns an action object used in signalling that entity records have been received.

*Parameters*

 * kind: Kind of the received entity.
 * name: Name of the received entity.
 * records: Records received.
 * query: Query Object.
 * invalidateCache: Should invalidate query caches

### receiveThemeSupports

Returns an action object used in signalling that the index has been received.

*Parameters*

 * themeSupports: Theme support for the current theme.

### receiveEmbedPreview

Returns an action object used in signalling that the preview data for
a given URl has been received.

*Parameters*

 * url: URL to preview the embed for.
 * preview: Preview data.

### saveEntityRecord

Action triggered to save an entity record.

*Parameters*

 * kind: Kind of the received entity.
 * name: Name of the received entity.
 * record: Record to be saved.

### receiveUploadPermissions

Returns an action object used in signalling that Upload permissions have been received.

*Parameters*

 * hasUploadPermissions: Does the user have permission to upload files?

### receiveUserPermission

Returns an action object used in signalling that the current user has
permission to perform an action on a REST resource.

*Parameters*

 * key: A key that represents the action and REST resource.
 * isAllowed: Whether or not the user can perform the action.

### receiveAutosaves

Returns an action object used in signalling that the autosaves for a
post have been received.

*Parameters*

 * postId: The id of the post that is parent to the autosave.
 * autosaves: Array of autosave post objects.