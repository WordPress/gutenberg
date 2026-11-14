import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./input-BQYHFnxZ.js";import{n as a,t as o}from"./input-layout-CTbwDP-j.js";import{r as s,t as c}from"./index.story-CCoSUQwd.js";var l=t({Default:()=>f,Disabled:()=>h,ReadOnly:()=>g,WithPrefix:()=>p,WithSuffixControl:()=>m,default:()=>d}),u,d,f,p,m,h,g;function init_index_story(){return(init_index_story=e((()=>{r(),a(),s(),u=n(),d={tags:[`manifest`],title:`Components/@wordpress-ui/Form/Primitives/Input`,id:`design-system-components-form-primitives-input`,component:i,argTypes:{defaultValue:{control:!1},onValueChange:{action:`onValueChange`},value:{control:!1},type:{control:`text`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},f={args:{placeholder:`Placeholder`,"aria-label":`Value`}},p={args:{placeholder:`username`,"aria-label":`Username`,prefix:(0,u.jsx)(o.Slot,{children:`@`})}},m={args:{"aria-label":`Value`,suffix:c.args?.suffix}},h={args:{...f.args,defaultValue:`Disabled value`,disabled:!0}},g={args:{...f.args,defaultValue:`Read-only value`,readOnly:!0}};try{p.__docgenInfo={description:"The `InputLayout.Slot` component can be used to add standard padding in\nthe `prefix` or `suffix` slot.",displayName:`WithPrefix`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/input/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{g.__docgenInfo={description:`A read-only field keeps its value at full contrast and is still focusable,
so the value can be selected and copied. The border is muted to show that
the value can't be edited.`,displayName:`ReadOnly`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/input/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Placeholder',
    'aria-label': 'Value'
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'username',
    'aria-label': 'Username',
    prefix: <InputLayout.Slot>@</InputLayout.Slot>
  }
}`,...p.parameters?.docs?.source},description:{story:"The `InputLayout.Slot` component can be used to add standard padding in\nthe `prefix` or `suffix` slot.",...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    'aria-label': 'Value',
    suffix: InputLayoutWithSuffixControl.args?.suffix
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    defaultValue: 'Disabled value',
    disabled: true
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    defaultValue: 'Read-only value',
    readOnly: true
  }
}`,...g.parameters?.docs?.source},description:{story:`A read-only field keeps its value at full contrast and is still focusable,
so the value can be selected and copied. The border is muted to show that
the value can't be edited.`,...g.parameters?.docs?.description}}}})))()}export{init_index_story as i,m as n,l as r,p as t};