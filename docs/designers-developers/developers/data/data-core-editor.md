# **core/editor**: The Post Editor’s Data

## Selectors

### hasEditorUndo

Returns true if any past editor history snapshots exist, or false otherwise.

*Parameters*

 * state: Global application state.

### hasEditorRedo

Returns true if any future editor history snapshots exist, or false
otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether redo history exists.

### isEditedPostNew

Returns true if the currently edited post is yet to be saved, or false if
the post has been saved.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post is new.

### hasChangedContent

Returns true if content includes unsaved changes, or false otherwise.

*Parameters*

 * state: Editor state.

*Returns*

Whether content includes unsaved changes.

### isEditedPostDirty

Returns true if there are unsaved values for the current edit session, or
false if the editing state matches the saved or new post.

*Parameters*

 * state: Global application state.

*Returns*

Whether unsaved values exist.

### isCleanNewPost

Returns true if there are no unsaved values for the current edit session and
if the currently edited post is new (has never been saved before).

*Parameters*

 * state: Global application state.

*Returns*

Whether new post and unsaved values exist.

### getCurrentPost

Returns the post currently being edited in its last known saved state, not
including unsaved edits. Returns an object containing relevant default post
values if the post has not yet been saved.

*Parameters*

 * state: Global application state.

*Returns*

Post object.

### getCurrentPostType

Returns the post type of the post currently being edited.

*Parameters*

 * state: Global application state.

*Returns*

Post type.

### getCurrentPostId

Returns the ID of the post currently being edited, or null if the post has
not yet been saved.

*Parameters*

 * state: Global application state.

*Returns*

ID of current post.

### getCurrentPostRevisionsCount

Returns the number of revisions of the post currently being edited.

*Parameters*

 * state: Global application state.

*Returns*

Number of revisions.

### getCurrentPostLastRevisionId

Returns the last revision ID of the post currently being edited,
or null if the post has no revisions.

*Parameters*

 * state: Global application state.

*Returns*

ID of the last revision.

### getPostEdits

Returns any post values which have been changed in the editor but not yet
been saved.

*Parameters*

 * state: Global application state.

*Returns*

Object of key value pairs comprising unsaved edits.

### getReferenceByDistinctEdits

Returns a new reference when edited values have changed. This is useful in
inferring where an edit has been made between states by comparison of the
return values using strict equality.

*Parameters*

 * state: Editor state.

*Returns*

A value whose reference will change only when an edit occurs.

### getCurrentPostAttribute

Returns an attribute value of the saved post.

*Parameters*

 * state: Global application state.
 * attributeName: Post attribute name.

*Returns*

Post attribute value.

### getEditedPostAttribute

Returns a single attribute of the post being edited, preferring the unsaved
edit if one exists, but falling back to the attribute for the last known
saved state of the post.

*Parameters*

 * state: Global application state.
 * attributeName: Post attribute name.

*Returns*

Post attribute value.

### getAutosaveAttribute (deprecated)

Returns an attribute value of the current autosave revision for a post, or
null if there is no autosave for the post.

*Deprecated*

Deprecated since 5.6. Callers should use the `getAutosave( postType, postId, userId )` selector
			   from the '@wordpress/core-data' package and access properties on the returned
			   autosave object using getPostRawValue.

*Parameters*

 * state: Global application state.
 * attributeName: Autosave attribute name.

*Returns*

Autosave attribute value.

### getEditedPostVisibility

Returns the current visibility of the post being edited, preferring the
unsaved value if different than the saved post. The return value is one of
"private", "password", or "public".

*Parameters*

 * state: Global application state.

*Returns*

Post visibility.

### isCurrentPostPending

Returns true if post is pending review.

*Parameters*

 * state: Global application state.

*Returns*

Whether current post is pending review.

### isCurrentPostPublished

Return true if the current post has already been published.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post has been published.

### isCurrentPostScheduled

Returns true if post is already scheduled.

*Parameters*

 * state: Global application state.

*Returns*

Whether current post is scheduled to be posted.

### isEditedPostPublishable

Return true if the post being edited can be published.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post can been published.

### isEditedPostSaveable

