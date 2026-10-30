import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./tabbed-sidebar-D8UqpII_.js";var o,s,c,l;function init_index_story(){return(init_index_story=e((()=>{n(),a(),o=t(),s={id:`blockeditor-tabbedsidebar`,title:`Editor/Block Editor/TabbedSidebar`,component:i,tags:[`status-private`],parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`A component that creates a tabbed sidebar with a close button.`}}},argTypes:{defaultTabId:{control:{type:null},table:{type:{summary:`string`}},description:`The ID of the tab to be selected by default when the component renders.`},onClose:{action:`onClose`,control:{type:null},table:{type:{summary:`function`}},description:`Function called when the close button is clicked.`},onSelect:{action:`onSelect`,control:{type:null},table:{type:{summary:`function`}},description:`Function called when a tab is selected. Receives the selected tab's ID as an argument.`},selectedTab:{control:{type:null},table:{type:{summary:`string`}},description:`The ID of the currently selected tab.`},tabs:{control:{type:`array`},table:{type:{summary:`array`}},description:`Array of tab objects. Each tab should have: name (string), title (string), panel (React.Node), and optionally panelRef (React.Ref).`},closeButtonLabel:{control:{type:`text`},table:{type:{summary:`string`}},description:`Accessibility label for the close button.`}}},c=[{name:`tab1`,title:`Settings`},{name:`tab2`,title:`Styles`},{name:`tab3`,title:`Advanced`}],l={render:function Template({onSelect:e,onClose:t,...n}){let[a,s]=(0,r.useState)();return(0,o.jsx)(i,{...n,selectedTab:a,onSelect:(...t)=>{e(...t),s(...t)},onClose:t})},args:{tabs:c,defaultTabId:`tab1`,closeButtonLabel:`Close Sidebar`}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onSelect,
    onClose,
    ...args
  }) {
    const [selectedTab, setSelectedTab] = useState<string>();
    return <TabbedSidebar {...args} selectedTab={selectedTab} onSelect={(...changeArgs) => {
      onSelect(...changeArgs);
      setSelectedTab(...changeArgs);
    }} onClose={onClose} />;
  },
  args: {
    tabs: DEMO_TABS,
    defaultTabId: 'tab1',
    closeButtonLabel: 'Close Sidebar'
  }
}`,...l.parameters?.docs?.source}}}})))()}init_index_story();export{l as Default,s as default};