import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./input-prefix-wrapper-B72f_C-p.js";import{n as s,t as c}from"./select-control-qAN9rh93.js";var l=t({Default:()=>p,Minimal:()=>_,WithCustomChildren:()=>h,WithLabelAndHelpText:()=>m,WithPrefix:()=>g,default:()=>f}),u,d,f,SelectControlWithState,p,m,h,g,_;function init_index_story(){return(init_index_story=e((()=>{r(),s(),a(),u=n(),{fn:d}=__STORYBOOK_MODULE_TEST__,f={title:`Components/@wordpress-components/Selection & Input/Common/SelectControl`,id:`components-selectcontrol`,component:c,argTypes:{help:{control:{type:`text`}},label:{control:{type:`text`}},prefix:{control:{type:`text`}},suffix:{control:{type:`text`}},value:{control:!1}},args:{onChange:d()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`SelectControl`](?path=/docs/design-system-components-form-selectcontrol--docs) from `@wordpress/ui` instead. For the `minimal` variant, use the [`Select`](?path=/docs/design-system-components-form-primitives-select--docs) primitive rather than `SelectControl`. See the [migration guide](?path=/docs/components-selectcontrol--migration-guide)."}}},SelectControlWithState=e=>{let[t,n]=(0,i.useState)();return e.multiple?(0,u.jsx)(c,{...e,multiple:!0,value:t,onChange:t=>{n(t),e.onChange?.(t)}}):(0,u.jsx)(c,{...e,multiple:!1,value:t?.[0],onChange:t=>{n([t]),e.onChange?.(t)}})},p=SelectControlWithState.bind({}),p.args={label:`Label`,options:[{value:``,label:`Select an Option`,disabled:!0},{value:`a`,label:`Option A`},{value:`b`,label:`Option B`},{value:`c`,label:`Option C`}]},m=SelectControlWithState.bind({}),m.args={...p.args,help:`Help text to explain the select control.`},h=SelectControlWithState.bind({}),h.args={label:`Label`,children:(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`option`,{value:`option-1`,children:`Option 1`}),(0,u.jsx)(`option`,{value:`option-2`,disabled:!0,children:`Option 2 - Disabled`}),(0,u.jsxs)(`optgroup`,{label:`Option Group 1`,children:[(0,u.jsx)(`option`,{value:`option-group-1-option-1`,children:`Option Group 1 - Option 1`}),(0,u.jsx)(`option`,{value:`option-group-1-option-2`,disabled:!0,children:`Option Group 1 - Option 2 - Disabled`})]})]})},g=SelectControlWithState.bind({}),g.args={...p.args,prefix:(0,u.jsx)(o,{children:`Prefix:`})},_=SelectControlWithState.bind({}),_.args={...p.args,variant:`minimal`,hideLabelFromVision:!0};try{h.__docgenInfo={description:"As an alternative to the `options` prop, `optgroup`s and `options` can be\npassed in as `children` for more customizeability.",displayName:`WithCustomChildren`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{g.__docgenInfo={description:"By default, the prefix is aligned with the edge of the input border, with no padding.\nIf you want to apply standard padding in accordance with the size variant, wrap the element in the `<InputControlPrefixWrapper>` component.",displayName:`WithPrefix`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`props => {
  const [selection, setSelection] = useState<string[]>();
  if (props.multiple) {
    return <SelectControl {...props} multiple value={selection} onChange={value => {
      setSelection(value);
      props.onChange?.(value);
    }} />;
  }
  return <SelectControl {...props} multiple={false} value={selection?.[0]} onChange={value => {
    setSelection([value]);
    props.onChange?.(value);
  }} />;
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`props => {
  const [selection, setSelection] = useState<string[]>();
  if (props.multiple) {
    return <SelectControl {...props} multiple value={selection} onChange={value => {
      setSelection(value);
      props.onChange?.(value);
    }} />;
  }
  return <SelectControl {...props} multiple={false} value={selection?.[0]} onChange={value => {
    setSelection([value]);
    props.onChange?.(value);
  }} />;
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`props => {
  const [selection, setSelection] = useState<string[]>();
  if (props.multiple) {
    return <SelectControl {...props} multiple value={selection} onChange={value => {
      setSelection(value);
      props.onChange?.(value);
    }} />;
  }
  return <SelectControl {...props} multiple={false} value={selection?.[0]} onChange={value => {
    setSelection([value]);
    props.onChange?.(value);
  }} />;
}`,...h.parameters?.docs?.source},description:{story:"As an alternative to the `options` prop, `optgroup`s and `options` can be\npassed in as `children` for more customizeability.",...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`props => {
  const [selection, setSelection] = useState<string[]>();
  if (props.multiple) {
    return <SelectControl {...props} multiple value={selection} onChange={value => {
      setSelection(value);
      props.onChange?.(value);
    }} />;
  }
  return <SelectControl {...props} multiple={false} value={selection?.[0]} onChange={value => {
    setSelection([value]);
    props.onChange?.(value);
  }} />;
}`,...g.parameters?.docs?.source},description:{story:"By default, the prefix is aligned with the edge of the input border, with no padding.\nIf you want to apply standard padding in accordance with the size variant, wrap the element in the `<InputControlPrefixWrapper>` component.",...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`props => {
  const [selection, setSelection] = useState<string[]>();
  if (props.multiple) {
    return <SelectControl {...props} multiple value={selection} onChange={value => {
      setSelection(value);
      props.onChange?.(value);
    }} />;
  }
  return <SelectControl {...props} multiple={false} value={selection?.[0]} onChange={value => {
    setSelection([value]);
    props.onChange?.(value);
  }} />;
}`,..._.parameters?.docs?.source}}}})))()}export{init_index_story as n,l as t};