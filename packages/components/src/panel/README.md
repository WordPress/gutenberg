# Panel

Panel creates a container with a header that can take collapsible PanelBody components to easily create a user friendly interface for affecting state and attributes within Gutenberg.

### Sub-Components

#### Panel

##### Props

###### className

The class that will be added with `components-panel`. If no className is passed only `components-panel__body` and `is-opened` is used.

- Type: `String`
- Required: No

###### header

Title of the Panel. Text will be rendered inside an `<h2>` tag.

- Type: `String`
- Required: No


#### PanelBody

The PanelBody creates a collapsible container that can be toggled open or closed. 


##### Props

###### title

Title of the PanelBody. This shows even when the PanelBody is closed.

- Type: `String`
- Required: No


###### opened

If opened is true then the Panel will remain open regardless of the initialOpen prop and the panel will be prevented from being closed.

- Type: `Boolean`
- Required: No

###### className

The class that will be added with `components-panel__body`, if the panel is currently open, the `is-opened` class will also be passed to the classes of the wrapper div. If no className is passed only `components-panel__body` and `is-opened` is used.

- Type: `String`
- Required: No

###### icon

An icon to be shown next to the PanelBody title

- Type: `String`
- Required: No

###### onToggle

A function that is called when the user clicks on the PanelBody title after the open state is changed.

- Type: `function`
- Required: No

###### initialOpen

Whether or not the panel will start open.

- Type: `Boolean`
- Required: No
- Default: true

#### PanelRow

The is a generic container for panel content. Default Gutenberg styles add a top margin and arrange items in a flex row.

##### Props

###### className

The class that will be added with `components-panel__row`.  to the classes of the wrapper div. If no className is passed only `components-panel__body` is used.

- Type: `String`
- Required: No


## Usage

### Standalone

```jsx
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
 
const MyPanel = () => (
	<Panel header="My Panel">
		<PanelBody
			title="My Block Settings"
			icon="welcome-widgets-menus"
			initialOpen={true}
		>
			<PanelRow>
				My Panel Inputs and Labels
			</PanelRow>
		</PanelBody>
	</Panel>
);
```


### Within `InspectorControls`

The InspectorControls component used in a block's edit method is already inside a Panel component provided by Gutenberg, therefore the Panel component should not be used.

```jsx
import { PanelBody, PanelRow } from '@wordpress/components';
 
const MyPanel = (props) => (
		<PanelBody
			title="My Block Settings"
			icon="welcome-widgets-menus"
			initialOpen={true}
		>
			<PanelRow>
				My Panel Inputs and Labels
			</PanelRow>
		</PanelBody>
);
```
