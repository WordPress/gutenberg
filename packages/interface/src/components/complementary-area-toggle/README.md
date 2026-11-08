# ComplementaryAreaToggle

`ComplementaryArea.Toggle` is a component used to render a UI allowing the toggle (open/close) a complementary area.

## Props

### scope

The scope of the complementary area e.g: "core", "myplugin/custom-screen-a",

-   Type: `String`
-   Required: Yes

### identifier

Identifier of the complementary area.

-   Type: `String`
-   Required: No
-   Default: Concatenation of `name` of the plugin extracted from the context (when available) with the "name" of the sidebar passed as a property.

### name

Name of the complementary area. The name of the complementarity area is concatenated with the name of the plugin to form the identifier of the complementary area. The name of the plugin is extracted from the plugin context where the sidebar is rendered. If there is no plugin context available or there is a need to specify a custom identifier, please use the `identifier` property instead.

-   Type: `String`
-   Required: No

### selectedIcon

An icon to use when the complementary area is open e.g: a check mark.
If the prop is not passed the icon of the complementary area or of the plugin is used.

-   Type: `Element`
-   Required: no

### as

A component used to render the toggle.
Defaults to and `Button` can be changed to `MenuItem`or a custom component for example.

-   Type: `Component`
-   Required: no
