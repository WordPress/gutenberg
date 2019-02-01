# **core/editor**: The Editor’s Data

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

### getAutosaveAttribute

Returns an attribute value of the current autosave revision for a post, or
null if there is no autosave for the post.

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

*Returns*

Whether the post can be autosaved.

### getAutosave

Returns the current autosave, or null if one is not set (i.e. if the post
has yet to be autosaved, or has been saved or published since the last
autosave).

*Parameters*

 * state: Editor state.

*Returns*

Current autosave, if exists.

### hasAutosave

Returns the true if there is an existing autosave, otherwise false.

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

### getBlockDependantsCacheBust

Returns a new reference when the inner blocks of a given block client ID
change. This is used exclusively as a memoized selector dependant, relying
on this selector's shared return value and recursively those of its inner
blocks defined as dependencies. This abuses mechanics of the selector
memoization to return from the original selector function only when
dependants change.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

A value whose reference will change only when inner blocks of
            the given block client ID change.

### getBlockName

Returns a block's name given its client ID, or null if no block exists with
the client ID.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Block name.

### isBlockValid

Returns whether a block is valid or not.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Is Valid.

### getBlockAttributes

Returns a block's attributes given its client ID, or null if no block exists with
the client ID.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Block attributes.

### getBlock

Returns a block given its client ID. This is a parsed copy of the block,
containing its `blockName`, `clientId`, and current `attributes` state. This
is not the block's registration settings, which must be retrieved from the
blocks module registration store.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Parsed block object.

### getBlocks

Returns all block objects for the current post being edited as an array in
the order they appear in the post.

Note: It's important to memoize this selector to avoid return a new instance
on each call

*Parameters*

 * state: Editor state.
 * rootClientId: Optional root client ID of block list.

*Returns*

Post blocks.

### getClientIdsOfDescendants

Returns an array containing the clientIds of all descendants
of the blocks given.

*Parameters*

 * state: Global application state.
 * clientIds: Array of blocks to inspect.

*Returns*

ids of descendants.

### getClientIdsWithDescendants

Returns an array containing the clientIds of the top-level blocks
and their descendants of any depth (for nested blocks).

*Parameters*

 * state: Global application state.

*Returns*

ids of top-level and descendant blocks.

### getGlobalBlockCount

Returns the total number of blocks, or the total number of blocks with a specific name in a post.
The number returned includes nested blocks.

*Parameters*

 * state: Global application state.
 * blockName: Optional block name, if specified only blocks of that type will be counted.

*Returns*

Number of blocks in the post, or number of blocks with name equal to blockName.

### getBlocksByClientId

Given an array of block client IDs, returns the corresponding array of block
objects.

*Parameters*

 * state: Editor state.
 * clientIds: Client IDs for which blocks are to be returned.

*Returns*

Block objects.

### getBlockCount

Returns the number of blocks currently present in the post.

*Parameters*

 * state: Editor state.
 * rootClientId: Optional root client ID of block list.

*Returns*

Number of blocks in the post.

### getBlockSelectionStart

Returns the current block selection start. This value may be null, and it
may represent either a singular block selection or multi-selection start.
A selection is singular if its start and end match.

*Parameters*

 * state: Global application state.

*Returns*

Client ID of block selection start.

### getBlockSelectionEnd

Returns the current block selection end. This value may be null, and it
may represent either a singular block selection or multi-selection end.
A selection is singular if its start and end match.

*Parameters*

 * state: Global application state.

*Returns*

Client ID of block selection end.

### getSelectedBlockCount

Returns the number of blocks currently selected in the post.

*Parameters*

 * state: Global application state.

*Returns*

Number of blocks selected in the post.

### hasSelectedBlock

Returns true if there is a single selected block, or false otherwise.

*Parameters*

 * state: Editor state.

*Returns*

Whether a single block is selected.

### getSelectedBlockClientId

Returns the currently selected block client ID, or null if there is no
selected block.

*Parameters*

 * state: Editor state.

*Returns*

Selected block client ID.

### getSelectedBlock

Returns the currently selected block, or null if there is no selected block.

*Parameters*

 * state: Global application state.

*Returns*

Selected block.

### getBlockRootClientId

Given a block client ID, returns the root block from which the block is
nested, an empty string for top-level blocks, or null if the block does not
exist.

*Parameters*

 * state: Editor state.
 * clientId: Block from which to find root client ID.

