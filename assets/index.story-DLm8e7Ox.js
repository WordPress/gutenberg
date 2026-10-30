import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./build-module-CqL0UdL5.js";import{n as i,t as a}from"./button-D2QAmS6r.js";import{n as o,t as s}from"./warning-BNpC4Xs5.js";var c,l,u,d,f;function init_index_story(){return(init_index_story=e((()=>{r(),i(),o(),c=t(),l={id:`blockeditor-warning`,title:`Editor/Block Editor/Warning`,component:s,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`Displays a warning message with optional action buttons and secondary actions dropdown.`}}},argTypes:{children:{control:`text`,description:`Intended to represent the block to which the warning pertains.`,table:{type:{summary:`string|element`}}},className:{control:`text`,description:`Classes to pass to element.`,table:{type:{summary:`string`}}},actions:{control:`object`,description:`An array of elements to be rendered as action buttons in the warning element.`,table:{type:{summary:`Element[]`}}},secondaryActions:{control:`object`,description:`An array of { title, onClick } to be rendered as options in a dropdown of secondary actions.`,table:{type:{summary:`{ title: string, onClick: Function }[]`}}}}},u={args:{children:n(`This block ran into an issue.`)}},d={args:{...u.args,actions:[(0,c.jsx)(a,{__next40pxDefaultSize:!0,variant:`primary`,children:n(`Fix issue`)},`fix-issue`)]}},f={args:{...u.args,secondaryActions:[{title:n(`Get help`)},{title:n(`Remove block`)}]}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    children: __('This block ran into an issue.')
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    actions: [<Button key="fix-issue" __next40pxDefaultSize variant="primary">
                {__('Fix issue')}
            </Button>]
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    secondaryActions: [{
      title: __('Get help')
    }, {
      title: __('Remove block')
    }]
  }
}`,...f.parameters?.docs?.source}}}})))()}init_index_story();export{u as Default,d as WithActions,f as WithSecondaryActions,l as default};