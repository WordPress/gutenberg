import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./use-instance-id-DuzD68j8.js";import{n as s,t as c}from"./use-merge-refs-BNmiIksj.js";import{n as l,t as u}from"./use-event-Cr6_a9Gc.js";import{o as d,t as f}from"./build-module-CqL0UdL5.js";import{a as p,i as m}from"./iframe-BbJPeSVw.js";import{n as h,t as g}from"./build-module-CRS35G3_.js";import{Ki as _,i as v,n as y,vi as b}from"./build-module-DttIWYbV.js";import{i as x,s as S}from"./CDh2UhnG-DKeuVzYY.js";import{a as C,c as w,i as ee,n as te,o as ne,r as re,s as ie,t as ae}from"./tab-store-degOW6A4.js";import{n as oe,t as se}from"./tooltip-kbkpfJje.js";import{n as ce,t as le}from"./icon-DQj1iRYw.js";import{n as ue,t as T}from"./button-01oyTe_f.js";import{i as de,n as fe,r as E,t as D}from"./use-animated-offset-rect-D7IXmsug.js";import{i as O,n as k,s as A,t as j}from"./slot-fill-aOtBDwg6.js";var M,useTabsContext;function init_context(){return(init_context=e((()=>{r(),M=(0,i.createContext)(void 0),M.displayName=`TabsContext`,useTabsContext=()=>(0,i.useContext)(M)})))()}var N,P;function init_style_module(){return(init_style_module=e((()=>{N=`_tab_nzzng_96`,P={"tab-list":`_tab-list_nzzng_96`,tab:N,"tab-children":`_tab-children_nzzng_261`,"tab-panel":`_tab-panel_nzzng_273`}})))()}var F,I;function init_tab(){return(init_tab=e((()=>{p(),w(),r(),g(),init_context(),init_style_module(),F=n(),I=(0,i.forwardRef)(function UnforwardedTab({children:e,tabId:t,disabled:n,render:r,className:i,...a},o){let{store:s,instanceId:c}=useTabsContext()??{};if(!s)return h("`Tabs.Tab` must be wrapped in a `Tabs` component."),null;let l=`${c}-${t}`;return(0,F.jsx)(ie,{ref:o,store:s,id:l,disabled:n,render:r,...a,className:m(P.tab,i),children:(0,F.jsx)(`span`,{className:P[`tab-children`],children:e})})});try{I.__docgenInfo={description:``,displayName:`Tab`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/tabs/tab.tsx`,methods:[],props:{disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`Determines if the tab should be disabled. Note that disabled tabs can
still be accessed via the keyboard when navigating through the tablist.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.

