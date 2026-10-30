import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a,r as o,t as s}from"./utils-PuR28Pfl.js";var c,l,Template,u,d,f;function init_date_story(){return(init_date_story=e((()=>{n(),i(),c=t(),l={title:`Components/@wordpress-components/Selection & Input/Time & Date/DatePicker`,id:`components-datepicker`,component:a,argTypes:{currentDate:{control:`date`},onChange:{action:`onChange`,control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.'}}},Template=({currentDate:e,onChange:t,...n})=>{let[i,o]=(0,r.useState)(e);return(0,r.useEffect)(()=>{o(e)},[e]),(0,c.jsx)(a,{...n,currentDate:i,onChange:e=>{o(e),t?.(e)}})},u=Template.bind({}),u.args={currentDate:new Date},d=Template.bind({}),d.args={currentDate:new Date,events:[{date:s(2)},{date:s(4)},{date:s(6)},{date:s(8)}]},f=Template.bind({}),f.args={currentDate:new Date,isInvalidDate:o},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`({
  currentDate,
  onChange,
  ...args
}) => {
  const [date, setDate] = useState(currentDate);
  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);
  return <DatePicker {...args} currentDate={date} onChange={newDate => {
    setDate(newDate);
    onChange?.(newDate);
  }} />;
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`({
  currentDate,
  onChange,
  ...args
}) => {
  const [date, setDate] = useState(currentDate);
  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);
  return <DatePicker {...args} currentDate={date} onChange={newDate => {
    setDate(newDate);
    onChange?.(newDate);
  }} />;
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  currentDate,
  onChange,
  ...args
}) => {
  const [date, setDate] = useState(currentDate);
  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);
  return <DatePicker {...args} currentDate={date} onChange={newDate => {
    setDate(newDate);
    onChange?.(newDate);
  }} />;
}`,...f.parameters?.docs?.source}}}})))()}init_date_story();export{u as Default,d as WithEvents,f as WithInvalidDates,l as default};