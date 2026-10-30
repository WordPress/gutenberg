import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{Do as i,ho as a,n as o}from"./build-module-DttIWYbV.js";import{i as s,r as c}from"./component-Dg7Kep0D.js";import{n as l,t as u}from"./component-BwSCOsqL.js";import{n as d,t as f}from"./component-BP5FmnMw.js";var p,m,Template,mapPropsToOptionComponent,mapPropsToOptionIconComponent,h,g,_,v,y;function init_index_story(){return(init_index_story=e((()=>{n(),o(),s(),l(),d(),p=t(),m={component:c,subcomponents:{ToggleGroupControlOption:u,ToggleGroupControlOptionIcon:f},title:`Components/@wordpress-components/Selection & Input/Common/ToggleGroupControl`,id:`components-togglegroupcontrol`,argTypes:{help:{control:{type:`text`}},onChange:{action:`onChange`},value:{control:!1}},tags:[`status-experimental`,`manifest`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Will be superseded by `ToggleGroupControl` in `@wordpress/ui`, but continue using for now."}}},Template=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(t.value);return(0,p.jsx)(c,{...t,onChange:(...t)=>{i(...t),e?.(...t)},value:n})},mapPropsToOptionComponent=({value:e,...t})=>(0,p.jsx)(u,{value:e,...t},e),mapPropsToOptionIconComponent=({value:e,...t})=>(0,p.jsx)(f,{value:e,...t},e),h=Template.bind({}),h.args={children:[{value:`left`,label:`Left`},{value:`center`,label:`Center`},{value:`right`,label:`Right`},{value:`justify`,label:`Justify`}].map(mapPropsToOptionComponent),help:`Help text to describe the control.`,isBlock:!0,label:`Label`},g=Template.bind({}),g.args={...h.args,children:[{value:`asc`,label:`A→Z`,"aria-label":`Ascending`,showTooltip:!0},{value:`desc`,label:`Z→A`,"aria-label":`Descending`,showTooltip:!0}].map(mapPropsToOptionComponent)},_=Template.bind({}),_.args={...h.args,children:[{value:`uppercase`,label:`Uppercase`,icon:a},{value:`lowercase`,label:`Lowercase`,icon:i}].map(mapPropsToOptionIconComponent),isBlock:!1},v=Template.bind({}),v.args={..._.args,isDeselectable:!0},y=Template.bind({}),y.args={...h.args,disabled:!0,value:`left`};try{g.__docgenInfo={description:"A tooltip can be shown for each option by enabling the `showTooltip` prop.\nThe `aria-label` will be used in the tooltip if provided. Otherwise, the\n`label` will be used.",displayName:`WithTooltip`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-group-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{_.__docgenInfo={description:"The `ToggleGroupControlOptionIcon` component can be used for icon options. A `label` is required\non each option for accessibility, which will be shown in a tooltip.",displayName:`WithIcons`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-group-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{v.__docgenInfo={description:"When the `isDeselectable` prop is true, the option can be deselected by clicking on it again.",displayName:`Deselectable`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-group-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{y.__docgenInfo={description:"When the `disabled` prop is true, the control is unselectable.",displayName:`Disabled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-group-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [value, setValue] = useState<ToggleGroupControlProps['value']>(props.value);
  return <ToggleGroupControl {...props} onChange={(...changeArgs) => {
    setValue(...changeArgs);
    onChange?.(...changeArgs);
  }} value={value} />;
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [value, setValue] = useState<ToggleGroupControlProps['value']>(props.value);
  return <ToggleGroupControl {...props} onChange={(...changeArgs) => {
    setValue(...changeArgs);
    onChange?.(...changeArgs);
  }} value={value} />;
}`,...g.parameters?.docs?.source},description:{story:"A tooltip can be shown for each option by enabling the `showTooltip` prop.\nThe `aria-label` will be used in the tooltip if provided. Otherwise, the\n`label` will be used.",...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [value, setValue] = useState<ToggleGroupControlProps['value']>(props.value);
  return <ToggleGroupControl {...props} onChange={(...changeArgs) => {
    setValue(...changeArgs);
    onChange?.(...changeArgs);
  }} value={value} />;
}`,..._.parameters?.docs?.source},description:{story:"The `ToggleGroupControlOptionIcon` component can be used for icon options. A `label` is required\non each option for accessibility, which will be shown in a tooltip.",..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [value, setValue] = useState<ToggleGroupControlProps['value']>(props.value);
  return <ToggleGroupControl {...props} onChange={(...changeArgs) => {
    setValue(...changeArgs);
    onChange?.(...changeArgs);
  }} value={value} />;
}`,...v.parameters?.docs?.source},description:{story:"When the `isDeselectable` prop is true, the option can be deselected by clicking on it again.",...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [value, setValue] = useState<ToggleGroupControlProps['value']>(props.value);
  return <ToggleGroupControl {...props} onChange={(...changeArgs) => {
    setValue(...changeArgs);
    onChange?.(...changeArgs);
  }} value={value} />;
}`,...y.parameters?.docs?.source},description:{story:"When the `disabled` prop is true, the control is unselectable.",...y.parameters?.docs?.description}}}})))()}init_index_story();export{h as Default,v as Deselectable,y as Disabled,_ as WithIcons,g as WithTooltip,m as default};