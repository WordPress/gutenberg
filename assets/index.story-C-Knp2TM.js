import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./angle-picker-control-BsAwY4T8.js";var o,s,c,AnglePickerWithState,l;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),{fn:s}=__STORYBOOK_MODULE_TEST__,c={id:`components-anglepickercontrol`,title:`Components/@wordpress-components/AnglePickerControl`,component:a,argTypes:{as:{control:!1},value:{control:!1}},args:{onChange:s()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`editor`}}},AnglePickerWithState=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(0),handleChange=t=>{i(t),e(t)};return(0,o.jsx)(a,{...t,value:n,onChange:handleChange})},l=AnglePickerWithState.bind({}),l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [angle, setAngle] = useState<number>(0);
  const handleChange = (newValue: number) => {
    setAngle(newValue);
    onChange(newValue);
  };
  return <AnglePickerControl {...args} value={angle} onChange={handleChange} />;
}`,...l.parameters?.docs?.source}}}})))()}init_index_story();export{l as Default,c as default};