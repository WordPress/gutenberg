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

### isEditorPanelEnabled

Returns true if the given panel is enabled, or false otherwise. Panels are
enabled by default.

*Parameters*

 * state: Global application state.
 * panelName: A string that identifies the panel.

*Returns*

Whether or not the panel is enabled.

### isEditorSidebarPanelOpened

Returns true if the given panel is enabled, or false otherwise. Panels are
enabled by default.

*Parameters*

 * state: Global application state.
 * panel: A string that identifies the panel.

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

### getMetaBoxes

Returns the state of legacy meta boxes.

*Parameters*

 * state: Global application state.

*Returns*

State of meta boxes.

### getActiveMetaBoxLocations

Returns an array of active meta box locations.

*Parameters*

 * state: Post editor state.

*Returns*

Active meta box locations.

### isMetaBoxLocationActive

Returns true if there is an active meta box in the given location, or false
otherwise.

*Parameters*

 * state: Post editor state.
 * location: Meta box location to test.

*Returns*

Whether the meta box location is active.

### getMetaBox

Returns the state of legacy meta boxes.

*Parameters*

 * state: Global application state.
 * location: Location of the meta box.

*Returns*

State of meta box at specified location.

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

Returns an action object used in signalling that the user opened an editor sidebar.

*Parameters*

 * name: A string that uniquely identifies the modal.

### closeModal

Returns an action object signalling that the user closed the sidebar.

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

### toggleGeneralSidebarEditorPanel

Returns an action object used to open or close a panel in the editor.

*Parameters*

 * panelName: A string that identifies the panel to open or close.

### toggleFeature

Returns an action object used to toggle a feature flag.

*Parameters*

 * feature: Feature name.

### togglePinnedPluginItem

Returns an action object used to toggle a plugin name flag.

*Parameters*

 * pluginName: Plugin name.

### initializeMetaBoxState

Returns an action object used to check the state of meta boxes at a location.

This should only be fired once to initialize meta box state. If a meta box
area is empty, this will set the store state to indicate that React should
not render the meta box area.

Example: metaBoxes = { side: true, normal: false }.

This indicates that the sidebar has a meta box but the normal area does not.

*Parameters*

 * metaBoxes: Whether meta box locations are active.

### setActiveMetaBoxLocations

Returns an action object used in signaling that the active meta box
locations have changed.

*Parameters*

 * locations: New active meta box locations.

### requestMetaBoxUpdates

Returns an action object used to request meta box update.

### metaBoxUpdatesSuccess

Returns an action object used signal a successful meta box update.

### setMetaBoxSavedData

Returns an action object used to set the saved meta boxes data.
This is used to check if the meta boxes have been touched when leaving the editor.

*Parameters*

 * dataPerLocation: Meta Boxes Data per location.