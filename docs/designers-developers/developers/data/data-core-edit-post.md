# **core/edit-post**: The Editor’s UI Data

## Selectors

### getEditorMode

Returns the current editing mode.

*Parameters*

 * state: Global application state.

### isEditorSidebarOpened

Returns true if the editor sidebar is opened.

*Parameters*

 * state: Global application state

*Returns*

Whether the editor sidebar is opened.

### isPluginSidebarOpened

Returns true if the plugin sidebar is opened.

*Parameters*

 * state: Global application state

*Returns*

Whether the plugin sidebar is opened.

### getActiveGeneralSidebarName

Returns the current active general sidebar name, or null if there is no
general sidebar active. The active general sidebar is a unique name to
identify either an editor or plugin sidebar.

Examples:

 - `edit-post/document`
 - `my-plugin/insert-image-sidebar`

*Parameters*

 * state: Global application state.

*Returns*

Active general sidebar name.

### getPreferences

Returns the preferences (these preferences are persisted locally).

*Parameters*

 * state: Global application state.

*Returns*

Preferences Object.

### getPreference

*Parameters*

 * state: Global application state.
 * preferenceKey: Preference Key.
 * defaultValue: Default Value.

*Returns*

Preference Value.

### isPublishSidebarOpened

Returns true if the publish sidebar is opened.

*Parameters*

 * state: Global application state

*Returns*

Whether the publish sidebar is open.

### isEditorPanelRemoved

Returns true if the given panel was programmatically removed, or false otherwise.
All panels are not removed by default.

*Parameters*

 * state: Global application state.
 * panelName: A string that identifies the panel.

*Returns*

Whether or not the panel is removed.

### isEditorPanelEnabled

Returns true if the given panel is enabled, or false otherwise. Panels are
enabled by default.

*Parameters*

 * state: Global application state.
 * panelName: A string that identifies the panel.

*Returns*

Whether or not the panel is enabled.

### isEditorPanelOpened

Returns true if the given panel is open, or false otherwise. Panels are
closed by default.

*Parameters*

 * state: Global application state.
 * panelName: A string that identifies the panel.

*Returns*

Whether or not the panel is open.

### isModalActive

Returns true if a modal is active, or false otherwise.

*Parameters*

 * state: Global application state.
 * modalName: A string that uniquely identifies the modal.

*Returns*

Whether the modal is active.

### isFeatureActive

Returns whether the given feature is enabled or not.

*Parameters*

 * state: Global application state.
 * feature: Feature slug.

*Returns*

Is active.

### isPluginItemPinned

Returns true if the plugin item is pinned to the header.
When the value is not set it defaults to true.

*Parameters*

 * state: Global application state.
 * pluginName: Plugin item name.

*Returns*

Whether the plugin item is pinned.

### getActiveMetaBoxLocations

Returns an array of active meta box locations.

*Parameters*

 * state: Post editor state.

*Returns*

Active meta box locations.

### isMetaBoxLocationVisible

Returns true if a metabox location is active and visible

*Parameters*

 * state: Post editor state.
 * location: Meta box location to test.

*Returns*

Whether the meta box location is active and visible.

### isMetaBoxLocationActive

Returns true if there is an active meta box in the given location, or false
otherwise.

*Parameters*

 * state: Post editor state.
 * location: Meta box location to test.

*Returns*

Whether the meta box location is active.

### getMetaBoxesPerLocation

Returns the list of all the available meta boxes for a given location.

*Parameters*

 * state: Global application state.
 * location: Meta box location to test.

*Returns*

List of meta boxes.

### getAllMetaBoxes

Returns the list of all the available meta boxes.

*Parameters*

 * state: Global application state.

*Returns*

List of meta boxes.

### hasMetaBoxes

Returns true if the post is using Meta Boxes

*Parameters*

 * state: Global application state

*Returns*

Whether there are metaboxes or not.

### isSavingMetaBoxes

Returns true if the Meta Boxes are being saved.

*Parameters*

 * state: Global application state.

*Returns*

Whether the metaboxes are being saved.

## Actions

### openGeneralSidebar

Returns an action object used in signalling that the user opened an editor sidebar.

*Parameters*

 * name: Sidebar name to be opened.

### closeGeneralSidebar

Returns an action object signalling that the user closed the sidebar.

### openModal

Returns an action object used in signalling that the user opened a modal.

*Parameters*

 * name: A string that uniquely identifies the modal.

### closeModal

Returns an action object signalling that the user closed a modal.

### openPublishSidebar

Returns an action object used in signalling that the user opened the publish
sidebar.

### closePublishSidebar

Returns an action object used in signalling that the user closed the
publish sidebar.

### togglePublishSidebar

Returns an action object used in signalling that the user toggles the publish sidebar.

### toggleEditorPanelEnabled

Returns an action object used to enable or disable a panel in the editor.

*Parameters*

 * panelName: A string that identifies the panel to enable or disable.

### toggleEditorPanelOpened

Returns an action object used to open or close a panel in the editor.

*Parameters*

 * panelName: A string that identifies the panel to open or close.

### removeEditorPanel

Returns an action object used to remove a panel from the editor.

*Parameters*

 * panelName: A string that identifies the panel to remove.

### toggleFeature

Returns an action object used to toggle a feature flag.

*Parameters*

 * feature: Feature name.

### togglePinnedPluginItem

Returns an action object used to toggle a plugin name flag.

*Parameters*

 * pluginName: Plugin name.

### hideBlockTypes

Returns an action object used in signalling that block types by the given
name(s) should be hidden.

*Parameters*

 * blockNames: Names of block types to hide.

### showBlockTypes

Returns an action object used in signalling that block types by the given
name(s) should be shown.

*Parameters*

 * blockNames: Names of block types to show.

### setAvailableMetaBoxesPerLocation

Returns an action object used in signaling
what Meta boxes are available in which location.

*Parameters*

 * metaBoxesPerLocation: Meta boxes per location.

### requestMetaBoxUpdates

Returns an action object used to request meta box update.

### metaBoxUpdatesSuccess

Returns an action object used signal a successful meta box update.

### __unstableInitialize

Returns an action generator used to initialize some subscriptions for the
post editor:

- subscription for toggling the `edit-post/block` general sidebar when a
  block is selected.
- subscription for hiding/showing the sidebar depending on size of viewport.
- subscription for updating the "View Post" link in the admin bar when
  permalink is updated.