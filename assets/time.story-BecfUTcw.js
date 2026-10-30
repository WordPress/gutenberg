import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./time-picker-C2Rru9yU.js";var o,s,Template,c,TimeInputTemplate,l;function init_time_story(){return(init_time_story=e((()=>{n(),i(),o=t(),s={title:`Components/@wordpress-components/Selection & Input/Time & Date/TimePicker`,id:`components-timepicker`,component:a,subcomponents:{"TimePicker.TimeInput":a.TimeInput},argTypes:{currentTime:{control:`date`},onChange:{action:`onChange`,control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.'}}},Template=({currentTime:e,onChange:t,...n})=>{let[i,s]=(0,r.useState)(e);return(0,r.useEffect)(()=>{s(e)},[e]),(0,o.jsx)(a,{...n,currentTime:i,onChange:e=>{s(e),t?.(e)}})},c=Template.bind({}),c.args={currentTime:new Date},TimeInputTemplate=e=>(0,o.jsx)(a.TimeInput,{...e}),l=TimeInputTemplate.bind({}),l.args={label:`Time`},l.parameters={controls:{include:[]}};try{l.__docgenInfo={description:"The time input can be used in isolation as `<TimePicker.TimeInput />`. In this case, the `value` will be passed\nas an object in 24-hour format (`{ hours: number, minutes: number }`).",displayName:`TimeInput`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/date-time/stories/time.story.tsx`,methods:[],props:{},tags:{}}}catch{}c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`({
  currentTime,
  onChange,
  ...args
}) => {
  const [time, setTime] = useState(currentTime);
  useEffect(() => {
    setTime(currentTime);
  }, [currentTime]);
  return <TimePicker {...args} currentTime={time} onChange={newTime => {
    setTime(newTime);
    onChange?.(newTime);
  }} />;
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`args => {
  return <TimePicker.TimeInput {...args} />;
}`,...l.parameters?.docs?.source},description:{story:"The time input can be used in isolation as `<TimePicker.TimeInput />`. In this case, the `value` will be passed\nas an object in 24-hour format (`{ hours: number, minutes: number }`).",...l.parameters?.docs?.description}}}})))()}init_time_story();export{c as Default,l as TimeInput,s as default};