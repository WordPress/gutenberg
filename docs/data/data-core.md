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

### hasUploadPermissions

Return Upload Permissions.

*Parameters*

 * state: State tree.

*Returns*

Upload Permissions.

## Actions

### receiveUserQuery

Returns an action object used in signalling that authors have been received.

*Parameters*

 * queryID: Query ID.
 * users: Users received.

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