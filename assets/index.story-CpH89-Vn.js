import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-merge-refs-BNmiIksj.js";import{a as o,i as s}from"./iframe-y9psNcyg.js";import{a as c,c as l,i as u,l as d,n as f,o as p,r as m,s as ee,t as te,u as ne}from"./TabsList-CUfRJ4-Y.js";import{Ki as re,i as h,n as ie,vi as ae}from"./build-module-CPA2Y5FH.js";import{n as oe,t as se}from"./focus.module-o8ARS36z.js";import{n as ce,t as le}from"./global-css-defense.module-BCx5sFzT.js";import{n as g,t as _}from"./icon-CuFTK1Qw.js";import{n as v,t as y}from"./direction-provider-CwWEbyiW.js";import{a as b,c as ue,i as de,n as fe,o as x,r as S,s as C,t as w}from"./root-DDAy-me7.js";var T,E,D,O;function init_style_module(){return(init_style_module=e((()=>{T=`_tablist_vc8v0_5`,E=`_indicator_vc8v0_58`,D=`_tab_vc8v0_5`,O={tablist:T,"is-scrolling":`_is-scrolling_vc8v0_30`,"is-overflowing-first":`_is-overflowing-first_vc8v0_34`,"is-overflowing-last":`_is-overflowing-last_vc8v0_38`,"is-minimal-variant":`_is-minimal-variant_vc8v0_48`,indicator:E,tab:D,"tab-children":`_tab-children_vc8v0_251`}})))()}var k,A,j;function init_list(){return(init_list=e((()=>{n(),o(),f(),p(),a(),init_style_module(),k=t(),A=1,j=(0,r.forwardRef)(function TabList({children:e,variant:t=`default`,className:n,activateOnFocus:a,...o},l){let[u,d]=(0,r.useState)(null),[f,p]=(0,r.useState)({first:!1,last:!1,isScrolling:!1});(0,r.useEffect)(()=>{if(!u)return;let measureOverflow=()=>{let{scrollWidth:e,clientWidth:t,scrollLeft:n}=u,r=Math.max(e-t,0),i=(u.dir||(typeof window<`u`?window.getComputedStyle(u).direction:`ltr`))===`rtl`&&n<0?-n:n,a={first:i>A,last:i<r-A,isScrolling:e>t};p(e=>e.first===a.first&&e.last===a.last&&e.isScrolling===a.isScrolling?e:a)},e=new ResizeObserver(measureOverflow),observeTabs=()=>{e.disconnect(),e.observe(u),u.querySelectorAll(`[role="tab"]`).forEach(t=>e.observe(t))},t=new MutationObserver(observeTabs);t.observe(u,{childList:!0,subtree:!0});let n=!1,throttleMeasureOverflowOnScroll=()=>{n||=(requestAnimationFrame(()=>{measureOverflow(),n=!1}),!0)};return u.addEventListener(`scroll`,throttleMeasureOverflowOnScroll,{passive:!0}),observeTabs(),measureOverflow(),()=>{u.removeEventListener(`scroll`,throttleMeasureOverflowOnScroll),e.disconnect(),t.disconnect()}},[u]);let m=i([l,e=>d(e)]);return(0,k.jsxs)(te,{ref:m,activateOnFocus:a,"data-select-on-move":a?`true`:`false`,className:s(O.tablist,f.isScrolling&&O[`is-scrolling`],f.first&&O[`is-overflowing-first`],f.last&&O[`is-overflowing-last`],O[`is-${t}-variant`],n),...o,tabIndex:o.tabIndex??(f.isScrolling?-1:void 0),children:[e,(0,k.jsx)(c,{className:O.indicator})]})});try{j.__docgenInfo={description:`Groups the individual tab buttons.

