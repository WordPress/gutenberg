import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./textarea-control-CrxsWL5O.js";var s=t({Default:()=>u,default:()=>l}),c,l,Template,u;function init_index_story(){return(init_index_story=e((()=>{r(),a(),c=n(),l={component:o,title:`Components/@wordpress-components/Selection & Input/Common/TextareaControl`,id:`components-textareacontrol`,argTypes:{onChange:{action:`onChange`},label:{control:{type:`text`}},help:{control:{type:`text`}},disabled:{control:{type:`boolean`}},value:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`TextareaControl`](?path=/docs/design-system-components-form-textareacontrol--docs) from `@wordpress/ui` instead. See the [migration guide](?path=/docs/components-textareacontrol--migration-guide)."}}},Template=({onChange:e,...t})=>{let[n,r]=(0,i.useState)(``);return(0,c.jsx)(o,{...t,value:n,onChange:t=>{r(t),e(t)}})},u=Template.bind({}),u.args={label:`Text`,help:`Enter some text`,placeholder:`Placeholder`},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState('');
  return <TextareaControl {...args} value={value} onChange={v => {
    setValue(v);
    onChange(v);
  }} />;
}`,...u.parameters?.docs?.source}}}})))()}export{init_index_story as n,s as t};