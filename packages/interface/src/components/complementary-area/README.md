# ComplementaryArea

`ComplementaryArea` is a component to render complementary areas like sidebars. Its implementation is based on slot & fill.
Multiple areas may be added in a given time, but only one is visible; the component renders the required artifacts to control which area is visible. The component allows, for example, to have multiple plugins rendering their sidebars, the user only sees one of the sidebars, but can switch which sidebar is active.

The contents passed to ComplementaryArea are rendered in the ComplementaryArea.Slot corresponding to their scope if the complementary area is enabled.

Besides rendering the complementary area, the component renders a button in `PinnedItems` that allows opening the complementary area. The button only appears if the complementary is marked as favorite. By default, the complementary area headers rendered contain a button to mark and unmark areas as favorites.

## Props

### children

The content to be displayed within the complementary area.

-   Type: `Element`
-   Required: Yes

### closeLabel

Label of the button that allows to close the complementary area.

-   Type: `String`
-   Required: No
-   Default: "Close plugin"

### identifier

Identifier of the complementary area. The string is saved on the store and allows to identify which of the sidebars is active.

-   Type: `String`
-   Required: No
-   Default: Concatenation of `name` of the plugin extracted from the context (when available) with the "name" of the sidebar passed as a property.

### header

In cases where a custom header is desirable, the prop could be used. It can contain the contents that should be drawn on the header.

-   Type: `Element`
-   Required: No

### headerClassName

A className passed to the header container.

-   Type: `String`
-   Required: No

### icon

The icon to render.

-   Type: `Function|Component|null`
-   Required: No
-   Default: `null`

### isPinnable

Whether to allow to pin sidebar to the toolbar. When set to `true` it also automatically renders a corresponding menu item.

-   Type: `boolean`
-   Required: No
-   Default: `true`

### name

Name of the complementary area. The name of the complementarity area is concatenated with the name of the plugin to form the identifier of the complementary area. The name of the plugin is extracted from the plugin context where the sidebar is rendered. If there is no plugin context available or there is a need to specify a custom identifier, please use the `identifier` property instead.

-   Type: `String`
-   Required: No

### panelClassName

A className passed to the panel that contains the contents of the sidebar.

-   Type: `String`
-   Required: No
-   Default: `null`

### scope

The scope of the complementary area e.g: "core", "myplugin/custom-screen-a",

-   Type: `String`
-   Required: Yes

### title

Human friendly title of the complementary area.

-   Type: `String`
-   Required: Yes

### toggleShortcut

Keyboard shortcut that allows opening and closing the area. Passed to the button that allows the same action, so the user sees a visual indication that there is a keyboard shortcut.

-   Type: `String|Object`
-   Required: No

# ComplementaryArea.Slot

A slot that renders the currently active ComplementaryArea.

## Props

### scope

The scope of the complementary area e.g: "core", "myplugin/custom-screen-a",

-   Type: `String`
-   Required: Yes