Returns true if the post can be saved, or false otherwise. A post must
contain a title, an excerpt, or non-empty content to be valid for save.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post can be saved.

### isEditedPostEmpty

Returns true if the edited post has content. A post has content if it has at
least one saveable block or otherwise has a non-empty content property
assigned.

*Parameters*

 * state: Global application state.

*Returns*

Whether post has content.

### isEditedPostAutosaveable

Returns true if the post can be autosaved, or false otherwise.

*Parameters*

 * state: Global application state.
 * autosave: A raw autosave object from the REST API.

*Returns*

Whether the post can be autosaved.

### getAutosave (deprecated)

Returns the current autosave, or null if one is not set (i.e. if the post
has yet to be autosaved, or has been saved or published since the last
autosave).

*Deprecated*

Deprecated since 5.6. Callers should use the `getAutosave( postType, postId, userId )`
			   selector from the '@wordpress/core-data' package.

*Parameters*

 * state: Editor state.

*Returns*

Current autosave, if exists.

### hasAutosave (deprecated)

Returns the true if there is an existing autosave, otherwise false.

*Deprecated*

Deprecated since 5.6. Callers should use the `getAutosave( postType, postId, userId )` selector
            from the '@wordpress/core-data' package and check for a truthy value.

*Parameters*

 * state: Global application state.

*Returns*

Whether there is an existing autosave.

### isEditedPostBeingScheduled

Return true if the post being edited is being scheduled. Preferring the
unsaved status values.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post has been published.

### isEditedPostDateFloating

Returns whether the current post should be considered to have a "floating"
date (i.e. that it would publish "Immediately" rather than at a set time).

Unlike in the PHP backend, the REST API returns a full date string for posts
where the 0000-00-00T00:00:00 placeholder is present in the database. To
infer that a post is set to publish "Immediately" we check whether the date
and modified date are the same.

*Parameters*

 * state: Editor state.

*Returns*

Whether the edited post has a floating date value.

### isSavingPost

Returns true if the post is currently being saved, or false otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether post is being saved.

### didPostSaveRequestSucceed

Returns true if a previous post save was attempted successfully, or false
otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post was saved successfully.

### didPostSaveRequestFail

Returns true if a previous post save was attempted but failed, or false
otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post save failed.

### isAutosavingPost

Returns true if the post is autosaving, or false otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post is autosaving.

### isPreviewingPost

Returns true if the post is being previewed, or false otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether the post is being previewed.

### getEditedPostPreviewLink

Returns the post preview link

*Parameters*

 * state: Global application state.

*Returns*

Preview Link.

### getSuggestedPostFormat

Returns a suggested post format for the current post, inferred only if there
is a single block within the post and it is of a type known to match a
default post format. Returns null if the format cannot be determined.

*Parameters*

 * state: Global application state.

*Returns*

Suggested post format.

### getBlocksForSerialization

Returns a set of blocks which are to be used in consideration of the post's
generated save content.

*Parameters*

 * state: Editor state.

*Returns*

Filtered set of blocks for save.

### getEditedPostContent

Returns the content of the post being edited, preferring raw string edit
before falling back to serialization of block state.

*Parameters*

 * state: Global application state.

*Returns*

Post content.

### getStateBeforeOptimisticTransaction

Returns state object prior to a specified optimist transaction ID, or `null`
if the transaction corresponding to the given ID cannot be found.

*Parameters*

 * state: Current global application state.
 * transactionId: Optimist transaction ID.

*Returns*

Global application state prior to transaction.

### isPublishingPost

Returns true if the post is being published, or false otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether post is being published.

### isPermalinkEditable

Returns whether the permalink is editable or not.

*Parameters*

 * state: Editor state.

*Returns*

Whether or not the permalink is editable.

### getPermalink

Returns the permalink for the post.

*Parameters*

 * state: Editor state.

*Returns*

The permalink, or null if the post is not viewable.

### getPermalinkParts

Returns the permalink for a post, split into it's three parts: the prefix,
the postName, and the suffix.

*Parameters*

 * state: Editor state.

*Returns*

