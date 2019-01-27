# TabPanel

TabPanel is a React component to render an ARIA-compliant TabPanel. 

TabPanels organize content across different screens, data sets, and interactions. It has two sections: a list of tabs, and the view to show when tabs are chosen. 

![The “Document” tab selected in the sidebar TabPanel.](https://wordpress.org/gutenberg/files/2019/01/s_E36D9C9B8FFA15A1A8CE224E422535A12B016F88884089575F9998E52016A49F_1541785098230_TabPanel.png)

## Table of contents

1. Design guidelines
2. Development guidelines

## Design guidelines

### Usage

TabPanels organize and allow navigation between groups of content that are related and at the same level of hierarchy.

#### Tabs in a set
As a set, all tabs are unified by a shared topic. For clarity, each tab should contain content that is distinct from all the other tabs in a set. 

### Anatomy

![](https://wordpress.org/gutenberg/files/2019/01/s_E36D9C9B8FFA15A1A8CE224E422535A12B016F88884089575F9998E52016A49F_1541787297310_TabPanelAnatomy.png)

1. Container
2. Active text label
3. Active tab indicator
4. Inactive text label
5. Tab item

#### Labels

Tab labels appear in a single row, in the same typeface and size. Use text labels that clearly and succinctly describe the content of a tab, and make sure that a set of tabs contains a cohesive group of items that share a common characteristic.

Tab labels can wrap to a second line, but do not add a second row of tabs.

#### Active tab indicators

To differentiate an active tab from an inactive tab, apply an underline and color change to the active tab’s text and icon.

![An underline and color change differentiate an active tab from the inactive ones.](https://wordpress.org/gutenberg/files/2019/01/s_E36D9C9B8FFA15A1A8CE224E422535A12B016F88884089575F9998E52016A49F_1541787691601_TabPanelActiveTab.png)

### Behavior

Users can navigate between tabs by tapping the tab key on the keyboard.

### Placement

Place tabs above content. Tabs control the UI region displayed below them.

## Development guidelines

### Usage

```jsx
import { TabPanel } from '@wordpress/components';

const onSelect = ( tabName ) => {
	console.log( 'Selecting tab', tabName );
};

const MyTabPanel = () => (
	<TabPanel className="my-tab-panel"
		activeClass="active-tab"
		onSelect={ onSelect }
		tabs={ [
			{
				name: 'tab1',
				title: 'Tab 1',
				className: 'tab-one',
			},
			{
				name: 'tab2',
				title: 'Tab 2',
				className: 'tab-two',
			},
		] }>
		{
			( tab ) => <p>{ tab.title }</p>
		}
	</TabPanel>
);
```

### Props

The component accepts the following props:

#### className

The class to give to the outer container for the TabPanel

- Type: `String`
- Required: No
- Default: ''

#### orientation

The orientation of the tablist (`vertical` or `horizontal`)

- Type: `String`
- Required: No
- Default: `horizontal`

#### onSelect

The function called when a tab has been selected. It is passed the `tabName` as an argument.

- Type: `Function`
- Required: No
- Default: `noop`

#### tabs

A list of tabs where each tab is defined by an object with the following fields:

1. name: String. Defines the key for the tab
2. title: String. Defines the translated text for the tab
3. className: String. Defines the class to put on the tab.

Other fields may be added to the object and accessed from the child function if desired.

- Type: Array
- Required: Yes

#### activeClass

The class to add to the active tab

- Type: `String`
- Required: No
- Default: `is-active`

#### initialTabName

Optionally provide a tab name for a tab to be selected upon mounting of component. If this prop is not set, the first tab will be selected by default.

- Type: `String`
- Required: No
- Default: none

#### children

A function which renders the tabviews given the selected tab. The function is passed the active tab object as an argument as defined the the tabs prop.
The element to which the tooltip should anchor.

- Type: (`Object`) => `Element`
- Required: Yes
