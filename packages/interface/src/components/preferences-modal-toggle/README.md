# PreferencesModalToggle components

`PreferencesModalToggle` and `PreferencesModalFeatureToggle` can be used to implement toggles in the preferences modal (see the `PreferencesModal` component in this package).

# PreferencesModalToggle

`PreferencesModalToggle` can be used to implement a toggle with a custom behavior. It should be implemented as a controlled component with the `isChecked` and `onChange` props used to control the value of the toggle.

## Props

### isChecked

The value for the toggle.

-   Type: `boolean`
-   Required: Yes

### onChange

A function that is triggered when the control is toggled by the user. The function receives the boolean value of the control as an argument. Use this prop to update the value of the `isChecked` state that is used to control the component.

-   Type: `function`
-   Required: Yes

### label

The visible label of the toggle.

-   Type: `String`
-   Required: Yes

### help

Additional visible text that can be used to provide the user with more information about the toggle.

-   Type: `String`
-   Required: No

# PreferencesModalFeatureToggle

`PreferencesModalFeatureToggle` is similar to `PreferencesModalToggle`, but should not be implemented as a controlled component. Instead, pass `scope` and `feature` props to the component at render time, and this component will connect to the `interface` package's store and modify a 'feature' value.

### scope

The 'scope' of the feature. This is usually a namespaced string that represents the name of the editor (e.g. 'core/edit-post'), and often matches the name of the store for the editor.

-   Type: `String`
-   Required: Yes

### feature

The name of the feature to toggle (e.g. 'fixedToolbar').

-   Type: `String`
-   Required: Yes


### label

The visible label of the toggle.

-   Type: `String`
-   Required: Yes

### help

Additional visible text that can be used to provide the user with more information about the toggle.

-   Type: `String`
-   Required: No
