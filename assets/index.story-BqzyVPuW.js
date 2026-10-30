import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{It as i,Ot as a,Pt as o,i as s,n as c}from"./build-module-DttIWYbV.js";import{n as l,t as u}from"./range-control-DIA0pM6q.js";var d,f,p,m,Template,h,WithAnyStep,MarkTemplate,g,_,v,y,b,x,S;function init_index_story(){return(init_index_story=e((()=>{n(),c(),l(),d=t(),{fn:f}=__STORYBOOK_MODULE_TEST__,p={starEmpty:i,starFilled:o,styles:a,wordpress:s},m={tags:[`manifest`],component:u,title:`Components/@wordpress-components/Selection & Input/Common/RangeControl`,id:`components-rangecontrol`,argTypes:{afterIcon:{control:{type:`select`},options:Object.keys(p),mapping:p},beforeIcon:{control:{type:`select`},options:Object.keys(p),mapping:p},color:{control:{type:`color`}},help:{control:{type:`text`}},marks:{control:{type:`object`}},onBlur:{control:!1},onChange:{control:!1},onFocus:{control:!1},onMouseLeave:{control:!1},onMouseMove:{control:!1},railColor:{control:{type:`color`}},step:{control:{type:`number`}},trackColor:{control:{type:`color`}},type:{control:{type:`check`},options:[`stepper`]},value:{control:!1}},args:{onBlur:f(),onChange:f(),onFocus:f(),onMouseLeave:f(),onMouseMove:f()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Will be superseded by `SliderControl` in `@wordpress/ui`, but continue using for now."}}},Template=({onChange:e,...t})=>{let[n,i]=(0,r.useState)();return(0,d.jsx)(u,{...t,value:n,onChange:t=>{i(t),e?.(t)}})},h=Template.bind({}),h.args={help:`Please select how transparent you would like this.`,initialPosition:50,label:`Opacity`,max:100,min:0},WithAnyStep=({onChange:e,...t})=>{let[n,i]=(0,r.useState)();return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(u,{...t,value:n,onChange:t=>{i(t),e?.(t)}}),(0,d.jsx)(`hr`,{style:{marginTop:`5em`}}),(0,d.jsxs)(`p`,{children:[`Current value: `,n]})]})},WithAnyStep.args={label:`Brightness`,step:`any`},MarkTemplate=({label:e,onChange:t,...n})=>{let[i,a]=(0,r.useState)(),[o,s]=(0,r.useState)();return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(`h2`,{children:e}),(0,d.jsx)(u,{...n,label:`Automatic marks`,marks:!0,onChange:e=>{a(e),t?.(e)},value:i}),(0,d.jsx)(u,{...n,label:`Custom marks`,onChange:e=>{s(e),t?.(e)},value:o})]})},g=[{value:0,label:`0`},{value:1,label:`1`},{value:2,label:`2`},{value:8,label:`8`},{value:10,label:`10`}],_=[...g,{value:-1,label:`-1`},{value:-2,label:`-2`},{value:-4,label:`-4`},{value:-8,label:`-8`}],v=MarkTemplate.bind({}),v.parameters={a11y:{test:`todo`}},v.args={label:`Integer Step`,marks:g,max:10,min:0,step:1},y=MarkTemplate.bind({}),y.parameters={a11y:{test:`todo`}},y.args={marks:[...g,{value:3.5,label:`3.5`},{value:5.8,label:`5.8`}],max:10,min:0,step:.1},b=MarkTemplate.bind({}),b.parameters={a11y:{test:`todo`}},b.args={marks:_,max:10,min:-10,step:1},x=MarkTemplate.bind({}),x.parameters={a11y:{test:`todo`}},x.args={marks:_,max:-1,min:-10,step:1},S=MarkTemplate.bind({}),S.parameters={a11y:{test:`todo`}},S.args={marks:g,max:10,min:0,step:`any`};try{WithAnyStep.__docgenInfo={description:'Setting the `step` prop to `"any"` will allow users to select non-integer\nvalues. This also overrides both `withInputField` and `showTooltip` props to\n`false`.',displayName:`WithAnyStep`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/range-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{v.__docgenInfo={description:"Use `marks` to render a visual representation of `step` ticks. Marks may be\nautomatically generated or custom mark indicators can be provided by an\n`Array`.",displayName:`WithIntegerStepAndMarks`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/range-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{y.__docgenInfo={description:"Decimal values may be used for `marks` rendered as a visual representation of\n`step` ticks. Marks may be automatically generated or custom mark indicators\ncan be provided by an `Array`.",displayName:`WithDecimalStepAndMarks`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/range-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{b.__docgenInfo={description:"A negative `min` value can be used to constrain `RangeControl` values. Mark\nindicators can represent negative values as well. Marks may be automatically\ngenerated or custom mark indicators can be provided by an `Array`.",displayName:`WithNegativeMinimumAndMarks`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/range-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{x.__docgenInfo={description:"The entire range of valid values for a `RangeControl` may be negative. Mark\nindicators can represent negative values as well. Marks may be automatically\ngenerated or custom mark indicators can be provided by an `Array`.",displayName:`WithNegativeRangeAndMarks`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/range-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{S.__docgenInfo={description:"When a `RangeControl` has a `step` value of `any` a user may select\nnon-integer values. This may still be used in conjunction with `marks`\nrendering a visual representation of `step` ticks.",displayName:`WithAnyStepAndMarks`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/range-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<number>();
  return <RangeControl {...args} value={value} onChange={v => {
    setValue(v);
    onChange?.(v);
  }} />;
}`,...h.parameters?.docs?.source}}},WithAnyStep.parameters={...WithAnyStep.parameters,docs:{...WithAnyStep.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<number>();
  return <>
            <RangeControl {...args} value={value} onChange={v => {
      setValue(v);
      onChange?.(v);
    }} />
            <hr style={{
      marginTop: '5em'
    }} />
            <p>Current value: {value}</p>
        </>;
}`,...WithAnyStep.parameters?.docs?.source},description:{story:'Setting the `step` prop to `"any"` will allow users to select non-integer\nvalues. This also overrides both `withInputField` and `showTooltip` props to\n`false`.',...WithAnyStep.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`({
  label,
  onChange,
  ...args
}) => {
  const [automaticValue, setAutomaticValue] = useState<number>();
  const [customValue, setCustomValue] = useState<number>();
  return <>
            <h2>{label}</h2>
            <RangeControl {...args} label="Automatic marks" marks onChange={v => {
      setAutomaticValue(v);
      onChange?.(v);
    }} value={automaticValue} />
            <RangeControl {...args} label="Custom marks" onChange={v => {
      setCustomValue(v);
      onChange?.(v);
    }} value={customValue} />
        </>;
}`,...v.parameters?.docs?.source},description:{story:"Use `marks` to render a visual representation of `step` ticks. Marks may be\nautomatically generated or custom mark indicators can be provided by an\n`Array`.",...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`({
  label,
  onChange,
  ...args
}) => {
  const [automaticValue, setAutomaticValue] = useState<number>();
  const [customValue, setCustomValue] = useState<number>();
  return <>
            <h2>{label}</h2>
            <RangeControl {...args} label="Automatic marks" marks onChange={v => {
      setAutomaticValue(v);
      onChange?.(v);
    }} value={automaticValue} />
            <RangeControl {...args} label="Custom marks" onChange={v => {
      setCustomValue(v);
      onChange?.(v);
    }} value={customValue} />
        </>;
}`,...y.parameters?.docs?.source},description:{story:"Decimal values may be used for `marks` rendered as a visual representation of\n`step` ticks. Marks may be automatically generated or custom mark indicators\ncan be provided by an `Array`.",...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`({
  label,
  onChange,
  ...args
}) => {
  const [automaticValue, setAutomaticValue] = useState<number>();
  const [customValue, setCustomValue] = useState<number>();
  return <>
            <h2>{label}</h2>
            <RangeControl {...args} label="Automatic marks" marks onChange={v => {
      setAutomaticValue(v);
      onChange?.(v);
    }} value={automaticValue} />
            <RangeControl {...args} label="Custom marks" onChange={v => {
      setCustomValue(v);
      onChange?.(v);
    }} value={customValue} />
        </>;
}`,...b.parameters?.docs?.source},description:{story:"A negative `min` value can be used to constrain `RangeControl` values. Mark\nindicators can represent negative values as well. Marks may be automatically\ngenerated or custom mark indicators can be provided by an `Array`.",...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`({
  label,
  onChange,
  ...args
}) => {
  const [automaticValue, setAutomaticValue] = useState<number>();
  const [customValue, setCustomValue] = useState<number>();
  return <>
            <h2>{label}</h2>
            <RangeControl {...args} label="Automatic marks" marks onChange={v => {
      setAutomaticValue(v);
      onChange?.(v);
    }} value={automaticValue} />
            <RangeControl {...args} label="Custom marks" onChange={v => {
      setCustomValue(v);
      onChange?.(v);
    }} value={customValue} />
        </>;
}`,...x.parameters?.docs?.source},description:{story:"The entire range of valid values for a `RangeControl` may be negative. Mark\nindicators can represent negative values as well. Marks may be automatically\ngenerated or custom mark indicators can be provided by an `Array`.",...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`({
  label,
  onChange,
  ...args
}) => {
  const [automaticValue, setAutomaticValue] = useState<number>();
  const [customValue, setCustomValue] = useState<number>();
  return <>
            <h2>{label}</h2>
            <RangeControl {...args} label="Automatic marks" marks onChange={v => {
      setAutomaticValue(v);
      onChange?.(v);
    }} value={automaticValue} />
            <RangeControl {...args} label="Custom marks" onChange={v => {
      setCustomValue(v);
      onChange?.(v);
    }} value={customValue} />
        </>;
}`,...S.parameters?.docs?.source},description:{story:"When a `RangeControl` has a `step` value of `any` a user may select\nnon-integer values. This may still be used in conjunction with `marks`\nrendering a visual representation of `step` ticks.",...S.parameters?.docs?.description}}}})))()}init_index_story();export{h as Default,WithAnyStep,S as WithAnyStepAndMarks,y as WithDecimalStepAndMarks,v as WithIntegerStepAndMarks,b as WithNegativeMinimumAndMarks,x as WithNegativeRangeAndMarks,m as default};