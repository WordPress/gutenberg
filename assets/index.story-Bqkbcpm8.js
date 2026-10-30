import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./text-control-CKO8HCva.js";var o,s,DefaultTemplate,c,l;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={component:a,title:`Components/@wordpress-components/Selection & Input/Common/TextControl`,id:`components-textcontrol`,argTypes:{help:{control:{type:`text`}},label:{control:{type:`text`}},onChange:{action:`onChange`},value:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`InputControl`](?path=/docs/design-system-components-form-inputcontrol--docs) from `@wordpress/ui` instead. See the [migration guide](?path=/docs/components-inputcontrol--migration-guide)."}}},DefaultTemplate=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(``);return(0,o.jsx)(a,{...t,value:n,onChange:t=>{i(t),e(t)}})},c=DefaultTemplate.bind({}),c.args={placeholder:`Placeholder`},l=DefaultTemplate.bind({}),l.args={...c.args,label:`Label Text`,help:`Help text to explain the input.`},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState('');
  return <TextControl {...args} value={value} onChange={v => {
    setValue(v);
    onChange(v);
  }} />;
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState('');
  return <TextControl {...args} value={value} onChange={v => {
    setValue(v);
    onChange(v);
  }} />;
}`,...l.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,l as WithLabelAndHelpText,s as default};