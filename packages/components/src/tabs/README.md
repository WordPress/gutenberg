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

The children elements, which should include one instance of the `Tabs.Tablist` component and as many instances of the `Tabs.TabPanel` components as there are `Tabs.Tab` components.

-   Required: Yes

###### `selectOnMove`: `boolean`

Determines if the tab should be selected when it receives focus. If set to `false`, the tab will only be selected upon clicking, not when using arrow keys to shift focus (manual tab activation). See the [official W3C docs](https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/) for more info.

-   Required: No
-   Default: `true`

###### `selectedTabId`: `string | null`

The id of the tab whose panel is currently visible.

If left `undefined`, it will be automatically set to the first enabled tab, and the component assumes it is being used in "uncontrolled" mode.

Consequently, any value different than `undefined` will set the component in "controlled" mode. When in "controlled" mode, the `null` value will result in no tabs being selected, and the tablist becoming tabbable.

- Required: No

###### `defaultTabId`: `string | null`

The id of the tab whose panel is currently visible.

If left `undefined`, it will be automatically set to the first enabled tab. If set to `null`, no tab will be selected, and the tablist will be tabbable.

_Note: this prop will be overridden by the `selectedTabId` prop if it is provided (meaning the component will be used in "controlled" mode)._

-   Required: No

###### `onSelect`: `( ( selectedId: string | null | undefined ) => void )`

The function called when the `selectedTabId` changes.

-   Required: No
-   Default: `noop`

###### `activeTabId`: `string | null`

The current active tab `id`. The active tab is the tab element within the tablist widget that has DOM focus.

- `null` represents the tablist (ie. the base composite element). Users
  will be able to navigate out of it using arrow keys;
- If `activeTabId` is initially set to `null`, the base composite element
  itself will have focus and users will be able to navigate to it using
  arrow keys.

- Required: No

###### `defaultActiveTabId`: `string | null`

The tab id that should be active by default when the composite widget is rendered. If `null`, the tablist element itself will have focus and users will be able to navigate to it using arrow keys. If `undefined`, the first enabled item will be focused.

_Note: this prop will be overridden by the `activeTabId` prop if it is provided._

-   Required: No

###### `onActiveTabIdChange`: `( ( activeId: string | null | undefined ) => void )`

The function called when the `selectedTabId` changes.

-   Required: No
-   Default: `noop`

###### `orientation`: `'horizontal' | 'vertical' | 'both'`

Defines the orientation of the tablist and determines which arrow keys can be used to move focus:

- `both`: all arrow keys work;
- `horizontal`: only left and right arrow keys work;
- `vertical`: only up and down arrow keys work.

-   Required: No
-   Default: `horizontal`

#### TabList

##### Props

###### `children`: `React.ReactNode`

The children elements, which should include one or more instances of the `Tabs.Tab` component.

-   Required: No

#### Tab

##### Props

###### `tabId`: `string`

The unique ID of the tab. It will be used to register the tab and match it to a corresponding `Tabs.TabPanel` component. If not provided, a unique ID will be automatically generated.

- Required: Yes

###### `children`: `React.ReactNode`

The contents of the tab.

- Required: No

###### `disabled`: `boolean`

Determines if the tab should be disabled. Note that disabled tabs can still be accessed via the keyboard when navigating through the tablist.

- Required: No
- Default: `false`

###### `render`: `React.ReactNode`

Allows the component to be rendered as a different HTML element or React component. The value can be a React element or a function that takes in the original component props and gives back a React element with the props merged.

By default, the tab will be rendered as a `button` element.

- Required: No

#### TabPanel

##### Props

###### `children`: `React.ReactNode`

The contents of the tab panel.

- Required: No

###### `tabId`: `string`

The unique `id` of the `Tabs.Tab` component controlling this panel. This connection is used to assign the `aria-labelledby` attribute to the tab panel and to determine if the tab panel should be visible.

If not provided, this link is automatically established by matching the order of `Tabs.Tab` and `Tabs.TabPanel` elements in the DOM.

- Required: Yes

###### `focusable`: `boolean`

Determines whether or not the tabpanel element should be focusable.

If `false`, pressing the tab key will skip over the tabpanel, and instead focus on the first focusable element in the panel (if there is one).

- Required: No
- Default: `true`
