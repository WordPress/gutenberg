import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,yc as a}from"./build-module-CPA2Y5FH.js";import{n as o,t as s}from"./private-apis-CatBCZ8C.js";import{n as c,t as l}from"./button-CwFwETKD.js";import{r as u,t as d}from"./lock-unlock-CS5FdW0l.js";function TabbedSidebar({defaultTabId:e,onClose:t,onSelect:n,selectedTab:r,tabs:i,closeButtonLabel:o},s){return(0,f.jsx)(`div`,{className:`block-editor-tabbed-sidebar`,children:(0,f.jsxs)(p,{selectOnMove:!1,defaultTabId:e,onSelect:n,selectedTabId:r,children:[(0,f.jsxs)(`div`,{className:`block-editor-tabbed-sidebar__tablist-and-close-button`,children:[(0,f.jsx)(l,{className:`block-editor-tabbed-sidebar__close-button`,icon:a,label:o,onClick:()=>t(),size:`compact`}),(0,f.jsx)(p.TabList,{className:`block-editor-tabbed-sidebar__tablist`,ref:s,children:i.map(e=>(0,f.jsx)(p.Tab,{tabId:e.name,className:`block-editor-tabbed-sidebar__tab`,children:e.title},e.name))})]}),i.map(e=>(0,f.jsx)(p.TabPanel,{tabId:e.name,focusable:!1,className:`block-editor-tabbed-sidebar__tabpanel`,ref:e.panelRef,children:e.panel},e.name))]})})}var f,p,m;function init_tabbed_sidebar(){return(init_tabbed_sidebar=e((()=>{c(),s(),n(),i(),d(),f=t(),{Tabs:p}=u(o),m=(0,r.forwardRef)(TabbedSidebar);try{TabbedSidebar.__docgenInfo={description:`A component that creates a tabbed sidebar with a close button.`,displayName:`TabbedSidebar`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/tabbed-sidebar/index.tsx`,methods:[],props:{},tags:{see:`https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/tabbed-sidebar/README.md`,example:`\`\`\`jsx
function MyTabbedSidebar() {
  return (
    <TabbedSidebar
      tabs={ [
        {
          name: 'tab1',
          title: 'Settings',
          panel: <PanelContents />,
        }
      ] }
      onClose={ () => {} }
      onSelect={ () => {} }
      defaultTabId="tab1"
      selectedTab="tab1"
      closeButtonLabel="Close sidebar"
    />
  );
}
\`\`\``,param:`props Component props.
props.defaultTabId The ID of the tab to be selected by default when the component renders.
props.onClose Function called when the close button is clicked.
props.onSelect Function called when a tab is selected. Receives the selected tab's ID as an argument.
props.selectedTab The ID of the currently selected tab.
props.tabs Array of tab objects. Each tab should have: name (string), title (string),
panel (React.Node), and optionally panelRef (React.Ref).
props.closeButtonLabel Accessibility label for the close button.
ref Forward ref to the tabs list element.`,return:`The tabbed sidebar component.`}}}catch{}})))()}export{m as n,init_tabbed_sidebar as t};