*Returns*

Root client ID, if exists

### getBlockHierarchyRootClientId

Given a block client ID, returns the root of the hierarchy from which the block is nested, return the block itself for root level blocks.

*Parameters*

 * state: Editor state.
 * clientId: Block from which to find root client ID.

*Returns*

Root client ID

### getAdjacentBlockClientId

Returns the client ID of the block adjacent one at the given reference
startClientId and modifier directionality. Defaults start startClientId to
the selected block, and direction as next block. Returns null if there is no
adjacent block.

*Parameters*

 * state: Editor state.
 * startClientId: Optional client ID of block from which to
                               search.
 * modifier: Directionality multiplier (1 next, -1
                               previous).

*Returns*

Return the client ID of the block, or null if none exists.

### getPreviousBlockClientId

Returns the previous block's client ID from the given reference start ID.
Defaults start to the selected block. Returns null if there is no previous
block.

*Parameters*

 * state: Editor state.
 * startClientId: Optional client ID of block from which to
                               search.

*Returns*

Adjacent block's client ID, or null if none exists.

### getNextBlockClientId

Returns the next block's client ID from the given reference start ID.
Defaults start to the selected block. Returns null if there is no next
block.

*Parameters*

 * state: Editor state.
 * startClientId: Optional client ID of block from which to
                               search.

*Returns*

Adjacent block's client ID, or null if none exists.

### getSelectedBlocksInitialCaretPosition

Returns the initial caret position for the selected block.
This position is to used to position the caret properly when the selected block changes.

*Parameters*

 * state: Global application state.

*Returns*

Selected block.

### getMultiSelectedBlockClientIds

Returns the current multi-selection set of block client IDs, or an empty
array if there is no multi-selection.

*Parameters*

 * state: Editor state.

*Returns*

Multi-selected block client IDs.

### getMultiSelectedBlocks

Returns the current multi-selection set of blocks, or an empty array if
there is no multi-selection.

*Parameters*

 * state: Editor state.

*Returns*

Multi-selected block objects.

### getFirstMultiSelectedBlockClientId

Returns the client ID of the first block in the multi-selection set, or null
if there is no multi-selection.

*Parameters*

 * state: Editor state.

*Returns*

First block client ID in the multi-selection set.

### getLastMultiSelectedBlockClientId

Returns the client ID of the last block in the multi-selection set, or null
if there is no multi-selection.

*Parameters*

 * state: Editor state.

*Returns*

Last block client ID in the multi-selection set.

### isFirstMultiSelectedBlock

Returns true if a multi-selection exists, and the block corresponding to the
specified client ID is the first block of the multi-selection set, or false
otherwise.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Whether block is first in multi-selection.

### isBlockMultiSelected

Returns true if the client ID occurs within the block multi-selection, or
false otherwise.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Whether block is in multi-selection set.

### isAncestorMultiSelected

Returns true if an ancestor of the block is multi-selected, or false
otherwise.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Whether an ancestor of the block is in multi-selection
                  set.

### getMultiSelectedBlocksStartClientId

Returns the client ID of the block which begins the multi-selection set, or
null if there is no multi-selection.

This is not necessarily the first client ID in the selection.

*Parameters*

 * state: Editor state.

*Returns*

Client ID of block beginning multi-selection.

### getMultiSelectedBlocksEndClientId

Returns the client ID of the block which ends the multi-selection set, or
null if there is no multi-selection.

This is not necessarily the last client ID in the selection.

*Parameters*

 * state: Editor state.

*Returns*

Client ID of block ending multi-selection.

### getBlockOrder

Returns an array containing all block client IDs in the editor in the order
they appear. Optionally accepts a root client ID of the block list for which
the order should be returned, defaulting to the top-level block order.

*Parameters*

 * state: Editor state.
 * rootClientId: Optional root client ID of block list.

*Returns*

Ordered client IDs of editor blocks.

### getBlockIndex

Returns the index at which the block corresponding to the specified client
ID occurs within the block order, or `-1` if the block does not exist.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.
 * rootClientId: Optional root client ID of block list.

*Returns*

Index at which block exists in order.

### isBlockSelected

Returns true if the block corresponding to the specified client ID is
currently selected and no multi-selection exists, or false otherwise.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Whether block is selected and multi-selection exists.

### hasSelectedInnerBlock