\`Tabs\` is a collection of React components that combine to render
an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).`,displayName:`List`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/list.tsx`,methods:[],props:{loopFocus:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/list/TabsList.d.mts`,name:`TabsListProps`}],description:`Whether to loop keyboard focus back to the first item
when the end of the list is reached while using the arrow keys.`,name:`loopFocus`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/list/TabsList.d.mts`,name:`TabsListProps`},required:!1,tags:{},type:{name:`boolean`}},activateOnFocus:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/list/TabsList.d.mts`,name:`TabsListProps`}],description:`Whether to automatically change the active tab on arrow key focus.
Otherwise, tabs will be activated using <kbd>Enter</kbd> or <kbd>Space</kbd> key press.`,name:`activateOnFocus`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/list/TabsList.d.mts`,name:`TabsListProps`},required:!1,tags:{},type:{name:`boolean`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The content to be rendered inside the component.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},variant:{defaultValue:{value:`default`},declarations:[{fileName:`gutenberg/packages/ui/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The visual variant of the tab list.`,name:`variant`,required:!1,tags:{},type:{name:`enum`,raw:`"default" | "minimal"`,value:[{value:`"default"`},{value:`"minimal"`}]}}},tags:{}}}catch{}})))()}function useRegisterTabProd(){}function useRegisterPanelProd(){}function TabsValidationProviderProd({children:e}){return(0,M.jsx)(M.Fragment,{children:e})}var M,N,P,F;function init_context(){return(init_context=e((()=>{M=t(),N=useRegisterTabProd,P=useRegisterPanelProd,F=TabsValidationProviderProd;try{N.__docgenInfo={description:`Hook that registers a Tab for count validation in development mode.`,displayName:`useRegisterTab`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/context.tsx`,methods:[],props:{},tags:{}}}catch{}try{P.__docgenInfo={description:`Hook that registers a Panel for count validation in development mode.`,displayName:`useRegisterPanel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/context.tsx`,methods:[],props:{},tags:{}}}catch{}try{F.__docgenInfo={description:`Provider component that validates the number of tabs matches the number
of panels in development mode.

In production, this component is a no-op and just renders children.`,displayName:`TabsValidationProvider`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/context.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var I,L;function init_panel(){return(init_panel=e((()=>{n(),o(),u(),init_context(),ce(),oe(),I=t(),L=(0,r.forwardRef)(function TabPanel({className:e,...t},n){return P(),(0,I.jsx)(m,{ref:n,className:s(le.div,se[`outset-ring--focus-visible`],e),...t})});try{L.__docgenInfo={description:`A panel displayed when the corresponding tab is active.

\`Tabs\` is a collection of React components that combine to render
an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).`,displayName:`Panel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/panel.tsx`,methods:[],props:{value:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/panel/TabsPanel.d.mts`,name:`TabsPanelProps`}],description:`The value of the TabPanel. It will be shown when the Tab with the corresponding value is active.`,name:`value`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/panel/TabsPanel.d.mts`,name:`TabsPanelProps`},required:!0,tags:{},type:{name:`any`}},keepMounted:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/panel/TabsPanel.d.mts`,name:`TabsPanelProps`}],description:`Whether to keep the HTML element in the DOM while the panel is hidden.`,name:`keepMounted`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/panel/TabsPanel.d.mts`,name:`TabsPanelProps`},required:!1,tags:{},type:{name:`boolean`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The content to be rendered inside the component.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var R,z;function init_root(){return(init_root=e((()=>{n(),ne(),init_context(),v(),R=t(),z=(0,r.forwardRef)(function TabsRoot$1({...e},t){return(0,R.jsx)(y,{children:(0,R.jsx)(F,{children:(0,R.jsx)(d,{ref:t,...e})})})});try{z.__docgenInfo={description:`Groups the tabs and the corresponding panels.

\`Tabs\` is a collection of React components that combine to render
an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).`,displayName:`Root`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/root.tsx`,methods:[],props:{defaultValue:{defaultValue:{value:`0`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`}],description:"The default value. Use when the component is not controlled.\nWhen the value is `null`, no Tab will be active.",name:`defaultValue`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`},required:!1,tags:{},type:{name:`any`}},orientation:{defaultValue:{value:`'horizontal'`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`}],description:`The component orientation (layout flow direction).`,name:`orientation`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`},required:!1,tags:{},type:{name:`enum`,raw:`Orientation`,value:[{value:`"horizontal"`},{value:`"vertical"`}]}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`}],description:"The value of the currently active `Tab`. Use when the component is controlled.\nWhen the value is `null`, no Tab will be active.",name:`value`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`},required:!1,tags:{},type:{name:`any`}},onValueChange:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`}],description:"Callback invoked when new value is being set.\n\nThe event `reason` is `'none'` for user-initiated changes, such as a click\nor keyboard navigation; `'initial'` for the first automatic selection or\nfallback in uncontrolled roots when `defaultValue` is omitted or\n`undefined`, including when the implicit initial value is disabled or\nmissing; `'disabled'` for automatic fallback when the selected tab becomes\ndisabled in uncontrolled roots; or `'missing'` for automatic fallback when\nthe selected tab is removed, or when an explicit `defaultValue` never\nmatches a mounted tab in uncontrolled roots.\n\nFor automatic changes, the selected value can be `null` when no enabled Tab\nis available as a fallback.\n\nAutomatic changes cannot be canceled; calling `eventDetails.cancel()` for\n`'initial'`, `'disabled'`, or `'missing'` has no effect.",name:`onValueChange`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/root/TabsRoot.d.mts`,name:`TabsRootProps`},required:!1,tags:{},type:{name:`((value: any, eventDetails: TabsRootChangeEventDetails) => void)`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The content to be rendered inside the component.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var B,V;function init_tab(){return(init_tab=e((()=>{n(),o(),l(),init_context(),init_style_module(),B=t(),V=(0,r.forwardRef)(function UnforwardedTab({className:e,children:t,...n},r){return N(),(0,B.jsx)(ee,{ref:r,className:s(O.tab,e),...n,children:(0,B.jsx)(`span`,{className:O[`tab-children`],children:t})})});try{V.__docgenInfo={description:`An individual interactive tab button that toggles the corresponding panel.

\`Tabs\` is a collection of React components that combine to render
an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).`,displayName:`Tab`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/tab.tsx`,methods:[],props:{disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/tab/TabsTab.d.mts`,name:`TabsTabProps`}],description:"Whether the Tab is disabled.\n\nIf a first Tab on a `<Tabs.List>` is disabled, it won't initially be selected.\nInstead, the next enabled Tab will be selected.\nHowever, it does not work like this during server-side rendering, as it is not known\nduring pre-rendering which Tabs are disabled.\nTo work around it, ensure that `defaultValue` or `value` on `<Tabs.Root>` is set to an enabled Tab's value.",name:`disabled`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/tab/TabsTab.d.mts`,name:`TabsTabProps`},required:!1,tags:{},type:{name:`boolean`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/tab/TabsTab.d.mts`,name:`TabsTabProps`}],description:`The value of the Tab.`,name:`value`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/tabs/tab/TabsTab.d.mts`,name:`TabsTabProps`},required:!0,tags:{},type:{name:`any`}},nativeButton:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NativeButtonProps`}],description:"Whether the component renders a native `<button>` element when replacing it\nvia the `render` prop.\nSet to `false` if the rendered element is not a button (for example, `<div>`).",name:`nativeButton`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NativeButtonProps`},required:!1,tags:{},type:{name:`boolean`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The content to be rendered inside the component.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var H,U,ThemedParagraph,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{n(),ie(),init_root(),init_list(),init_tab(),init_panel(),fe(),de(),x(),ue(),g(),H=t(),U={title:`Components/@wordpress-ui/Tabs`,id:`design-system-components-tabs`,component:z,tags:[`manifest`],subcomponents:{"Tabs.List":j,"Tabs.Tab":V,"Tabs.Panel":L},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},ThemedParagraph=({children:e})=>(0,H.jsx)(`p`,{style:{color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:e}),W={args:{defaultValue:`tab1`,children:[(0,H.jsxs)(j,{children:[(0,H.jsx)(V,{value:`tab1`,children:`Tab 1`}),(0,H.jsx)(V,{value:`tab2`,children:`Tab 2`}),(0,H.jsx)(V,{value:`tab3`,children:`Tab 3`})]},`list`),(0,H.jsx)(L,{value:`tab1`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 1`})},`panel-tab1`),(0,H.jsx)(L,{value:`tab2`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 2`})},`panel-tab2`),(0,H.jsx)(L,{value:`tab3`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 3`})},`panel-tab3`)]}},G={args:{...W.args,children:[(0,H.jsxs)(j,{variant:`minimal`,children:[(0,H.jsx)(V,{value:`tab1`,children:`Tab 1`}),(0,H.jsx)(V,{value:`tab2`,children:`Tab 2`}),(0,H.jsx)(V,{value:`tab3`,children:`Tab 3`})]},`list`),(0,H.jsx)(L,{value:`tab1`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 1`})},`panel-tab1`),(0,H.jsx)(L,{value:`tab2`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 2`})},`panel-tab2`),(0,H.jsx)(L,{value:`tab3`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 3`})},`panel-tab3`)]}},K={render:function SizeAndOverflowPlaygroundRender(e){let[t,n]=(0,r.useState)(!1);return(0,H.jsxs)(`div`,{children:[(0,H.jsxs)(`div`,{style:{maxWidth:`40rem`,marginBottom:`1rem`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:[(0,H.jsx)(`p`,{children:`This story helps understand how the TabList component behaves under different conditions. The container below (with the dotted red border) can be horizontally resized, and it has a bit of padding to be out of the way of the TabList.`}),(0,H.jsxs)(`p`,{children:[`The button will toggle between full width (adding`,` `,(0,H.jsx)(`code`,{children:`width: 100%`}),`) and the default width.`]}),(0,H.jsx)(`p`,{children:`Try the following:`}),(0,H.jsxs)(`ul`,{children:[(0,H.jsxs)(`li`,{children:[(0,H.jsx)(`strong`,{children:`Small container`}),` that causes tabs to overflow with scroll.`]}),(0,H.jsxs)(`li`,{children:[(0,H.jsx)(`strong`,{children:`Large container`}),` that exceeds the normal width of the tabs.`,(0,H.jsxs)(`ul`,{children:[(0,H.jsxs)(`li`,{children:[(0,H.jsxs)(`strong`,{children:[`With `,(0,H.jsx)(`code`,{children:`width: 100%`})]}),` `,`set on the TabList (tabs fill up the space).`]}),(0,H.jsxs)(`li`,{children:[(0,H.jsxs)(`strong`,{children:[`Without `,(0,H.jsx)(`code`,{children:`width: 100%`})]}),` `,`(defaults to `,(0,H.jsx)(`code`,{children:`auto`}),`) set on the TabList (tabs take up space proportional to their content).`]})]})]})]})]}),(0,H.jsx)(`button`,{style:{marginBottom:`1rem`},onClick:()=>n(!t),children:t?`Remove width: 100% from TabList`:`Set width: 100% in TabList`}),(0,H.jsxs)(z,{...e,style:{...e.style,width:`20rem`,border:`2px dotted red`,padding:`1rem`,resize:`horizontal`,overflow:`auto`},children:[(0,H.jsxs)(j,{style:{maxWidth:`100%`,width:t?`100%`:void 0},children:[(0,H.jsx)(V,{value:`tab1`,children:`Label with multiple words`}),(0,H.jsx)(V,{value:`tab2`,children:`Short`}),(0,H.jsx)(V,{value:`tab3`,children:`Hippopotomonstrosesquippedaliophobia`}),(0,H.jsx)(V,{value:`tab4`,children:`Tab 4`}),(0,H.jsx)(V,{value:`tab5`,children:`Tab 5`})]}),(0,H.jsxs)(L,{value:`tab1`,children:[(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 1`}),(0,H.jsx)(ThemedParagraph,{children:`(Label with multiple words)`})]}),(0,H.jsxs)(L,{value:`tab2`,children:[(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 2`}),(0,H.jsx)(ThemedParagraph,{children:`(Short)`})]}),(0,H.jsxs)(L,{value:`tab3`,children:[(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 3`}),(0,H.jsx)(ThemedParagraph,{children:`(Hippopotomonstrosesquippedaliophobia)`})]}),(0,H.jsx)(L,{value:`tab4`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 4`})}),(0,H.jsx)(L,{value:`tab5`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 5`})})]})]})},args:{...W.args,defaultValue:`tab4`}},q={args:{...W.args,orientation:`vertical`,style:{minWidth:`320px`,display:`grid`,gridTemplateColumns:`120px 1fr`,gap:`24px`}}},J={args:{...W.args,defaultValue:`tab3`,children:[(0,H.jsxs)(j,{children:[(0,H.jsx)(V,{value:`tab1`,disabled:!0,children:`Tab 1`}),(0,H.jsx)(V,{value:`tab2`,children:`Tab 2`}),(0,H.jsx)(V,{value:`tab3`,children:`Tab 3`})]},`list`),(0,H.jsx)(L,{value:`tab1`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 1`})},`panel-tab1`),(0,H.jsx)(L,{value:`tab2`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 2`})},`panel-tab2`),(0,H.jsx)(L,{value:`tab3`,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 3`})},`panel-tab3`)]}},Y=[{value:`tab1`,label:`Tab one`,icon:h},{value:`tab2`,label:`Tab two`,icon:re},{value:`tab3`,label:`Tab three`,icon:ae}],X={args:{...W.args,children:[(0,H.jsx)(j,{children:Y.map(({value:e,label:t,icon:n})=>(0,H.jsxs)(w,{children:[(0,H.jsx)(S,{"aria-label":t,render:(0,H.jsx)(V,{value:e}),children:(0,H.jsx)(_,{icon:n,size:20})}),(0,H.jsx)(b,{positioner:(0,H.jsx)(C,{align:`center`,side:`top`}),children:t})]},e))},`list`),Y.map(({value:e,label:t})=>(0,H.jsx)(L,{value:e,children:(0,H.jsxs)(ThemedParagraph,{children:[`Selected tab: `,t]})},e))]}},Z={args:{...W.args,children:[(0,H.jsxs)(j,{children:[(0,H.jsx)(V,{value:`tab1`,children:`Tab 1`}),(0,H.jsx)(V,{value:`tab2`,children:`Tab 2`}),(0,H.jsx)(V,{value:`tab3`,children:`Tab 3`})]},`list`),(0,H.jsx)(L,{value:`tab1`,keepMounted:!0,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 1`})},`panel-tab1`),(0,H.jsx)(L,{value:`tab2`,keepMounted:!0,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 2`})},`panel-tab2`),(0,H.jsx)(L,{value:`tab3`,keepMounted:!0,children:(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 3`})},`panel-tab3`)]}},Q={args:{...W.args,children:[(0,H.jsxs)(j,{children:[(0,H.jsx)(V,{value:`tab1`,children:`Tab 1`}),(0,H.jsx)(V,{value:`tab2`,children:`Tab 2`}),(0,H.jsx)(V,{value:`tab3`,children:`Tab 3`})]},`list`),(0,H.jsxs)(L,{value:`tab1`,tabIndex:-1,children:[(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 1`}),(0,H.jsx)(ThemedParagraph,{children:`This tabpanel is not focusable, therefore tabbing into it will focus its first tabbable child.`}),(0,H.jsx)(`button`,{children:`Focus me`})]},`panel-tab1`),(0,H.jsxs)(L,{value:`tab2`,tabIndex:-1,children:[(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 2`}),(0,H.jsx)(ThemedParagraph,{children:`This tabpanel is not focusable, therefore tabbing into it will focus its first tabbable child.`}),(0,H.jsx)(`button`,{children:`Focus me`})]},`panel-tab2`),(0,H.jsxs)(L,{value:`tab3`,tabIndex:-1,children:[(0,H.jsx)(ThemedParagraph,{children:`Selected tab: Tab 3`}),(0,H.jsx)(ThemedParagraph,{children:`This tabpanel is not focusable, therefore tabbing into it will focus its first tabbable child.`}),(0,H.jsx)(`button`,{children:`Focus me`})]},`panel-tab3`)]}},$={render:()=>(0,H.jsx)(`div`,{style:{width:140,padding:16,resize:`horizontal`,overflow:`auto`,boxSizing:`content-box`},children:(0,H.jsxs)(z,{defaultValue:`Content`,children:[(0,H.jsx)(j,{variant:`minimal`,"aria-label":`Resizable minimal tabs`,style:{maxWidth:`100%`},children:[`Content`,`Settings`,`Preview`].map(e=>(0,H.jsx)(V,{value:e,children:e},e))}),[`Content`,`Settings`,`Preview`].map(e=>(0,H.jsx)(L,{value:e,children:(0,H.jsxs)(ThemedParagraph,{children:[e,` panel`]})},e))]})})};try{$.__docgenInfo={description:`Resize the container to compare painted tab padding with actual overflow.`,displayName:`MinimalTabsOverflow`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tabs/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: 'tab1',
    children: [<Tabs.List key="list">
                <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
            </Tabs.List>, <Tabs.Panel value="tab1" key="panel-tab1">
                <ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab2" key="panel-tab2">
                <ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab3" key="panel-tab3">
                <ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
            </Tabs.Panel>]
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [<Tabs.List variant="minimal" key="list">
                <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
            </Tabs.List>, <Tabs.Panel value="tab1" key="panel-tab1">
                <ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab2" key="panel-tab2">
                <ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab3" key="panel-tab3">
                <ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
            </Tabs.Panel>]
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  render: function SizeAndOverflowPlaygroundRender(props) {
    const [fullWidth, setFullWidth] = useState(false);
    return <div>
                <div style={{
        maxWidth: '40rem',
        marginBottom: '1rem',
        color: 'var( --wpds-color-foreground-content-neutral )'
      }}>
                    <p>
                        This story helps understand how the TabList component
                        behaves under different conditions. The container below
                        (with the dotted red border) can be horizontally
                        resized, and it has a bit of padding to be out of the
                        way of the TabList.
                    </p>
                    <p>
                        The button will toggle between full width (adding{' '}
                        <code>width: 100%</code>) and the default width.
                    </p>
                    <p>Try the following:</p>
                    <ul>
                        <li>
                            <strong>Small container</strong> that causes tabs to
                            overflow with scroll.
                        </li>
                        <li>
                            <strong>Large container</strong> that exceeds the
                            normal width of the tabs.
                            <ul>
                                <li>
                                    <strong>
                                        With <code>width: 100%</code>
                                    </strong>{' '}
                                    set on the TabList (tabs fill up the space).
                                </li>
                                <li>
                                    <strong>
                                        Without <code>width: 100%</code>
                                    </strong>{' '}
                                    (defaults to <code>auto</code>) set on the
                                    TabList (tabs take up space proportional to
                                    their content).
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <button style={{
        marginBottom: '1rem'
      }} onClick={() => setFullWidth(!fullWidth)}>
                    {fullWidth ? 'Remove width: 100% from TabList' : 'Set width: 100% in TabList'}
                </button>
                <Tabs.Root {...props} style={{
        ...props.style,
        width: '20rem',
        border: '2px dotted red',
        padding: '1rem',
        resize: 'horizontal',
        overflow: 'auto'
      }}>
                    <Tabs.List style={{
          maxWidth: '100%',
          width: fullWidth ? '100%' : undefined
        }}>
                        <Tabs.Tab value="tab1">
                            Label with multiple words
                        </Tabs.Tab>
                        <Tabs.Tab value="tab2">Short</Tabs.Tab>
                        <Tabs.Tab value="tab3">
                            Hippopotomonstrosesquippedaliophobia
                        </Tabs.Tab>
                        <Tabs.Tab value="tab4">Tab 4</Tabs.Tab>
                        <Tabs.Tab value="tab5">Tab 5</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="tab1">
                        <ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
                        <ThemedParagraph>
                            (Label with multiple words)
                        </ThemedParagraph>
                    </Tabs.Panel>
                    <Tabs.Panel value="tab2">
                        <ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
                        <ThemedParagraph>(Short)</ThemedParagraph>
                    </Tabs.Panel>
                    <Tabs.Panel value="tab3">
                        <ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
                        <ThemedParagraph>
                            (Hippopotomonstrosesquippedaliophobia)
                        </ThemedParagraph>
                    </Tabs.Panel>
                    <Tabs.Panel value="tab4">
                        <ThemedParagraph>Selected tab: Tab 4</ThemedParagraph>
                    </Tabs.Panel>
                    <Tabs.Panel value="tab5">
                        <ThemedParagraph>Selected tab: Tab 5</ThemedParagraph>
                    </Tabs.Panel>
                </Tabs.Root>
            </div>;
  },
  args: {
    ...Default.args,
    defaultValue: 'tab4'
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    orientation: 'vertical',
    style: {
      minWidth: '320px',
      display: 'grid',
      gridTemplateColumns: '120px 1fr',
      gap: '24px'
    }
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    defaultValue: 'tab3',
    children: [<Tabs.List key="list">
                <Tabs.Tab value="tab1" disabled>
                    Tab 1
                </Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
            </Tabs.List>, <Tabs.Panel value="tab1" key="panel-tab1">
                <ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab2" key="panel-tab2">
                <ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab3" key="panel-tab3">
                <ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
            </Tabs.Panel>]
  }
}`,...J.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [<Tabs.List key="list">
                {tabWithIconsData.map(({
        value,
        label,
        icon
      }) => <Tooltip.Root key={value}>
                        <Tooltip.Trigger aria-label={label} render={<Tabs.Tab value={value} />}>
                            <Icon icon={icon} size={20} />
                        </Tooltip.Trigger>
                        <Tooltip.Popup positioner={<Tooltip.Positioner align="center" side="top" />}>
                            {label}
                        </Tooltip.Popup>
                    </Tooltip.Root>)}
            </Tabs.List>, tabWithIconsData.map(({
      value,
      label
    }) => <Tabs.Panel value={value} key={value}>
                    <ThemedParagraph>Selected tab: {label}</ThemedParagraph>
                </Tabs.Panel>)]
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [<Tabs.List key="list">
                <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
            </Tabs.List>, <Tabs.Panel value="tab1" keepMounted key="panel-tab1">
                <ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab2" keepMounted key="panel-tab2">
                <ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
            </Tabs.Panel>, <Tabs.Panel value="tab3" keepMounted key="panel-tab3">
                <ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
            </Tabs.Panel>]
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [<Tabs.List key="list">
                <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
            </Tabs.List>, <Tabs.Panel value="tab1" tabIndex={-1} key="panel-tab1">
                <ThemedParagraph>Selected tab: Tab 1</ThemedParagraph>
                <ThemedParagraph>
                    This tabpanel is not focusable, therefore tabbing into it
                    will focus its first tabbable child.
                </ThemedParagraph>
                <button>Focus me</button>
            </Tabs.Panel>, <Tabs.Panel value="tab2" tabIndex={-1} key="panel-tab2">
                <ThemedParagraph>Selected tab: Tab 2</ThemedParagraph>
                <ThemedParagraph>
                    This tabpanel is not focusable, therefore tabbing into it
                    will focus its first tabbable child.
                </ThemedParagraph>
                <button>Focus me</button>
            </Tabs.Panel>, <Tabs.Panel value="tab3" tabIndex={-1} key="panel-tab3">
                <ThemedParagraph>Selected tab: Tab 3</ThemedParagraph>
                <ThemedParagraph>
                    This tabpanel is not focusable, therefore tabbing into it
                    will focus its first tabbable child.
                </ThemedParagraph>
                <button>Focus me</button>
            </Tabs.Panel>]
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 140,
    padding: 16,
    resize: 'horizontal',
    overflow: 'auto',
    boxSizing: 'content-box'
  }}>
            <Tabs.Root defaultValue="Content">
                <Tabs.List variant="minimal" aria-label="Resizable minimal tabs" style={{
        maxWidth: '100%'
      }}>
                    {['Content', 'Settings', 'Preview'].map(label => <Tabs.Tab key={label} value={label}>
                            {label}
                        </Tabs.Tab>)}
                </Tabs.List>
                {['Content', 'Settings', 'Preview'].map(label => <Tabs.Panel key={label} value={label}>
                        <ThemedParagraph>{label} panel</ThemedParagraph>
                    </Tabs.Panel>)}
            </Tabs.Root>
        </div>
}`,...$.parameters?.docs?.source},description:{story:`Resize the container to compare painted tab padding with actual overflow.`,...$.parameters?.docs?.description}}}})))()}init_index_story();export{W as Default,G as Minimal,$ as MinimalTabsOverflow,K as SizeAndOverflowPlayground,q as Vertical,J as WithDisabledTab,Q as WithNonFocusablePanels,Z as WithPanelsAlwaysMounted,X as WithTabIconsAndTooltips,U as default};