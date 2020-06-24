# Panel

Panels expand and collapse multiple sections of content.

![](https://make.wordpress.org/design/files/2019/03/panel.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

### Anatomy

A Panel is a single section of content that can be expanded or collapsed as needed.

![Panel anatomy](https://make.wordpress.org/design/files/2019/03/panel-anatomy.png)

1. Panel
2. Body
3. Divider

### Usage

Panels show and hide details of list items by expanding and collapsing list content vertically. Panels help users see only the content they need.

#### When to use Panels

Use Panels when it’s helpful to:

-   See an overview of multiple, related sections of content.
-   Show and hide those sections as needed.
-   Hide information that is lower priority that users don’t need to see all the time.
-   View more than one section at a time.

Consider an alternative component when:

-   There’s crucial information or error messages that require immediate action.
-   You need to quickly switch between only a few sections (consider using Tabs instead).

### Behavior

#### Expand and collapse

Show and hide details of existing panel items by expanding and collapsing list content vertically.

![](https://make.wordpress.org/design/files/2019/03/panel-expand.gif)

Collapsible panels are indicated with a caret icon that is flipped when expanded. Carets are preferable over a plus or arrow icon, because a plus indicates addition, and arrows are closely related to navigation.

Panels should be expanded by default if the content is important or essential. Panels that are open by default should appear at the top.

## Development guidelines

The `Panel` creates a container with a header that can take collapsible `PanelBody` components to easily create a user friendly interface for affecting state and attributes.

### Usage

```jsx
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { more } from '@wordpress/icons';

const MyPanel = () => (
	<Panel header="My Panel">
		<PanelBody title="My Block Settings" icon={ more } initialOpen={ true }>
			<PanelRow>My Panel Inputs and Labels</PanelRow>
		</PanelBody>
	</Panel>
);
```

### Sub-Components

#### Panel

##### Props

###### className

The class that will be added with `components-panel`. If no `className` is passed only `components-panel__body` and `is-opened` is used.

-   Type: `String`
-   Required: No

###### header

Title of the `Panel`. Text will be rendered inside an `<h2>` tag.

-   Type: `String`
-   Required: No

---

#### PanelBody

The `PanelBody` creates a collapsible container that can be toggled open or closed.

##### Props

###### title

Title of the `PanelBody`. This shows even when it is closed.

-   Type: `String`
-   Required: No

###### opened

If opened is true then the `Panel` will remain open regardless of the `initialOpen` prop and the panel will be prevented from being closed.

-   Type: `Boolean`
-   Required: No

###### className

The class that will be added with `components-panel__body`, if the panel is currently open, the `is-opened` class will also be passed to the classes of the wrapper div. If no `className` is passed then only `components-panel__body` and `is-opened` is used.

-   Type: `String`
-   Required: No

###### icon

An icon to be shown next to the `PanelBody` title.

-   Type: `String`
-   Required: No

###### onToggle

A function that is called when the user clicks on the `PanelBody` title after the open state is changed.

-   Type: `function`
-   Required: No

###### initialOpen

Whether or not the panel will start open.

-   Type: `Boolean`
-   Required: No
-   Default: true

---

#### PanelRow

The is a generic container for panel content. Default styles add a top margin and arrange items in a flex row.

##### Props

###### className

The class that will be added with `components-panel__row`. to the classes of the wrapper div. If no `className` is passed only `components-panel__row` is used.

-   Type: `String`
-   Required: No

---

#### PanelHeader

This is a simple container for a header component. This is used by the `Panel` component under the hood, so it does not typically need to be used.

##### Props

###### label

The text that will be rendered as the title of the `Panel`. Will be rendered in an `<h2>` tag.

-   Type: `String`
-   Required: No

## Related components

-   To divide related sections of content accessed by a horizontal menu, use `TabPanel`