Returns true if one of the block's inner blocks is selected.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.
 * deep: Perform a deep check.

*Returns*

Whether the block as an inner block selected

### isBlockWithinSelection

Returns true if the block corresponding to the specified client ID is
currently selected but isn't the last of the selected blocks. Here "last"
refers to the block sequence in the document, _not_ the sequence of
multi-selection, which is why `state.blockSelection.end` isn't used.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Whether block is selected and not the last in the
                  selection.

### hasMultiSelection

Returns true if a multi-selection has been made, or false otherwise.

*Parameters*

 * state: Editor state.

*Returns*

Whether multi-selection has been made.

### isMultiSelecting

Whether in the process of multi-selecting or not. This flag is only true
while the multi-selection is being selected (by mouse move), and is false
once the multi-selection has been settled.

*Parameters*

 * state: Global application state.

*Returns*

True if multi-selecting, false if not.

### isSelectionEnabled

Selector that returns if multi-selection is enabled or not.

*Parameters*

 * state: Global application state.

*Returns*

True if it should be possible to multi-select blocks, false if multi-selection is disabled.

### getBlockMode

Returns the block's editing mode, defaulting to "visual" if not explicitly
assigned.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Block editing mode.

### isTyping

Returns true if the user is typing, or false otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether user is typing.

### isCaretWithinFormattedText

Returns true if the caret is within formatted text, or false otherwise.

*Parameters*

 * state: Global application state.

*Returns*

Whether the caret is within formatted text.

### getBlockInsertionPoint

Returns the insertion point, the index at which the new inserted block would
be placed. Defaults to the last index.

*Parameters*

 * state: Editor state.

*Returns*

Insertion point object with `rootClientId`, `index`.

### isBlockInsertionPointVisible

Returns true if we should show the block insertion point.

*Parameters*

 * state: Global application state.

*Returns*

Whether the insertion point is visible or not.

### isValidTemplate

Returns whether the blocks matches the template or not.

*Parameters*

 * state: null

*Returns*

Whether the template is valid or not.

### getTemplate

Returns the defined block template

*Parameters*

 * state: null

*Returns*

Block Template

### getTemplateLock

Returns the defined block template lock. Optionally accepts a root block
client ID as context, otherwise defaulting to the global context.

*Parameters*

 * state: Editor state.
 * rootClientId: Optional block root client ID.

*Returns*

Block Template Lock

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

### canInsertBlockType

Determines if the given block type is allowed to be inserted into the block list.

*Parameters*

 * state: Editor state.
 * blockName: The name of the block type, e.g.' core/paragraph'.
 * rootClientId: Optional root client ID of block list.

*Returns*

Whether the given block type is allowed to be inserted.

### getInserterItems

Determines the items that appear in the inserter. Includes both static
items (e.g. a regular block type) and dynamic items (e.g. a reusable block).

Each item object contains what's necessary to display a button in the
inserter and handle its selection.

The 'utility' property indicates how useful we think an item will be to the
user. There are 4 levels of utility:

1. Blocks that are contextually useful (utility = 3)
2. Blocks that have been previously inserted (utility = 2)
3. Blocks that are in the common category (utility = 1)
4. All other blocks (utility = 0)

