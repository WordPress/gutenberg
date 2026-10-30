import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a}from"./iframe-BbJPeSVw.js";import{n as o,t as s}from"./component-lc2omK31.js";import{a as c,i as l,r as u,t as d}from"./utils-PuR28Pfl.js";import{n as f,t as p}from"./time-picker-C2Rru9yU.js";var m,h;function init_style_module(){return(init_style_module=e((()=>{m=`_wrapper_ov5cf_1`,h={wrapper:m}})))()}function UnforwardedDateTimePicker({currentDate:e,is12Hour:t,dateOrder:n,isInvalidDate:r,onMonthPreviewed:i=noop,onChange:o,events:c,startOfWeek:u},d){return(0,g.jsx)(s,{ref:d,className:a(`components-datetime`,h.wrapper),spacing:4,children:(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(p,{currentTime:e,onChange:o,is12Hour:t,dateOrder:n}),(0,g.jsx)(l,{currentDate:e,onChange:o,isInvalidDate:r,events:c,onMonthPreviewed:i,startOfWeek:u})]})})}var g,noop,_;function init_date_time(){return(init_date_time=e((()=>{i(),n(),c(),f(),o(),init_style_module(),g=t(),noop=()=>{},_=(0,r.forwardRef)(UnforwardedDateTimePicker),_.displayName=`DateTimePicker`;try{_.__docgenInfo={description:`DatePicker is a React component that renders a calendar for date selection.

\`\`\`jsx
import { DatePicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyDatePicker = () => {
  const [ date, setDate ] = useState( new Date() );

  return (
    <DatePicker
      currentDate={ date }
      onChange={ ( newDate ) => setDate( newDate ) }
    />
  );
};
\`\`\``,displayName:`DateTimePicker`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/date-time/date-time/index.tsx`,methods:[],props:{currentDate:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:"The current date and time at initialization. Optionally pass in a `null`\nvalue to specify no date is currently selected.",name:`currentDate`,required:!1,tags:{},type:{name:`string | number | Date | null`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`The function called when a new date has been selected. It is passed the
date as an argument.`,name:`onChange`,required:!1,tags:{},type:{name:`((date: string) => void)`}},isInvalidDate:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`A callback function which receives a Date object representing a day as an
argument, and should return a Boolean to signify if the day is valid or
not.`,name:`isInvalidDate`,required:!1,tags:{},type:{name:`((date: Date) => boolean)`}},onMonthPreviewed:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`A callback invoked when selecting the previous/next month in the date
picker. The callback receives the new month date in the ISO format as an
argument.`,name:`onMonthPreviewed`,required:!1,tags:{},type:{name:`((date: string) => void)`}},events:{defaultValue:{value:`[]`},declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`List of events to show in the date picker. Each event will appear as a
dot on the day of the event.`,name:`events`,required:!1,tags:{},type:{name:`DatePickerEvent[]`}},startOfWeek:{defaultValue:{value:`0`},declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`The day that the week should start on. 0 for Sunday, 1 for Monday, etc.`,name:`startOfWeek`,required:!1,tags:{},type:{name:`enum`,raw:`0 | 1 | 2 | 3 | 4 | 5 | 6`,value:[{value:`0`},{value:`1`},{value:`2`},{value:`3`},{value:`4`},{value:`5`},{value:`6`}]}}},tags:{}}}catch{}try{p.TimeInput.__docgenInfo={description:``,displayName:`TimePicker.TimeInput`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/date-time/date-time/index.tsx`,methods:[],props:{is12Hour:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`Whether we use a 12-hour clock. With a 12-hour clock, an AM/PM widget is
displayed`,name:`is12Hour`,required:!1,tags:{},type:{name:`boolean`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`The time input object with hours and minutes values.

- hours: number (24-hour format)
- minutes: number`,name:`value`,required:!1,tags:{},type:{name:`TimeInputValue`}},defaultValue:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:"An optional default value for the control when used in uncontrolled mode.\nIf left `undefined`, the current time will be used.",name:`defaultValue`,required:!1,tags:{},type:{name:`TimeInputValue`}},minutesProps:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`The props to pass down to the minutes input.`,name:`minutesProps`,required:!1,tags:{},type:{name:`(Omit<InputControlProps, "type" | "step" | "required" | "value" | "max" | "min" | "isDragEnabled"> & { hideHTMLArrows?: boolean; spinControls?: "none" | ... 2 more ...; ... 9 more ...; value?: string | ... 1 more ... | undefined; } & Omit<...> & RefAttributes<...>) | undefined`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`The label for the time input.`,name:`label`,required:!1,tags:{},type:{name:`string`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/date-time/types.ts`,name:`TypeLiteral`}],description:`The function is called when a new time has been selected.
Passing hours and minutes as an object properties.`,name:`onChange`,required:!1,tags:{},type:{name:`((time: TimeInputValue) => void)`}}},tags:{}}}catch{}})))()}var v,y,Template,b,x,S;function init_date_time_story(){return(init_date_time_story=e((()=>{n(),init_date_time(),v=t(),y={title:`Components/@wordpress-components/Selection & Input/Time & Date/DateTimePicker`,id:`components-datetimepicker`,component:_,argTypes:{currentDate:{control:`date`},onChange:{action:`onChange`,control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:'Consider using a `TextControl` with `type="date"` or `type="datetime-local"` instead.'}}},Template=({currentDate:e,onChange:t,...n})=>{let[i,a]=(0,r.useState)(e);return(0,r.useEffect)(()=>{a(e)},[e]),(0,v.jsx)(_,{...n,currentDate:i,onChange:e=>{a(e),t?.(e)}})},b=Template.bind({}),b.args={currentDate:new Date},x=Template.bind({}),x.args={currentDate:new Date,events:[{date:d(2)},{date:d(4)},{date:d(6)},{date:d(8)}]},S=Template.bind({}),S.args={currentDate:new Date,isInvalidDate:u},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`({
  currentDate,
  onChange,
  ...args
}) => {
  const [date, setDate] = useState(currentDate);
  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);
  return <DateTimePicker {...args} currentDate={date} onChange={newDate => {
    setDate(newDate);
    onChange?.(newDate);
  }} />;
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`({
  currentDate,
  onChange,
  ...args
}) => {
  const [date, setDate] = useState(currentDate);
  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);
  return <DateTimePicker {...args} currentDate={date} onChange={newDate => {
    setDate(newDate);
    onChange?.(newDate);
  }} />;
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`({
  currentDate,
  onChange,
  ...args
}) => {
  const [date, setDate] = useState(currentDate);
  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);
  return <DateTimePicker {...args} currentDate={date} onChange={newDate => {
    setDate(newDate);
    onChange?.(newDate);
  }} />;
}`,...S.parameters?.docs?.source}}}})))()}init_date_time_story();export{b as Default,x as WithEvents,S as WithInvalidDates,y as default};