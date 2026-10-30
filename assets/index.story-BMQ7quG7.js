import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{i,n as a,r as o,t as s}from"./unit-control-BKCirGeL.js";var c,l,u,DefaultTemplate,d,f,p,m,WithCustomUnits;function init_index_story(){return(init_index_story=e((()=>{n(),a(),i(),c=t(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={component:s,title:`Components/@wordpress-components/Selection & Input/Common/UnitControl`,id:`components-unitcontrol`,argTypes:{__unstableInputWidth:{control:{type:`text`}},__unstableStateReducer:{control:!1},onChange:{control:!1},onUnitChange:{control:!1},prefix:{control:{type:`text`}},value:{control:!1}},tags:[`status-experimental`,`manifest`],args:{onChange:l(),onUnitChange:l(),onFocus:l(),onBlur:l()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},DefaultTemplate=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(`10px`);return(0,c.jsx)(s,{...t,value:n,onChange:(t,n)=>{i(t),e?.(t,n)}})},d=DefaultTemplate.bind({}),d.args={label:`Label`},f=DefaultTemplate.bind({}),f.args={...d.args,isPressEnterToChange:!0},p=DefaultTemplate.bind({}),p.args={...d.args,min:0,max:100,step:`any`,label:`Custom label`},m=DefaultTemplate.bind({}),m.args={...d.args,units:o.slice(0,1)},WithCustomUnits=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(`80km`);return(0,c.jsx)(s,{...t,value:n,onChange:(t,n)=>{i(t),e?.(t,n)}})},WithCustomUnits.args={...d.args,isResetValueOnUnitChange:!0,min:0,units:[{value:`km`,label:`km`,default:1},{value:`mi`,label:`mi`,default:1},{value:`m`,label:`m`,default:1e3},{value:`yd`,label:`yd`,default:1760}]};try{f.__docgenInfo={description:"If the `isPressEnterToChange` prop is set to `true`, the `onChange` callback\nwill not fire while a new value is typed in the input field (you can verify this\nbehavior by inspecting the console's output).",displayName:`PressEnterToChange`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/unit-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{p.__docgenInfo={description:"Most of `NumberControl`'s props can be passed to `UnitControl`, and they will\naffect its numeric input field.",displayName:`TweakingTheNumberInput`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/unit-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{m.__docgenInfo={description:`When only one unit is available, the unit selection dropdown becomes static text.`,displayName:`WithSingleUnit`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/unit-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{WithCustomUnits.__docgenInfo={description:"It is possible to pass a custom list of units. Every time the unit changes,\nif the `isResetValueOnUnitChange` is set to `true`, the input's quantity is\nreset to the new unit's default value.",displayName:`WithCustomUnits`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/unit-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<string | undefined>('10px');
  return <UnitControl {...args} value={value} onChange={(v, extra) => {
    setValue(v);
    onChange?.(v, extra);
  }} />;
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<string | undefined>('10px');
  return <UnitControl {...args} value={value} onChange={(v, extra) => {
    setValue(v);
    onChange?.(v, extra);
  }} />;
}`,...f.parameters?.docs?.source},description:{story:"If the `isPressEnterToChange` prop is set to `true`, the `onChange` callback\nwill not fire while a new value is typed in the input field (you can verify this\nbehavior by inspecting the console's output).",...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<string | undefined>('10px');
  return <UnitControl {...args} value={value} onChange={(v, extra) => {
    setValue(v);
    onChange?.(v, extra);
  }} />;
}`,...p.parameters?.docs?.source},description:{story:"Most of `NumberControl`'s props can be passed to `UnitControl`, and they will\naffect its numeric input field.",...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<string | undefined>('10px');
  return <UnitControl {...args} value={value} onChange={(v, extra) => {
    setValue(v);
    onChange?.(v, extra);
  }} />;
}`,...m.parameters?.docs?.source},description:{story:`When only one unit is available, the unit selection dropdown becomes static text.`,...m.parameters?.docs?.description}}},WithCustomUnits.parameters={...WithCustomUnits.parameters,docs:{...WithCustomUnits.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<string | undefined>('80km');
  return <UnitControl {...args} value={value} onChange={(v, extra) => {
    setValue(v);
    onChange?.(v, extra);
  }} />;
}`,...WithCustomUnits.parameters?.docs?.source},description:{story:"It is possible to pass a custom list of units. Every time the unit changes,\nif the `isResetValueOnUnitChange` is set to `true`, the input's quantity is\nreset to the new unit's default value.",...WithCustomUnits.parameters?.docs?.description}}}})))()}init_index_story();export{d as Default,f as PressEnterToChange,p as TweakingTheNumberInput,WithCustomUnits,m as WithSingleUnit,u as default};