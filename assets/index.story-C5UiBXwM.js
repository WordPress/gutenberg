import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./custom-gradient-picker-ClcQ9cf-.js";var o,s,c,CustomGradientPickerWithState,l;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),{fn:s}=__STORYBOOK_MODULE_TEST__,c={title:`Components/@wordpress-components/Selection & Input/Color/CustomGradientPicker`,id:`components-customgradientpicker`,component:a,args:{onChange:s()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Mostly an internal component. Use `GradientPicker` instead."}}},CustomGradientPickerWithState=({onChange:e,...t})=>{let[n,i]=(0,r.useState)();return(0,o.jsx)(a,{...t,value:n,onChange:t=>{i(t),e(t)}})},l=CustomGradientPickerWithState.bind({}),l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [gradient, setGradient] = useState<string>();
  return <CustomGradientPicker {...props} value={gradient} onChange={newGradient => {
    setGradient(newGradient);
    onChange(newGradient);
  }} />;
}`,...l.parameters?.docs?.source}}}})))()}init_index_story();export{l as Default,c as default};