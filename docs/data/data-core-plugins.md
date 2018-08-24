# **core/plugins**: The Plugins Data

## Selectors

### isPluginItemPinned

Returns true if the plugin item is pinned.
When the value is not set it defaults to true.

*Parameters*

 * state: Global application state.
 * itemName: Item name.

## Actions

### togglePinnedPluginItem

Returns an action object used to toggle a plugin item flag.

*Parameters*

 * itemName: Item name.