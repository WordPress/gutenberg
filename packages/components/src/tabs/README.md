# Tabs

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

Tabs is a collection of React components that combine to render an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

Tabs organizes content across different screens, data sets, and interactions. It has two sections: a list of tabs, and the view to show when tabs are chosen.

## Development guidelines

### Usage

#### Uncontrolled Mode

Tabs can be used in an uncontrolled mode, where the component manages its own state. In this mode, the `defaultTabId` prop can be used to set the initially selected tab. If this prop is not set, the first tab will be selected by default. In addition, in most cases where the currently active tab becomes disabled or otherwise unavailable, uncontrolled mode will automatically fall back to selecting the first available tab.

```jsx
import { Tabs } from '@wordpress/components';

const onSelect = ( tabName ) => {
	console.log( 'Selecting tab', tabName );
};

const MyUncontrolledTabs = () => (
		<Tabs onSelect={ onSelect } defaultTabId="tab2">
			<Tabs.TabList>
				<Tabs.Tab tabId="tab1" title="Tab 1">
					Tab 1
				</Tabs.Tab>
				<Tabs.Tab tabId="tab2" title="Tab 2">
					Tab 2
				</Tabs.Tab>
				<Tabs.Tab tabId="tab3" title="Tab 3">
					Tab 3
				</Tabs.Tab>
			</Tabs.TabList>
			<Tabs.TabPanel tabId="tab1">
				<p>Selected tab: Tab 1</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab2">
				<p>Selected tab: Tab 2</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab3">
				<p>Selected tab: Tab 3</p>
			</Tabs.TabPanel>
		</Tabs>
	);
```

#### Controlled Mode

Tabs can also be used in a controlled mode, where the parent component specifies the `selectedTabId` and the `onSelect` props to control tab selection. In this mode, the `defaultTabId` prop will be ignored if it is provided. If the `selectedTabId` is `null`, no tab is selected. In this mode, if the currently selected tab becomes disabled or otherwise unavailable, the component will _not_ fall back to another available tab, leaving the controlling component in charge of implementing the desired logic.

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
			<Tabs.TabList>
				<Tabs.Tab tabId="tab1" title="Tab 1">
					Tab 1
				</Tabs.Tab>
				<Tabs.Tab tabId="tab2" title="Tab 2">
					Tab 2
				</Tabs.Tab>
				<Tabs.Tab tabId="tab3" title="Tab 3">
					Tab 3
				</Tabs.Tab>
			</Tabs.TabList>
			<Tabs.TabPanel tabId="tab1">
				<p>Selected tab: Tab 1</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab2">
				<p>Selected tab: Tab 2</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab3">
				<p>Selected tab: Tab 3</p>
			</Tabs.TabPanel>
		</Tabs>
	);
```

### Components and Sub-components

Tabs is comprised of four individual components:
- `Tabs`: a wrapper component and context provider. It is responsible for managing the state of the tabs and rendering the `TabList` and `TabPanels`.
- `TabList`: a wrapper component for the `Tab` components. It is responsible for rendering the list of tabs.
- `Tab`: renders a single tab. The currently active tab receives default styling that can be overridden with CSS targeting [aria-selected="true"].
- `TabPanel`: renders the content to display for a single tab once that tab is selected.

#### Tabs

##### Props

###### `children`: `React.ReactNode`

The children elements, which should be at least a `Tabs.Tablist` component and a series of `Tabs.TabPanel` components.

-   Required: Yes

###### `selectOnMove`: `boolean`

When `true`, the tab will be selected when receiving focus (automatic tab activation). When `false`, the tab will be selected only when clicked (manual tab activation). See the [official W3C docs](https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/) for more info.

-   Required: No
-   Default: `true`

###### `defaultTabId`: `string`

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

###### `selectedTabId`: `string | null`

The ID of the tab to display. This id is prepended with the `Tabs` instanceId internally.
If left `undefined`, the component assumes it is being used in uncontrolled mode. Consequently, any value different than `undefined` will set the component in `controlled` mode. When in controlled mode, the `null` value will result in no tab being selected.

- Required: No

#### TabList

##### Props

###### `children`: `React.ReactNode`

The children elements, which should be a series of `Tabs.TabPanel` components.

-   Required: No

#### Tab

##### Props

###### `tabId`: `string`

A unique identifier for the tab, which is used to generate a unique id for the underlying element. The value of this prop should match with the value of the `tabId` prop on the corresponding `Tabs.TabPanel` component.

- Required: Yes

###### `children`: `React.ReactNode`

The children elements, generally the text to display on the tab.

- Required: No

###### `disabled`: `boolean`

Determines if the tab button should be disabled.

- Required: No
- Default: `false`

###### `render`: `React.ReactNode`

The type of component to render the tab button as. If this prop is not provided, the tab button will be rendered as a `button` element.

- Required: No

#### TabPanel

##### Props

###### `children`: `React.ReactNode`

The children elements, generally the content to display on the tabpanel.

- Required: No

###### `tabId`: `string`

A unique identifier for the tabpanel, which is used to generate an instanced id for the underlying element. The value of this prop should match with the value of the `tabId` prop on the corresponding `Tabs.Tab` component.

- Required: Yes

###### `focusable`: `boolean`

Determines whether or not the tabpanel element should be focusable. If `false`, pressing the tab key will skip over the tabpanel, and instead focus on the first focusable element in the panel (if there is one).

- Required: No
- Default: `true`