By default, the tab will be rendered as a \`button\` element.`,name:`render`,required:!1,tags:{},type:{name:`ReactElement<unknown, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The contents of the tab.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},tabId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"The unique ID of the tab. It will be used to register the tab and match\nit to a corresponding `Tabs.TabPanel` component.",name:`tabId`,required:!0,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}function useTrackOverflow(e,t){let[n,r]=(0,i.useState)(!1),[a,o]=(0,i.useState)(!1),[s,c]=(0,i.useState)(),u=l(e=>{for(let n of e)n.target===t.first&&r(!n.isIntersecting),n.target===t.last&&o(!n.isIntersecting)});return(0,i.useEffect)(()=>{if(!e||!window.IntersectionObserver)return;let t=new IntersectionObserver(u,{root:e,threshold:.9});return c(t),()=>t.disconnect()},[u,e]),(0,i.useEffect)(()=>{if(s)return t.first&&s.observe(t.first),t.last&&s.observe(t.last),()=>{t.first&&s.unobserve(t.first),t.last&&s.unobserve(t.last)}},[t.first,t.last,s]),{first:n,last:a}}function init_use_track_overflow(){return(init_use_track_overflow=e((()=>{r(),u()})))()}function useScrollRectIntoView(e,t,{margin:n=R}={}){(0,i.useLayoutEffect)(()=>{if(!e||!t)return;let{scrollLeft:r}=e,i=e.getBoundingClientRect().width,{left:a,width:o}=t,s=r+i,c=a+o+n-s,l=r-(a-n),u=null;l>0?u=r-l:c>0&&(u=r+c),u!==null&&e.scroll?.({left:u})},[n,e,t])}var L,R,z;function init_tablist(){return(init_tablist=e((()=>{x(),ne(),p(),g(),r(),c(),init_context(),init_style_module(),E(),init_use_track_overflow(),D(),L=n(),R=24,z=(0,i.forwardRef)(function UnforwardedTabList({children:e,...t},n){let{store:r}=useTabsContext()??{},a=S(r,`selectedId`),o=S(r,`selectOnMove`),c=S(r,`items`),[l,u]=(0,i.useState)(),d=s([n,u]),f=r?.item(a),p=S(r,`renderedItems`),g=p&&f?p.indexOf(f):-1,_=de(f?.element,[g]),v=useTrackOverflow(l,{first:c?.at(0)?.element,last:c?.at(-1)?.element});return fe(l,_,{prefix:`selected`,dataAttribute:`indicator-animated`,transitionEndFilter:e=>e.pseudoElement===`::before`,roundRect:!0}),useScrollRectIntoView(l,_),r?(0,L.jsx)(C,{ref:d,store:r,render:e=>(0,L.jsx)(`div`,{...e,tabIndex:e.tabIndex??-1}),"data-select-on-move":o?`true`:`false`,...t,className:m(P[`tab-list`],v.first&&`is-overflowing-first`,v.last&&`is-overflowing-last`,t.className),children:e}):(h("`Tabs.TabList` must be wrapped in a `Tabs` component."),null)});try{z.__docgenInfo={description:``,displayName:`TabList`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/tabs/tablist.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"The children elements, which should include one or more instances of the\n`Tabs.Tab` component.",name:`children`,required:!0,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var B,V;function init_tabpanel(){return(init_tabpanel=e((()=>{x(),ee(),p(),r(),g(),init_style_module(),init_context(),B=n(),V=(0,i.forwardRef)(function UnforwardedTabPanel({children:e,tabId:t,focusable:n=!0,className:r,...i},a){let o=useTabsContext(),s=S(o?.store,`selectedId`);if(!o)return h("`Tabs.TabPanel` must be wrapped in a `Tabs` component."),null;let{store:c,instanceId:l}=o,u=`${l}-${t}`;return(0,B.jsx)(re,{ref:a,store:c,id:`${u}-view`,tabId:u,focusable:n,...i,className:m(P[`tab-panel`],r),children:s===u&&e})});try{V.__docgenInfo={description:``,displayName:`TabPanel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/tabs/tabpanel.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The contents of the tab panel.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},focusable:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`Determines whether or not the tabpanel element should be focusable.
If \`false\`, pressing the tab key will skip over the tabpanel, and instead
focus on the first focusable element in the panel (if there is one).`,name:`focusable`,required:!1,tags:{},type:{name:`boolean`}},tabId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"The unique `id` of the `Tabs.Tab` component controlling this panel. This\nconnection is used to assign the `aria-labelledby` attribute to the tab\npanel and to determine if the tab panel should be visible.\n\nIf not provided, this link is automatically established by matching the\norder of `Tabs.Tab` and `Tabs.TabPanel` elements in the DOM.",name:`tabId`,required:!0,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}function externalToInternalTabId(e,t){return e&&`${t}-${e}`}function internalToExternalTabId(e,t){return typeof e==`string`?e.replace(`${t}-`,``):e}var H,U;function init_tabs(){return(init_tabs=e((()=>{ae(),o(),r(),f(),init_context(),init_tab(),init_tablist(),init_tabpanel(),H=n(),U=Object.assign(function TabsRoot({selectOnMove:e=!0,defaultTabId:t,orientation:n=`horizontal`,onSelect:r,children:o,selectedTabId:s,activeTabId:c,defaultActiveTabId:l,onActiveTabIdChange:u}){let f=a(TabsRoot,`tabs`),p=te({selectOnMove:e,orientation:n,defaultSelectedId:externalToInternalTabId(t,f),setSelectedId:e=>{r?.(internalToExternalTabId(e,f))},selectedId:externalToInternalTabId(s,f),defaultActiveId:externalToInternalTabId(l,f),setActiveId:e=>{u?.(internalToExternalTabId(e,f))},activeId:externalToInternalTabId(c,f),rtl:d()}),m=(0,i.useMemo)(()=>({store:p,instanceId:f}),[p,f]);return(0,H.jsx)(M.Provider,{value:m,children:o})},{Tab:Object.assign(I,{displayName:`Tabs.Tab`}),TabList:Object.assign(z,{displayName:`Tabs.TabList`}),TabPanel:Object.assign(V,{displayName:`Tabs.TabPanel`}),Context:Object.assign(M,{displayName:`Tabs.Context`})});try{U.__docgenInfo={description:`Tabs is a collection of React components that combine to render
an [ARIA-compliant tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

Tabs organizes content across different screens, data sets, and interactions.
It has two sections: a list of tabs, and the view to show when a tab is chosen.

\`Tabs\` itself is a wrapper component and context provider.
It is responsible for managing the state of the tabs, and rendering one instance of the \`Tabs.TabList\` component and one or more instances of the \`Tab.TabPanel\` component.`,displayName:`Tabs`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/tabs/index.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"The children elements, which should include one instance of the\n`Tabs.Tablist` component and as many instances of the `Tabs.TabPanel`\ncomponents as there are `Tabs.Tab` components.",name:`children`,required:!0,tags:{},type:{name:`ReactNode`}},selectOnMove:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`Determines if the tab should be selected when it receives focus. If set to
\`false\`, the tab will only be selected upon clicking, not when using arrow
keys to shift focus (manual tab activation). See the [official W3C docs](https://www.w3.org/WAI/ARIA/apg/patterns/tabpanel/)
for more info.`,name:`selectOnMove`,required:!1,tags:{},type:{name:`boolean`}},selectedTabId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The id of the tab whose panel is currently visible.

If left \`undefined\`, it will be automatically set to the first enabled
tab, and the component assumes it is being used in "uncontrolled" mode.

Consequently, any value different than \`undefined\` will set the component
in "controlled" mode. When in "controlled" mode, the \`null\` value will
result in no tabs being selected, and the tablist becoming tabbable.`,name:`selectedTabId`,required:!1,tags:{},type:{name:`string | null`}},defaultTabId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The id of the tab whose panel is currently visible.

If left \`undefined\`, it will be automatically set to the first enabled
tab. If set to \`null\`, no tab will be selected, and the tablist will be
tabbable.

Note: this prop will be overridden by the \`selectedTabId\` prop if it is
provided (meaning the component will be used in "controlled" mode).`,name:`defaultTabId`,required:!1,tags:{},type:{name:`string | null`}},onSelect:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"The function called when the `selectedTabId` changes.",name:`onSelect`,required:!1,tags:{},type:{name:`((selectedId: string | null) => void)`}},activeTabId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"The current active tab `id`. The active tab is the tab element within the\ntablist widget that has DOM focus.\n\n- `null` represents the tablist (ie. the base composite element). Users\n  will be able to navigate out of it using arrow keys.\n- If `activeTabId` is initially set to `null`, the base composite element\n  itself will have focus and users will be able to navigate to it using\n  arrow keys.",name:`activeTabId`,required:!1,tags:{},type:{name:`string | null`}},defaultActiveTabId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:`The tab id that should be active by default when the composite widget is
rendered. If \`null\`, the tablist element itself will have focus
and users will be able to navigate to it using arrow keys. If \`undefined\`,
the first enabled item will be focused.

Note: this prop will be overridden by the \`activeTabId\` prop if it is
provided.`,name:`defaultActiveTabId`,required:!1,tags:{},type:{name:`string | null`}},onActiveTabIdChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"A callback that gets called when the `activeTabId` state changes.",name:`onActiveTabIdChange`,required:!1,tags:{},type:{name:`((activeId: string | null) => void)`}},orientation:{defaultValue:{value:`"horizontal"`},declarations:[{fileName:`gutenberg/packages/components/src/tabs/types.ts`,name:`TypeLiteral`}],description:"Defines the orientation of the tablist and determines which arrow keys\ncan be used to move focus:\n\n- `both`: all arrow keys work.\n- `horizontal`: only left and right arrow keys work.\n- `vertical`: only up and down arrow keys work.",name:`orientation`,required:!1,tags:{},type:{name:`enum`,raw:`Orientation`,value:[{value:`"both"`},{value:`"horizontal"`},{value:`"vertical"`}]}}},tags:{}}}catch{}})))()}var pe=t({Default:()=>q,DisabledTab:()=>Y,InsertCustomElements:()=>$,ManualActivation:()=>Z,SizeAndOverflowPlayground:()=>SizeAndOverflowPlayground,UsingSlotFill:()=>Q,Vertical:()=>J,WithTabIconsAndTooltips:()=>X,default:()=>K}),W,G,K,Template,q,SizeAndOverflowPlayground,VerticalTemplate,J,DisabledTabTemplate,Y,WithTabIconsAndTooltipsTemplate,X,Z,UsingSlotFillTemplate,Q,CloseButtonTemplate,$;function init_index_story(){return(init_index_story=e((()=>{y(),r(),init_tabs(),O(),ue(),oe(),ce(),W=n(),{fn:G}=__STORYBOOK_MODULE_TEST__,K={title:`Components/@wordpress-components/Containers/Tabs`,id:`components-tabs`,component:U,subcomponents:{"Tabs.TabList":U.TabList,"Tabs.Tab":U.Tab,"Tabs.TabPanel":U.TabPanel,"Tabs.Context":U.Context},tags:[`status-private`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`Tabs`](?path=/docs/design-system-components-tabs--docs) from `@wordpress/ui` instead."}},args:{onActiveTabIdChange:G(),onSelect:G()}},Template=e=>(0,W.jsxs)(U,{...e,children:[(0,W.jsxs)(U.TabList,{children:[(0,W.jsx)(U.Tab,{tabId:`tab1`,children:`Tab 1`}),(0,W.jsx)(U.Tab,{tabId:`tab2`,children:`Tab 2`}),(0,W.jsx)(U.Tab,{tabId:`tab3`,children:`Tab 3`})]}),(0,W.jsx)(U.TabPanel,{tabId:`tab1`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 1`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab2`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 2`})}),(0,W.jsxs)(U.TabPanel,{tabId:`tab3`,focusable:!1,children:[(0,W.jsx)(`p`,{children:`Selected tab: Tab 3`}),(0,W.jsxs)(`p`,{children:[`This tabpanel has its `,(0,W.jsx)(`code`,{children:`focusable`}),` prop set to`,(0,W.jsx)(`code`,{children:` false`}),`, so it won't get a tab stop.`,(0,W.jsx)(`br`,{}),`Instead, the [Tab] key will move focus to the first focusable element within the panel.`]}),(0,W.jsx)(T,{__next40pxDefaultSize:!0,variant:`primary`,children:`I'm a button!`})]})]}),q=Template.bind({}),SizeAndOverflowPlayground=e=>{let[t,n]=(0,i.useState)(!1);return(0,W.jsxs)(`div`,{children:[(0,W.jsxs)(`div`,{style:{maxWidth:`40rem`,marginBottom:`1rem`},children:[(0,W.jsx)(`p`,{children:`This story helps understand how the TabList component behaves under different conditions. The container below (with the dotted red border) can be horizontally resized, and it has a bit of padding to be out of the way of the TabList.`}),(0,W.jsxs)(`p`,{children:[`The button will toggle between full width (adding`,` `,(0,W.jsx)(`code`,{children:`width: 100%`}),`) and the default width.`]}),(0,W.jsx)(`p`,{children:`Try the following:`}),(0,W.jsxs)(`ul`,{children:[(0,W.jsxs)(`li`,{children:[(0,W.jsx)(`strong`,{children:`Small container`}),` that causes tabs to overflow with scroll.`]}),(0,W.jsxs)(`li`,{children:[(0,W.jsx)(`strong`,{children:`Large container`}),` that exceeds the normal width of the tabs.`,(0,W.jsxs)(`ul`,{children:[(0,W.jsxs)(`li`,{children:[(0,W.jsxs)(`strong`,{children:[`With `,(0,W.jsx)(`code`,{children:`width: 100%`})]}),` `,`set on the TabList (tabs fill up the space).`]}),(0,W.jsxs)(`li`,{children:[(0,W.jsxs)(`strong`,{children:[`Without `,(0,W.jsx)(`code`,{children:`width: 100%`})]}),` `,`(defaults to `,(0,W.jsx)(`code`,{children:`auto`}),`) set on the TabList (tabs take up space proportional to their content).`]})]})]})]})]}),(0,W.jsx)(T,{__next40pxDefaultSize:!0,style:{marginBottom:`1rem`},variant:`primary`,onClick:()=>n(!t),children:t?`Remove width: 100% from TabList`:`Set width: 100% in TabList`}),(0,W.jsxs)(U,{...e,children:[(0,W.jsx)(`div`,{style:{width:`20rem`,border:`2px dotted red`,padding:`1rem`,resize:`horizontal`,overflow:`auto`},children:(0,W.jsxs)(U.TabList,{style:{maxWidth:`100%`,width:t?`100%`:void 0},children:[(0,W.jsx)(U.Tab,{tabId:`tab1`,children:`Label with multiple words`}),(0,W.jsx)(U.Tab,{tabId:`tab2`,children:`Short`}),(0,W.jsx)(U.Tab,{tabId:`tab3`,children:`Hippopotomonstrosesquippedaliophobia`}),(0,W.jsx)(U.Tab,{tabId:`tab4`,children:`Tab 4`}),(0,W.jsx)(U.Tab,{tabId:`tab5`,children:`Tab 5`})]})}),(0,W.jsxs)(U.TabPanel,{tabId:`tab1`,children:[(0,W.jsx)(`p`,{children:`Selected tab: Tab 1`}),(0,W.jsx)(`p`,{children:`(Label with multiple words)`})]}),(0,W.jsxs)(U.TabPanel,{tabId:`tab2`,children:[(0,W.jsx)(`p`,{children:`Selected tab: Tab 2`}),(0,W.jsx)(`p`,{children:`(Short)`})]}),(0,W.jsxs)(U.TabPanel,{tabId:`tab3`,children:[(0,W.jsx)(`p`,{children:`Selected tab: Tab 3`}),(0,W.jsx)(`p`,{children:`(Hippopotomonstrosesquippedaliophobia)`})]}),(0,W.jsx)(U.TabPanel,{tabId:`tab4`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 4`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab5`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 5`})})]})]})},SizeAndOverflowPlayground.args={defaultTabId:`tab4`},VerticalTemplate=e=>(0,W.jsx)(U,{orientation:`vertical`,...e,children:(0,W.jsxs)(U.TabList,{style:{maxWidth:`10rem`},children:[(0,W.jsx)(U.Tab,{tabId:`tab1`,children:`Tab 1`}),(0,W.jsx)(U.Tab,{tabId:`tab2`,children:`Tab 2`}),(0,W.jsx)(U.Tab,{tabId:`tab3`,children:`Tab 3`})]})}),J=VerticalTemplate.bind({}),DisabledTabTemplate=e=>(0,W.jsxs)(U,{...e,children:[(0,W.jsxs)(U.TabList,{children:[(0,W.jsx)(U.Tab,{tabId:`tab1`,disabled:!0,children:`Tab 1`}),(0,W.jsx)(U.Tab,{tabId:`tab2`,children:`Tab 2`}),(0,W.jsx)(U.Tab,{tabId:`tab3`,children:`Tab 3`})]}),(0,W.jsx)(U.TabPanel,{tabId:`tab1`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 1`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab2`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 2`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab3`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 3`})})]}),Y=DisabledTabTemplate.bind({}),WithTabIconsAndTooltipsTemplate=e=>(0,W.jsxs)(U,{...e,children:[(0,W.jsx)(U.TabList,{children:[{id:`tab1`,label:`Tab one`,icon:v},{id:`tab2`,label:`Tab two`,icon:_},{id:`tab3`,label:`Tab three`,icon:b}].map(({id:e,label:t,icon:n})=>(0,W.jsx)(se,{text:t,children:(0,W.jsx)(U.Tab,{tabId:e,"aria-label":t,children:(0,W.jsx)(le,{icon:n})})},e))}),(0,W.jsx)(U.TabPanel,{tabId:`tab1`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 1`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab2`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 2`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab3`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 3`})})]}),X=WithTabIconsAndTooltipsTemplate.bind({}),Z=Template.bind({}),Z.args={selectOnMove:!1},UsingSlotFillTemplate=e=>(0,W.jsxs)(j,{children:[(0,W.jsxs)(U,{...e,children:[(0,W.jsxs)(U.TabList,{children:[(0,W.jsx)(U.Tab,{tabId:`tab1`,children:`Tab 1`}),(0,W.jsx)(U.Tab,{tabId:`tab2`,children:`Tab 2`}),(0,W.jsx)(U.Tab,{tabId:`tab3`,children:`Tab 3`})]}),(0,W.jsxs)(A,{name:`tabs-are-fun`,children:[(0,W.jsx)(U.TabPanel,{tabId:`tab1`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 1`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab2`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 2`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab3`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 3`})})]})]}),(0,W.jsxs)(`div`,{style:{border:`2px solid #999`,width:`300px`,margin:`20px auto`},children:[(0,W.jsx)(`p`,{children:`other stuff`}),(0,W.jsx)(`p`,{children:`other stuff`}),(0,W.jsx)(`p`,{children:`this is fun!`}),(0,W.jsx)(`p`,{children:`other stuff`}),(0,W.jsx)(k,{bubblesVirtually:!0,as:`div`,name:`tabs-are-fun`})]})]}),Q=UsingSlotFillTemplate.bind({}),Q.storyName=`Using SlotFill`,CloseButtonTemplate=e=>{let[t,n]=(0,i.useState)(!0);return(0,W.jsx)(W.Fragment,{children:t?(0,W.jsx)(`div`,{style:{width:`400px`,height:`100vh`,borderRight:`1px solid #333`},children:(0,W.jsxs)(U,{...e,children:[(0,W.jsxs)(`div`,{style:{display:`flex`,borderBottom:`1px solid #333`},children:[(0,W.jsxs)(U.TabList,{children:[(0,W.jsx)(U.Tab,{tabId:`tab1`,children:`Tab 1`}),(0,W.jsx)(U.Tab,{tabId:`tab2`,children:`Tab 2`}),(0,W.jsx)(U.Tab,{tabId:`tab3`,children:`Tab 3`})]}),(0,W.jsx)(T,{__next40pxDefaultSize:!0,variant:`tertiary`,style:{marginLeft:`auto`,alignSelf:`center`},onClick:()=>n(!1),children:`Close Tabs`})]}),(0,W.jsx)(U.TabPanel,{tabId:`tab1`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 1`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab2`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 2`})}),(0,W.jsx)(U.TabPanel,{tabId:`tab3`,children:(0,W.jsx)(`p`,{children:`Selected tab: Tab 3`})})]})}):(0,W.jsx)(T,{__next40pxDefaultSize:!0,variant:`tertiary`,onClick:()=>n(!0),children:`Open Tabs`})})},$=CloseButtonTemplate.bind({}),q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`props => {
  return <Tabs {...props}>
            <Tabs.TabList>
                <Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
            </Tabs.TabList>
            <Tabs.TabPanel tabId="tab1">
                <p>Selected tab: Tab 1</p>
            </Tabs.TabPanel>
            <Tabs.TabPanel tabId="tab2">
                <p>Selected tab: Tab 2</p>
            </Tabs.TabPanel>
            <Tabs.TabPanel tabId="tab3" focusable={false}>
                <p>Selected tab: Tab 3</p>
                <p>
                    This tabpanel has its <code>focusable</code> prop set to
                    <code> false</code>, so it won&apos;t get a tab stop.
                    <br />
                    Instead, the [Tab] key will move focus to the first
                    focusable element within the panel.
                </p>
                <Button __next40pxDefaultSize variant="primary">
                    I&apos;m a button!
                </Button>
            </Tabs.TabPanel>
        </Tabs>;
}`,...q.parameters?.docs?.source}}},SizeAndOverflowPlayground.parameters={...SizeAndOverflowPlayground.parameters,docs:{...SizeAndOverflowPlayground.parameters?.docs,source:{originalSource:`props => {
  const [fullWidth, setFullWidth] = useState(false);
  return <div>
            <div style={{
      maxWidth: '40rem',
      marginBottom: '1rem'
    }}>
                <p>
                    This story helps understand how the TabList component
                    behaves under different conditions. The container below
                    (with the dotted red border) can be horizontally resized,
                    and it has a bit of padding to be out of the way of the
                    TabList.
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
                        <strong>Large container</strong> that exceeds the normal
                        width of the tabs.
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
            <Button __next40pxDefaultSize style={{
      marginBottom: '1rem'
    }} variant="primary" onClick={() => setFullWidth(!fullWidth)}>
                {fullWidth ? 'Remove width: 100% from TabList' : 'Set width: 100% in TabList'}
            </Button>
            <Tabs {...props}>
                <div style={{
        width: '20rem',
        border: '2px dotted red',
        padding: '1rem',
        resize: 'horizontal',
        overflow: 'auto'
      }}>
                    <Tabs.TabList style={{
          maxWidth: '100%',
          width: fullWidth ? '100%' : undefined
        }}>
                        <Tabs.Tab tabId="tab1">
                            Label with multiple words
                        </Tabs.Tab>
                        <Tabs.Tab tabId="tab2">Short</Tabs.Tab>
                        <Tabs.Tab tabId="tab3">
                            Hippopotomonstrosesquippedaliophobia
                        </Tabs.Tab>
                        <Tabs.Tab tabId="tab4">Tab 4</Tabs.Tab>
                        <Tabs.Tab tabId="tab5">Tab 5</Tabs.Tab>
                    </Tabs.TabList>
                </div>
                <Tabs.TabPanel tabId="tab1">
                    <p>Selected tab: Tab 1</p>
                    <p>(Label with multiple words)</p>
                </Tabs.TabPanel>
                <Tabs.TabPanel tabId="tab2">
                    <p>Selected tab: Tab 2</p>
                    <p>(Short)</p>
                </Tabs.TabPanel>
                <Tabs.TabPanel tabId="tab3">
                    <p>Selected tab: Tab 3</p>
                    <p>(Hippopotomonstrosesquippedaliophobia)</p>
                </Tabs.TabPanel>
                <Tabs.TabPanel tabId="tab4">
                    <p>Selected tab: Tab 4</p>
                </Tabs.TabPanel>
                <Tabs.TabPanel tabId="tab5">
                    <p>Selected tab: Tab 5</p>
                </Tabs.TabPanel>
            </Tabs>
        </div>;
}`,...SizeAndOverflowPlayground.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`props => {
  return <Tabs orientation="vertical" {...props}>
            <Tabs.TabList style={{
      maxWidth: '10rem'
    }}>
                <Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
            </Tabs.TabList>
        </Tabs>;
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`props => {
  return <Tabs {...props}>
            <Tabs.TabList>
                <Tabs.Tab tabId="tab1" disabled>
                    Tab 1
                </Tabs.Tab>
                <Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
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
        </Tabs>;
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`props => {
  return <Tabs {...props}>
            <Tabs.TabList>
                {[{
        id: 'tab1',
        label: 'Tab one',
        icon: wordpress
      }, {
        id: 'tab2',
        label: 'Tab two',
        icon: link
      }, {
        id: 'tab3',
        label: 'Tab three',
        icon: more
      }].map(({
        id,
        label,
        icon
      }) => <Tooltip text={label} key={id}>
                        <Tabs.Tab tabId={id} aria-label={label}>
                            <Icon icon={icon} />
                        </Tabs.Tab>
                    </Tooltip>)}
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
        </Tabs>;
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`props => {
  return <Tabs {...props}>
            <Tabs.TabList>
                <Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
                <Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
                <Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
            </Tabs.TabList>
            <Tabs.TabPanel tabId="tab1">
                <p>Selected tab: Tab 1</p>
            </Tabs.TabPanel>
            <Tabs.TabPanel tabId="tab2">
                <p>Selected tab: Tab 2</p>
            </Tabs.TabPanel>
            <Tabs.TabPanel tabId="tab3" focusable={false}>
                <p>Selected tab: Tab 3</p>
                <p>
                    This tabpanel has its <code>focusable</code> prop set to
                    <code> false</code>, so it won&apos;t get a tab stop.
                    <br />
                    Instead, the [Tab] key will move focus to the first
                    focusable element within the panel.
                </p>
                <Button __next40pxDefaultSize variant="primary">
                    I&apos;m a button!
                </Button>
            </Tabs.TabPanel>
        </Tabs>;
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`props => {
  return <SlotFillProvider>
            <Tabs {...props}>
                <Tabs.TabList>
                    <Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
                    <Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
                    <Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
                </Tabs.TabList>
                <Fill name="tabs-are-fun">
                    <Tabs.TabPanel tabId="tab1">
                        <p>Selected tab: Tab 1</p>
                    </Tabs.TabPanel>
                    <Tabs.TabPanel tabId="tab2">
                        <p>Selected tab: Tab 2</p>
                    </Tabs.TabPanel>
                    <Tabs.TabPanel tabId="tab3">
                        <p>Selected tab: Tab 3</p>
                    </Tabs.TabPanel>
                </Fill>
            </Tabs>
            <div style={{
      border: '2px solid #999',
      width: '300px',
      margin: '20px auto'
    }}>
                <p>other stuff</p>
                <p>other stuff</p>
                <p>this is fun!</p>
                <p>other stuff</p>
                <Slot bubblesVirtually as="div" name="tabs-are-fun" />
            </div>
        </SlotFillProvider>;
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`props => {
  const [isOpen, setIsOpen] = useState(true);
  return <>
            {isOpen ? <div style={{
      width: '400px',
      height: '100vh',
      borderRight: '1px solid #333'
    }}>
                    <Tabs {...props}>
                        <div style={{
          display: 'flex',
          borderBottom: '1px solid #333'
        }}>
                            <Tabs.TabList>
                                <Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
                                <Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
                                <Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
                            </Tabs.TabList>
                            <Button __next40pxDefaultSize variant="tertiary" style={{
            marginLeft: 'auto',
            alignSelf: 'center'
          }} onClick={() => setIsOpen(false)}>
                                Close Tabs
                            </Button>
                        </div>
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
                </div> : <Button __next40pxDefaultSize variant="tertiary" onClick={() => setIsOpen(true)}>
                    Open Tabs
                </Button>}
        </>;
}`,...$.parameters?.docs?.source}}}})))()}export{init_index_story as n,pe as t};