# TabPanel

Tabs is a collection of React components that combine to render an ARIA-compliant TabPanel.

Tabs organizes content across different screens, data sets, and interactions. It has two sections: a list of tabs, and the view to show when tabs are chosen.

![The “Document” tab selected in the sidebar TabPanel.](https://wordpress.org/gutenberg/files/2019/01/s_E36D9C9B8FFA15A1A8CE224E422535A12B016F88884089575F9998E52016A49F_1541785098230_TabPanel.png)

## Table of contents

1. Design guidelines
2. Development guidelines

## Design guidelines

### Usage

Tabs organizes and allows navigation between groups of content that are related and at the same level of hierarchy.

#### Tabs in a set

As a set, all individual tab items are unified by a shared topic. For clarity, each tab item should contain content that is distinct from all the other tabs in a set.

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

Users can navigate between tabs by clicking the desired tab with their mouse. They can also tap the tab key on their keyboard to focus the `tablist`, and then navigate between tabs by tapping the arrow keys on their keyboard.

### Placement

Tabs are generally placed above content, allowing them to control the UI region displayed below them. It is also possible to render the tabs or the content elsewhere in the UI, using a `SlotFill` component when necessary.

## Development guidelines

### Usage

#### Uncontrolled Mode

Tabs can be used in an uncontrolled mode, where the component manages its own state. In this mode, the `initialTabId` prop can be used to set the initially selected tab. If this prop is not set, the first tab will be selected by default. In addition, in most cases where the currently active tab becomes disabled or otherwise unavailable, uncontrolled mode will automatically fall back to selecting the first available tab.

```jsx
import { Tabs } from '@wordpress/components';

const onSelect = ( tabName ) => {
	console.log( 'Selecting tab', tabName );
};

const MyUncontrolledTabs = () => (
		<Tabs onSelect={onSelect} initialTab="tab2">
			<Tabs.TabList >
				<Tabs.Tab id={ 'tab1' } title={ 'Tab 1' }>
					Tab 1
				</Tabs.Tab>
				<Tabs.Tab id={ 'tab2' } title={ 'Tab 2' }>
					Tab 2
				</Tabs.Tab>
				<Tabs.Tab id={ 'tab3' } title={ 'Tab 3' }>
					Tab 3
				</Tabs.Tab>
			</Tabs.TabList>
			<Tabs.TabPanel id={ 'tab1' }>
				<p>Selected tab: Tab 1</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel id={ 'tab2' }>
				<p>Selected tab: Tab 2</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel id={ 'tab3' }>
				<p>Selected tab: Tab 3</p>
			</Tabs.TabPanel>
		</Tabs>
	);
```

#### Controlled Mode

Tabs can also be used in a controlled mode, where the selected tab is specified by a parent component. In this mode, the `initialTabId` prop will be ignored if it is provided. Instead, the `selectedTabId` value will be used to determine the selected tab. If the `selectedTabId` is `null`, no tab is selected. In this mode, if the currently selected tab becomes disabled or otherwise unavailable, the component will _not_ fall back to another available tab.

```jsx
import { Tabs } from '@wordpress/components';
	const [ selectedTabId, setSelectedTabId ] = useState<
		string | undefined | null
	>();

const onSelect = ( tabName ) => {
	console.log( 'Selecting tab', tabName );
};

const MyControlledTabs = () => (
		<Tabs
			selectedTabId={ selectedTabId }
			onSelect={ ( selectedId ) => {
				setSelectedTabId( selectedId );
				onSelect( selectedId );
			} }
		>
			<Tabs.TabList >
				<Tabs.Tab id={ 'tab1' } title={ 'Tab 1' }>
					Tab 1
				</Tabs.Tab>
				<Tabs.Tab id={ 'tab2' } title={ 'Tab 2' }>
					Tab 2
				</Tabs.Tab>
				<Tabs.Tab id={ 'tab3' } title={ 'Tab 3' }>
					Tab 3
				</Tabs.Tab>
			</Tabs.TabList>
			<Tabs.TabPanel id={ 'tab1' }>
				<p>Selected tab: Tab 1</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel id={ 'tab2' }>
				<p>Selected tab: Tab 2</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel id={ 'tab3' }>
				<p>Selected tab: Tab 3</p>
			</Tabs.TabPanel>
		</Tabs>
	);
```

### Components and Sub-components

Tabs is comprised of four individual components:
- `Tabs`: a wrapper component and context provider. It is responsible for managing the state of the tabs and rendering the `TabList` and `TabPanels`.
- `TabList`: a wrapper component for the `Tab` components. It is responsible for rendering the list of tabs.
- `Tab`: renders a single tab.
- `TabPanel`: renders the content to display for a single tab once that tab is selected.

#### Tabs

##### Props

###### `children`: `React.ReactNode`

The children elements, which should be at least a `Tabs.Tablist` component and a series of `Tabs.TabPanel` components.

-   Required: Yes

###### `activeClass`: `string`

The class to add to the active tab

-   Required: No
-   Default: `is-active`

###### `selectOnMove`: `boolean`

When `true`, the tab will be selected when receiving focus (automatic tab activation). When `false`, the tab will be selected only when clicked (manual tab activation). See the [official W3C docs](https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/) for more info.

-   Required: No
-   Default: `true`

###### `initialTabId`: `string`

The id of the tab to be selected upon mounting of component. If this prop is not set, the first tab will be selected by default. The id provided will be internally prefixed with a unique instance ID to avoid collisions.

_Note: this prop will be overridden by the `selectedTabId` prop if it is provided. (Controlled Mode)_

-   Required: No

###### `onSelect`: `( ( selectedId: string | null | undefined ) => void )`

The function called when a tab has been selected. It is passed the selected tab's ID as an argument.

-   Required: No
-   Default: `noop`

###### `orientation`: `horizontal | vertical`

The orientation of the `tablist` (`vertical` or `horizontal`)

-   Required: No
-   Default: `horizontal`

###### `selectedTabId`: `string | null | undefined`

The ID of the tab to display. This id is prepended with the `Tabs` instanceId internally.
This prop puts the component into controlled mode. A value of `null` will result in no tab being selected.
- Required: No

#### TabList

##### Props

###### `children`: `React.ReactNode`

The children elements, which should be a series of `Tabs.TabPanel` components.

-   Required: No

###### `className`: `string`

The class name to apply to the tablist.

-   Required: No
-   Default: ''

###### `style`: `React.CSSProperties`

Custom CSS styles for the tablist.

- Required: No

#### Tab

##### Props

###### `id`: `string`

The id of the tab, which is prepended with the `Tabs` instance ID.

- Required: Yes

###### `title`: `string`

The label for the tab.

- Required: Yes

###### `style`: `React.CSSProperties`

Custom CSS styles for the tab.

- Required: No

###### `children`: `React.ReactNode`

The children elements, generally the text to display on the tab.

- Required: No

###### `className`: `string`

The class name to apply to the tab.

- Required: No

###### `icon`: `IconType`

The icon used for the tab button.

- Required: No

###### `disabled`: `boolean`

Determines if the tab button should be disabled.

- Required: No
- Default: `false`

#### TabPanel

##### Props

###### `children`: `React.ReactNode`

The children elements, generally the content to display on the tabpanel.

- Required: No

###### `id`: `string`

The id of the tabpanel, which is combined with the `Tabs` instance ID and the suffix `-view`

- Required: Yes

###### `className`: `string`

The class name to apply to the tabpanel.

- Required: No

###### `style`: `React.CSSProperties`

Custom CSS styles for the tab.

- Required: No
