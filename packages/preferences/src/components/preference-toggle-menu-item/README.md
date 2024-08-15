# PreferenceToggleMenuItem

`PreferenceToggleMenuItem` renders a menu item that is connected to the preference package's store, and will toggle the value of a 'preference' between true and false.

This component implements a `MenuItem` component from the `@wordpress/components` package.

## Props

### scope

The 'scope' of the feature. This is usually a namespaced string that represents the name of the editor (e.g. 'core/edit-post'), and often matches the name of the store for the editor.

-   Type: `String`
-   Required: Yes

### name

The name of the preference to toggle (e.g. 'fixedToolbar').

-   Type: `String`
-   Required: Yes

### label

A human readable label for the feature.

-   Type: `String`
-   Required: Yes

### info

A human readable description of what this toggle does.

-   Type: `Object`
-   Required: No

### messageActivated

A message read by a screen reader when the feature is activated. (e.g. 'Fixed toolbar activated')

-   Type: `String`
-   Required: No

### messageDeactivated

A message read by a screen reader when the feature is deactivated. (e.g. 'Fixed toolbar deactivated')

-   Type: `String`
-   Required: No

### shortcut

A keyboard shortcut for the feature. This is just used for display purposes and the implementation of the shortcut should be handled separately.

Consider using the `displayShortcut` helper from the `@wordpress/keycodes` package for this prop.

-   Type: `Array`
-   Required: No
