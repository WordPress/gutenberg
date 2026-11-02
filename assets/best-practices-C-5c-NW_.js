import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,p:`p`,pre:`pre`,strong:`strong`,...i(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n,{id:`design-system-components-tabs-best-practices`,title:`Components/@wordpress-ui/Tabs/Best Practices`}),`
`,(0,o.jsx)(t.h1,{id:`tabs`,children:`Tabs`}),`
`,(0,o.jsx)(t.h2,{id:`usage`,children:`Usage`}),`
`,(0,o.jsx)(t.h3,{id:`uncontrolled-mode`,children:`Uncontrolled Mode`}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.code,{children:`Tabs`}),` can be used in an uncontrolled mode, where the component manages its own state. In this mode, the `,(0,o.jsx)(t.code,{children:`defaultValue`}),` prop can be used to set the initially selected tab.`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-jsx`,children:`import { Tabs } from '@wordpress/ui';

const MyUncontrolledTabs = () => (
	<Tabs.Root
		onValueChange={ ( tab ) => console.log( 'New selected tab: ', tab ) }
		defaultValue="tab2"
	>
		<Tabs.List>
			<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
			<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
			<Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
		</Tabs.List>
		<Tabs.Panel value="tab1">
			<p>Selected tab: Tab 1</p>
		</Tabs.Panel>
		<Tabs.Panel value="tab2">
			<p>Selected tab: Tab 2</p>
		</Tabs.Panel>
		<Tabs.Panel value="tab3">
			<p>Selected tab: Tab 3</p>
		</Tabs.Panel>
	</Tabs.Root>
);
`})}),`
`,(0,o.jsx)(t.h3,{id:`controlled-mode`,children:`Controlled Mode`}),`
`,(0,o.jsxs)(t.p,{children:[`Tabs can also be used in a controlled mode, where the parent component uses the `,(0,o.jsx)(t.code,{children:`value`}),` and `,(0,o.jsx)(t.code,{children:`onValueChange`}),` props to control tab selection. In this mode, the `,(0,o.jsx)(t.code,{children:`defaultValue`}),` prop will be ignored if it is provided. To indicate that no tabs are selected, pass `,(0,o.jsx)(t.code,{children:`null`}),` to the `,(0,o.jsx)(t.code,{children:`value`}),`.`]}),`
`,(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:`language-tsx`,children:`import { useState } from 'react';
import { Tabs } from '@wordpress/ui';

const MyControlledTabs = () => {
	const [ selectedTabId, setSelectedTabId ] = useState<
		string | undefined | null
	>( null );

	return (
		<Tabs.Root
			value={ selectedTabId }
			onValueChange={ ( newSelectedTabId ) => {
				setSelectedTabId( newSelectedTabId );
				console.log( 'Selecting tab', newSelectedTabId );
			} }
		>
			<Tabs.List>
				<Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
				<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
				<Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
			</Tabs.List>
			<Tabs.Panel value="tab1">
				<p>Selected tab: Tab 1</p>
			</Tabs.Panel>
			<Tabs.Panel value="tab2">
				<p>Selected tab: Tab 2</p>
			</Tabs.Panel>
			<Tabs.Panel value="tab3">
				<p>Selected tab: Tab 3</p>
			</Tabs.Panel>
		</Tabs.Root>
	);
};
`})}),`
`,(0,o.jsxs)(t.h3,{id:`using-tabs-with-links`,children:[`Using `,(0,o.jsx)(t.code,{children:`Tabs`}),` with links`]}),`
`,(0,o.jsxs)(t.p,{children:[`The semantics implemented by the `,(0,o.jsx)(t.code,{children:`Tabs`}),` component don't align well with the semantics needed by a list of links. Furthermore, end users usually expect every link to be tabbable, while `,(0,o.jsx)(t.code,{children:`Tabs.List`}),` is a `,(0,o.jsx)(t.a,{href:`https://w3c.github.io/aria/#composite`,rel:`nofollow`,children:`composite`}),` widget acting as a single tab stop.`]}),`
`,(0,o.jsxs)(t.p,{children:[`For these reasons, even if the `,(0,o.jsx)(t.code,{children:`Tabs`}),` component is fully extensible, we don't recommend using `,(0,o.jsx)(t.code,{children:`Tabs`}),` with links, and we don't currently provide any related Storybook example.`]}),`
`,(0,o.jsx)(t.p,{children:`We may provide a dedicated component for tabs-like links in the future based on the feedback received.`}),`
`,(0,o.jsx)(t.h3,{id:`panel-and-sidebar-tabs`,children:`Panel and sidebar tabs`}),`
`,(0,o.jsxs)(t.p,{children:[`When tabs sit at the top of a panel or sidebar (below a screen header and above padded content) use a `,(0,o.jsx)(t.strong,{children:`full-bleed tab list with a light bottom border`}),`. The border should span the full width of the panel. The tab labels should stay only as wide as their text.`]})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var o;function init_best_practices(){return(init_best_practices=e((()=>{o=r(),a(),t()})))()}init_best_practices();export{MDXContent as default};