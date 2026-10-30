import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./dimension-control-VOA5tG2S.js";var o,s,Template,c,l,u,d,f,p,TemplateWithPresetValue,m;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={component:a,id:`blockeditor-dimensioncontrol`,title:`Editor/Block Editor/DimensionControl`},Template=e=>{let[t,n]=(0,r.useState)();return(0,o.jsx)(a,{onChange:n,value:t,...e})},c=Template.bind({}),l=Template.bind({}),l.args={label:`Height`},u=Template.bind({}),u.args={label:`Width`},d=Template.bind({}),d.args={label:`Minimum height`},f=Template.bind({}),f.args={label:`Height with presets`},p=Template.bind({}),p.args={label:`Height`,value:`24px`},TemplateWithPresetValue=e=>{let[t,n]=(0,r.useState)(`var:preset|dimension|medium`);return(0,o.jsx)(a,{onChange:n,value:t,...e})},m=TemplateWithPresetValue.bind({}),m.args={label:`Height (preset value)`},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState<string>();
  return <DimensionControl onChange={setValue} value={value} {...props} />;
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState<string>();
  return <DimensionControl onChange={setValue} value={value} {...props} />;
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState<string>();
  return <DimensionControl onChange={setValue} value={value} {...props} />;
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState<string>();
  return <DimensionControl onChange={setValue} value={value} {...props} />;
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState<string>();
  return <DimensionControl onChange={setValue} value={value} {...props} />;
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState<string>();
  return <DimensionControl onChange={setValue} value={value} {...props} />;
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState<string | undefined>('var:preset|dimension|medium');
  return <DimensionControl onChange={setValue} value={value} {...props} />;
}`,...m.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,l as WithCustomLabel,p as WithInitialValue,d as WithMinHeightLabel,m as WithPresetValue,f as WithPresets,u as WithWidthLabel,s as default};