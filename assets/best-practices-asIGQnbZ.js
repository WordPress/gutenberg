import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";import{n as o,t as s}from"./index.story-Bk2q35vt.js";function _createMdxContent(e){let t={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,h3:`h3`,p:`p`,pre:`pre`,...i(),...e.components};return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(n,{of:s,name:`Best Practices`}),`
`,(0,c.jsx)(t.h1,{id:`tabs`,children:`Tabs`}),`
`,(0,c.jsx)(t.h2,{id:`usage`,children:`Usage`}),`
`,(0,c.jsx)(t.h3,{id:`uncontrolled-mode`,children:`Uncontrolled Mode`}),`
`,(0,c.jsxs)(t.p,{children:[`Tabs can be used in an uncontrolled mode, where the component manages its own state. In this mode, the `,(0,c.jsx)(t.code,{children:`defaultTabId`}),` prop can be used to set the initially selected tab. If this prop is not set, the first tab will be selected by default. In addition, in most cases where the currently active tab becomes disabled or otherwise unavailable, uncontrolled mode will automatically fall back to selecting the first available tab.`]}),`
`,(0,c.jsx)(t.pre,{children:(0,c.jsx)(t.code,{className:`language-jsx`,children:`import { Tabs } from '@wordpress/components';

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
`})}),`
`,(0,c.jsx)(t.h3,{id:`controlled-mode`,children:`Controlled Mode`}),`
`,(0,c.jsxs)(t.p,{children:[`Tabs can also be used in a controlled mode, where the parent component specifies the `,(0,c.jsx)(t.code,{children:`selectedTabId`}),` and the `,(0,c.jsx)(t.code,{children:`onSelect`}),` props to control tab selection. In this mode, the `,(0,c.jsx)(t.code,{children:`defaultTabId`}),` prop will be ignored if it is provided. If the `,(0,c.jsx)(t.code,{children:`selectedTabId`}),` is `,(0,c.jsx)(t.code,{children:`null`}),`, no tab is selected. In this mode, if the currently selected tab becomes disabled or otherwise unavailable, the component will `,(0,c.jsx)(t.em,{children:`not`}),` fall back to another available tab, leaving the controlling component in charge of implementing the desired logic.`]}),`
`,(0,c.jsx)(t.pre,{children:(0,c.jsx)(t.code,{className:`language-tsx`,children:`import { Tabs } from '@wordpress/components';

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
`})}),`
`,(0,c.jsxs)(t.h3,{id:`using-tabs-with-links`,children:[`Using `,(0,c.jsx)(t.code,{children:`Tabs`}),` with links`]}),`
`,(0,c.jsxs)(t.p,{children:[`The semantics implemented by the `,(0,c.jsx)(t.code,{children:`Tabs`}),` component don't align well with the semantics needed by a list of links. Furthermore, end users usually expect every link to be tabbable, while `,(0,c.jsx)(t.code,{children:`Tabs.Tablist`}),` is a `,(0,c.jsx)(t.a,{href:`https://w3c.github.io/aria/#composite`,rel:`nofollow`,children:`composite`}),` widget acting as a single tab stop.`]}),`
`,(0,c.jsxs)(t.p,{children:[`For these reasons, even if the `,(0,c.jsx)(t.code,{children:`Tabs`}),` component is fully extensible, we don't recommend using `,(0,c.jsx)(t.code,{children:`Tabs`}),` with links, and we don't currently provide any related Storybook example.`]})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var c;function init_best_practices(){return(init_best_practices=e((()=>{c=r(),a(),t(),o()})))()}init_best_practices();export{MDXContent as default};