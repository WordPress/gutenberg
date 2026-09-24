# BlockSettingsMenu

This is a menu that allows the user to act on the block (duplicate, remove, etc).

# BlockSettingsDropdown

This is the dropdown itself, it covers the bulk of the logic of this component.

## Props

`__experimentalSelectBlock` - A callback. If passed, interacting with dropdown options (such as duplicate) will not update the
editor selection. Instead, every time a selection change should happen the callback will be called with a proper clientId.
