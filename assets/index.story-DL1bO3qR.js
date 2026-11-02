import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./build-module-HHKy9azc.js";import{o as i,r as a}from"./use-context-system-CiYx-c7e.js";import{n as o,r as s}from"./component-OK27OdD1.js";function UnconnectedDeprecatedElevation(e,t){return r(`wp.components.__experimentalElevation`,{since:`7.2`,version:`7.4`}),o(e,t)}var c;function init_deprecated(){return(init_deprecated=e((()=>{n(),i(),s(),c=a(UnconnectedDeprecatedElevation,`Elevation`)})))()}var l,u,Template,InteractiveTemplate,d,f,p;function init_index_story(){return(init_index_story=e((()=>{init_deprecated(),l=t(),u={component:c,title:`Components/@wordpress-components/Deprecated/Elevation`,id:`components-elevation`,argTypes:{as:{control:{type:`text`}},borderRadius:{control:{type:`text`}}},tags:[`status-experimental`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Deprecated. Use [`elevation tokens`](?path=/docs/foundations-design-language-elevation--page) from `@wordpress/base-styles` instead."}}},Template=e=>(0,l.jsx)(`div`,{style:{width:150,height:150,position:`relative`},children:(0,l.jsx)(c,{...e})}),InteractiveTemplate=e=>(0,l.jsxs)(`button`,{style:{border:0,background:`transparent`,width:150,height:150,position:`relative`},children:[`Click me`,(0,l.jsx)(c,{...e})]}),d=Template.bind({}),d.args={value:5},f=InteractiveTemplate.bind({}),f.args={...d.args,isInteractive:!0},p=InteractiveTemplate.bind({}),p.args={...d.args,hover:7,active:1,focus:10};try{f.__docgenInfo={description:"Enable the `isInteractive` prop to automatically generate values\nfor the hover/active/focus states.",displayName:`WithInteractive`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/elevation/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{p.__docgenInfo={description:"You can also provide custom values for the hover/active/focus states\ninstead of using the `isInteractive` prop.",displayName:`WithCustomInteractive`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/elevation/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`args => {
  return <div style={{
    width: 150,
    height: 150,
    position: 'relative'
  }}>
            <Elevation {...args} />
        </div>;
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`args => {
  return <button style={{
    border: 0,
    background: 'transparent',
    width: 150,
    height: 150,
    position: 'relative'
  }}>
            Click me
            <Elevation {...args} />
        </button>;
}`,...f.parameters?.docs?.source},description:{story:"Enable the `isInteractive` prop to automatically generate values\nfor the hover/active/focus states.",...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`args => {
  return <button style={{
    border: 0,
    background: 'transparent',
    width: 150,
    height: 150,
    position: 'relative'
  }}>
            Click me
            <Elevation {...args} />
        </button>;
}`,...p.parameters?.docs?.source},description:{story:"You can also provide custom values for the hover/active/focus states\ninstead of using the `isInteractive` prop.",...p.parameters?.docs?.description}}}})))()}init_index_story();export{d as Default,p as WithCustomInteractive,f as WithInteractive,u as default};