The 'frecency' property is a heuristic (https://en.wikipedia.org/wiki/Frecency)
that combines block usage frequenty and recency.

Items are returned ordered descendingly by their 'utility' and 'frecency'.

*Parameters*

 * state: Editor state.
 * rootClientId: Optional root client ID of block list.

*Returns*

Items that appear in inserter.

### hasInserterItems

Determines whether there are items to show in the inserter.

*Parameters*

 * state: Editor state.
 * rootClientId: Optional root client ID of block list.

*Returns*

Items that appear in inserter.

### __experimentalGetReusableBlock

Returns the reusable block with the given ID.

*Parameters*

 * state: Global application state.
 * ref: The reusable block's ID.

*Returns*

The reusable block, or null if none exists.

### __experimentalIsSavingReusableBlock

Returns whether or not the reusable block with the given ID is being saved.

*Parameters*

 * state: Global application state.
 * ref: The reusable block's ID.

*Returns*

Whether or not the reusable block is being saved.

### __experimentalIsFetchingReusableBlock

Returns true if the reusable block with the given ID is being fetched, or
false otherwise.

*Parameters*

 * state: Global application state.
 * ref: The reusable block's ID.

*Returns*

Whether the reusable block is being fetched.

### __experimentalGetReusableBlocks

Returns an array of all reusable blocks.

*Parameters*

 * state: Global application state.

*Returns*

An array of all reusable blocks.

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

### getBlockListSettings

Returns the Block List settings of a block, if any exist.

*Parameters*

 * state: Editor state.
 * clientId: Block client ID.

*Returns*

Block settings of the block if set.

### getEditorSettings

Returns the editor settings.

*Parameters*

 * state: Editor state.

*Returns*

The editor settings object.

### getTokenSettings

Returns the token settings.

*Parameters*

 * state: Editor state.
 * name: Token name.

*Returns*

Token settings object, or the named token settings object if set.

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

## Actions

### setupEditor

Returns an action object used in signalling that editor has initialized with
the specified post object and editor settings.

*Parameters*

 * post: Post object.
 * edits: Initial edited attributes object.

### resetPost

Returns an action object used in signalling that the latest version of the
post has been received, either by initialization or save.

*Parameters*

 * post: Post object.

### resetAutosave

Returns an action object used in signalling that the latest autosave of the
post has been received, by initialization or autosave.

*Parameters*

 * post: Autosave post object.

### updatePost

Returns an action object used in signalling that a patch of updates for the
latest version of the post have been received.

*Parameters*

 * edits: Updated post fields.

### setupEditorState

Returns an action object used to setup the editor state when first opening an editor.

*Parameters*

 * post: Post object.
 * blocks: Array of blocks.

### resetBlocks

Returns an action object used in signalling that blocks state should be
reset to the specified array of blocks, taking precedence over any other
content reflected as an edit in state.

*Parameters*

 * blocks: Array of blocks.

### receiveBlocks

Returns an action object used in signalling that blocks have been received.
Unlike resetBlocks, these should be appended to the existing known set, not
replacing.

*Parameters*

 * blocks: Array of block objects.

### updateBlockAttributes

Returns an action object used in signalling that the block attributes with
the specified client ID has been updated.

*Parameters*

 * clientId: Block client ID.
 * attributes: Block attributes to be merged.

### updateBlock

Returns an action object used in signalling that the block with the
specified client ID has been updated.

*Parameters*

 * clientId: Block client ID.
 * updates: Block attributes to be merged.

### selectBlock

Returns an action object used in signalling that the block with the
specified client ID has been selected, optionally accepting a position
value reflecting its selection directionality. An initialPosition of -1
reflects a reverse selection.

*Parameters*

 * clientId: Block client ID.
 * initialPosition: Optional initial position. Pass as -1 to
                                 reflect reverse selection.

### toggleSelection

Returns an action object that enables or disables block selection.

*Parameters*

 * boolean: [isSelectionEnabled=true] Whether block selection should
                                           be enabled.

### replaceBlocks

Returns an action object signalling that a blocks should be replaced with
one or more replacement blocks.

*Parameters*

 * clientIds: Block client ID(s) to replace.
 * blocks: Replacement block(s).

### replaceBlock

Returns an action object signalling that a single block should be replaced
with one or more replacement blocks.

*Parameters*

 * clientId: Block client ID to replace.
 * block: Replacement block(s).

### moveBlockToPosition

Returns an action object signalling that an indexed block should be moved
to a new index.

*Parameters*

 * clientId: The client ID of the block.
 * fromRootClientId: Root client ID source.
 * toRootClientId: Root client ID destination.
 * index: The index to move the block into.

### insertBlock

Returns an action object used in signalling that a single block should be
inserted, optionally at a specific index respective a root block list.

*Parameters*

 * block: Block object to insert.
 * index: Index at which block should be inserted.
 * rootClientId: Optional root client ID of block list on which to insert.
 * updateSelection: If true block selection will be updated. If false, block selection will not change. Defaults to true.

### insertBlocks

Returns an action object used in signalling that an array of blocks should
be inserted, optionally at a specific index respective a root block list.

*Parameters*

 * blocks: Block objects to insert.
 * index: Index at which block should be inserted.
 * rootClientId: Optional root client ID of block list on which to insert.
 * updateSelection: If true block selection will be updated.  If false, block selection will not change. Defaults to true.

### showInsertionPoint

Returns an action object used in signalling that the insertion point should
be shown.

*Parameters*

 * rootClientId: Optional root client ID of block list on
                              which to insert.
 * index: Index at which block should be inserted.

### hideInsertionPoint

Returns an action object hiding the insertion point.

### setTemplateValidity

Returns an action object resetting the template validity.

*Parameters*

 * isValid: template validity flag.

### synchronizeTemplate

Returns an action object synchronize the template with the list of blocks

### editPost

Returns an action object used in signalling that attributes of the post have
been edited.

*Parameters*

 * edits: Post attributes to edit.

### savePost

Returns an action object to save the post.

*Parameters*

 * options: Options for the save.
 * options.isAutosave: Perform an autosave if true.

### mergeBlocks

Returns an action object used in signalling that two blocks should be merged

*Parameters*

 * firstBlockClientId: Client ID of the first block to merge.
 * secondBlockClientId: Client ID of the second block to merge.

### autosave

Returns an action object used in signalling that the post should autosave.

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

### removeBlocks

Returns an action object used in signalling that the blocks corresponding to
the set of specified client IDs are to be removed.

*Parameters*

 * clientIds: Client IDs of blocks to remove.
 * selectPrevious: True if the previous block should be
                                        selected when a block is removed.

### removeBlock

Returns an action object used in signalling that the block with the
specified client ID is to be removed.

*Parameters*

 * clientId: Client ID of block to remove.
 * selectPrevious: True if the previous block should be
                                selected when a block is removed.

### toggleBlockMode

Returns an action object used to toggle the block editing mode between
visual and HTML modes.

*Parameters*

 * clientId: Block client ID.

### startTyping

Returns an action object used in signalling that the user has begun to type.

### stopTyping

Returns an action object used in signalling that the user has stopped typing.

### enterFormattedText

Returns an action object used in signalling that the caret has entered formatted text.

### exitFormattedText

Returns an action object used in signalling that the user caret has exited formatted text.

### updatePostLock

Returns an action object used to lock the editor.

*Parameters*

 * lock: Details about the post lock status, user, and nonce.

### __experimentalFetchReusableBlocks

Returns an action object used to fetch a single reusable block or all
reusable blocks from the REST API into the store.

*Parameters*

 * id: If given, only a single reusable block with this ID will
                    be fetched.

### __experimentalReceiveReusableBlocks

Returns an action object used in signalling that reusable blocks have been
received. `results` is an array of objects containing:
 - `reusableBlock` - Details about how the reusable block is persisted.
 - `parsedBlock` - The original block.

*Parameters*

 * results: Reusable blocks received.

### __experimentalSaveReusableBlock

Returns an action object used to save a reusable block that's in the store to
the REST API.

*Parameters*

 * id: The ID of the reusable block to save.

### __experimentalDeleteReusableBlock

Returns an action object used to delete a reusable block via the REST API.

*Parameters*

 * id: The ID of the reusable block to delete.

### __experimentalUpdateReusableBlockTitle

Returns an action object used in signalling that a reusable block's title is
to be updated.

*Parameters*

 * id: The ID of the reusable block to update.
 * title: The new title.

### __experimentalConvertBlockToStatic

Returns an action object used to convert a reusable block into a static block.

*Parameters*

 * clientId: The client ID of the block to attach.

### __experimentalConvertBlockToReusable

Returns an action object used to convert a static block into a reusable block.

*Parameters*

 * clientIds: The client IDs of the block to detach.

### insertDefaultBlock

Returns an action object used in signalling that a new block of the default
type should be added to the block list.

*Parameters*

 * attributes: Optional attributes of the block to assign.
 * rootClientId: Optional root client ID of block list on which
                              to append.
 * index: Optional index where to insert the default block

### updateBlockListSettings

Returns an action object that changes the nested settings of a given block.

*Parameters*

 * clientId: Client ID of the block whose nested setting are
                         being received.
 * settings: Object with the new settings for the nested block.

### updateEditorSettings

Returns an action object used in signalling that the editor settings have been updated.

*Parameters*

 * settings: Updated settings

### enablePublishSidebar

Returns an action object used in signalling that the user has enabled the publish sidebar.

### disablePublishSidebar

Returns an action object used in signalling that the user has disabled the publish sidebar.

### lockPostSaving

Returns an action object used to signal that post saving is locked.

*Parameters*

 * lockName: The lock name.

### unlockPostSaving

Returns an action object used to signal that post saving is unlocked.

*Parameters*

 * lockName: The lock name.