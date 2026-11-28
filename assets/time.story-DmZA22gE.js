import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,c as a,s as o}from"./build-module-NgxElgNW.js";import{n as s,t as c}from"./time-picker-DDaA5dDf.js";var l,u,Template,d,f,TimeInputTemplate,p;function init_time_story(){return(init_time_story=e((()=>{n(),o(),s(),l=t(),u={title:`Components/@wordpress-components/Selection & Input/Time & Date/TimePicker`,id:`components-timepicker`,component:c,subcomponents:{"TimePicker.TimeInput":c.TimeInput},argTypes:{currentTime:{control:`date`},onChange:{action:`onChange`,control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.'}}},Template=({currentTime:e,onChange:t,...n})=>{let[i,a]=(0,r.useState)(e);return(0,r.useEffect)(()=>{a(e)},[e]),(0,l.jsx)(c,{...n,currentTime:i,onChange:e=>{a(e),t?.(e)}})},d=Template.bind({}),d.args={currentTime:new Date},f=Template.bind({}),f.args={currentTime:new Date},f.parameters={docs:{story:{inline:!1,height:`220px`}}},f.beforeEach=()=>{let e=i(),t=-new Date().getTimezoneOffset()/60;return a({...e,timezone:t===-4?{offset:9,offsetFormatted:`9`,string:`Asia/Tokyo`,abbr:`JST`}:{offset:-4,offsetFormatted:`-4`,string:`America/Port_of_Spain`,abbr:`AST`}}),()=>a(e)},TimeInputTemplate=e=>(0,l.jsx)(c.TimeInput,{...e}),p=TimeInputTemplate.bind({}),p.args={label:`Time`},p.parameters={controls:{include:[]}};try{f.__docgenInfo={description:`When the site time zone from the \`@wordpress/date\` settings differs from the
user's, the time picker shows the site time zone's abbreviation. Hovering or
activating the abbreviation shows the full time zone name.

This story sets a site time zone that differs from your browser's.`,displayName:`WithSiteTimeZone`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/date-time/stories/time.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{p.__docgenInfo={description:"The time input can be used in isolation as `<TimePicker.TimeInput />`. In this case, the `value` will be passed\nas an object in 24-hour format (`{ hours: number, minutes: number }`).",displayName:`TimeInput`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/date-time/stories/time.story.tsx`,methods:[],props:{},tags:{}}}catch{}d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`({
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
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
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
}`,...f.parameters?.docs?.source},description:{story:`When the site time zone from the \`@wordpress/date\` settings differs from the
user's, the time picker shows the site time zone's abbreviation. Hovering or
activating the abbreviation shows the full time zone name.

This story sets a site time zone that differs from your browser's.`,...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`args => {
  return <TimePicker.TimeInput {...args} />;
}`,...p.parameters?.docs?.source},description:{story:"The time input can be used in isolation as `<TimePicker.TimeInput />`. In this case, the `value` will be passed\nas an object in 24-hour format (`{ hours: number, minutes: number }`).",...p.parameters?.docs?.description}}}})))()}init_time_story();export{d as Default,p as TimeInput,f as WithSiteTimeZone,u as default};