An object containing the prefix, postName, and suffix for
                 the permalink, or null if the post is not viewable.

### inSomeHistory

Returns true if an optimistic transaction is pending commit, for which the
before state satisfies the given predicate function.

*Parameters*

 * state: Editor state.
 * predicate: Function given state, returning true if match.

*Returns*

Whether predicate matches for some history.

### isPostLocked

Returns whether the post is locked.

*Parameters*

 * state: Global application state.

*Returns*

Is locked.

### isPostSavingLocked

Returns whether post saving is locked.

*Parameters*

 * state: Global application state.

*Returns*

Is locked.

### isPostLockTakeover

Returns whether the edition of the post has been taken over.

*Parameters*

 * state: Global application state.

*Returns*

Is post lock takeover.

### getPostLockUser

Returns details about the post lock user.

*Parameters*

 * state: Global application state.

*Returns*

A user object.

### getActivePostLock

Returns the active post lock.

*Parameters*

 * state: Global application state.

*Returns*

The lock object.

### canUserUseUnfilteredHTML

Returns whether or not the user has the unfiltered_html capability.

*Parameters*

 * state: Editor state.

*Returns*

Whether the user can or can't post unfiltered HTML.

### isPublishSidebarEnabled

Returns whether the pre-publish panel should be shown
or skipped when the user clicks the "publish" button.

*Parameters*

 * state: Global application state.

*Returns*

Whether the pre-publish panel should be shown or not.

### getEditorBlocks

Return the current block list.

*Parameters*

 * state: null

*Returns*

Block list.

### getEditorSettings

Returns the post editor settings.

*Parameters*

 * state: Editor state.

*Returns*

The editor settings object.

## Actions

### setupEditor

Returns an action generator used in signalling that editor has initialized with
the specified post object and editor settings.

*Parameters*

 * post: Post object.
 * edits: Initial edited attributes object.
 * template: Block Template.

### resetPost

Returns an action object used in signalling that the latest version of the
post has been received, either by initialization or save.

*Parameters*

 * post: Post object.

### resetAutosave (deprecated)

Returns an action object used in signalling that the latest autosave of the
post has been received, by initialization or autosave.

*Deprecated*

Deprecated since 5.6. Callers should use the `receiveAutosaves( postId, autosave )`
			   selector from the '@wordpress/core-data' package.

*Parameters*

 * newAutosave: Autosave post object.

### updatePost

Returns an action object used in signalling that a patch of updates for the
latest version of the post have been received.

*Parameters*

 * edits: Updated post fields.

### setupEditorState

Returns an action object used to setup the editor state when first opening
an editor.

*Parameters*

 * post: Post object.

### editPost

Returns an action object used in signalling that attributes of the post have
been edited.

*Parameters*

 * edits: Post attributes to edit.

### savePost

Action generator for saving the current post in the editor.

*Parameters*

 * options: null

### refreshPost

Action generator for handling refreshing the current post.

### trashPost

Action generator for trashing the current post in the editor.

### autosave

Action generator used in signalling that the post should autosave.

*Parameters*

 * options: Extra flags to identify the autosave.

### redo

Returns an action object used in signalling that undo history should
restore last popped state.

### undo

Returns an action object used in signalling that undo history should pop.

### createUndoLevel

Returns an action object used in signalling that undo history record should
be created.

### updatePostLock

Returns an action object used to lock the editor.

*Parameters*

 * lock: Details about the post lock status, user, and nonce.

### enablePublishSidebar

Returns an action object used in signalling that the user has enabled the
publish sidebar.

### disablePublishSidebar

Returns an action object used in signalling that the user has disabled the
publish sidebar.

### lockPostSaving

Returns an action object used to signal that post saving is locked.

*Parameters*

 * lockName: The lock name.

### unlockPostSaving

Returns an action object used to signal that post saving is unlocked.

*Parameters*

 * lockName: The lock name.

### resetEditorBlocks

Returns an action object used to signal that the blocks have been updated.

*Parameters*

 * blocks: Block Array.
 * options: Optional options.

### updateEditorSettings

Returns an action object used in signalling that the post editor settings have been updated.

*Parameters*

 * settings: Updated settings