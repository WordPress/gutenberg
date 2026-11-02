import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./custom-select-control-C9d3UcM2.js";var s=t({Default:()=>d,WithCustomColors:()=>m,WithHints:()=>p,WithLongLabels:()=>f,default:()=>u}),c,l,u,Template,d,f,p,m;function init_index_story(){return(init_index_story=e((()=>{r(),a(),c=n(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={tags:[`manifest`],title:`Components/@wordpress-components/Selection & Input/Common/CustomSelectControl`,component:o,id:`components-customselectcontrol`,argTypes:{onChange:{control:!1},value:{control:!1}},args:{onChange:l()},parameters:{controls:{expanded:!0},docs:{source:{excludeDecorators:!0}},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Will be superseded by [`SelectControl`](?path=/docs/design-system-components-form-selectcontrol--docs) in `@wordpress/ui`, but continue using for now. See the [migration guide](?path=/docs/components-customselectcontrol--migration-guide)."}},decorators:[e=>(0,c.jsx)(`div`,{style:{minHeight:`150px`},children:(0,c.jsx)(e,{})})]},Template=e=>{let[t,n]=(0,i.useState)(e.options[0]),onChange=t=>{n(t.selectedItem),e.onChange?.(t)};return(0,c.jsx)(o,{...e,onChange,value:t})},d=Template.bind({}),d.args={label:`Label`,options:[{key:`small`,name:`Small`,style:{fontSize:`50%`}},{key:`normal`,name:`Normal`,style:{fontSize:`100%`},className:`can-apply-custom-class-to-option`},{key:`large`,name:`Large`,style:{fontSize:`200%`}},{key:`huge`,name:`Huge`,style:{fontSize:`300%`}}]},f=Template.bind({}),f.args={...d.args,options:[{key:`reallylonglabel1`,name:`Really long labels are good for stress testing`},{key:`reallylonglabel2`,name:`But they can take a long time to type.`},{key:`reallylonglabel3`,name:`That really is ok though because you should stress test your UIs.`}]},p=Template.bind({}),p.args={...d.args,options:[{key:`thumbnail`,name:`Thumbnail`,hint:`150x150`},{key:`medium`,name:`Medium`,hint:`250x250`},{key:`large`,name:`Large`,hint:`1024x1024`},{key:`full`,name:`Full Size`,hint:`1600x1600`}]},m=Template.bind({}),m.args={label:`Custom colors`,options:[{key:`default`,name:`Default`},{key:`aquamarine`,name:`Aquamarine`,style:{backgroundColor:`#7fffd4`,color:`#16352b`,fontWeight:600}},{key:`rose`,name:`Rose`,style:{backgroundColor:`#fff3f6`,color:`#6b2345`,fontStyle:`italic`}}]},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState(props.options[0]);
  const onChange: React.ComponentProps<typeof CustomSelectControl>['onChange'] = changeObject => {
    setValue(changeObject.selectedItem);
    props.onChange?.(changeObject);
  };
  return <CustomSelectControl {...props} onChange={onChange} value={value} />;
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState(props.options[0]);
  const onChange: React.ComponentProps<typeof CustomSelectControl>['onChange'] = changeObject => {
    setValue(changeObject.selectedItem);
    props.onChange?.(changeObject);
  };
  return <CustomSelectControl {...props} onChange={onChange} value={value} />;
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState(props.options[0]);
  const onChange: React.ComponentProps<typeof CustomSelectControl>['onChange'] = changeObject => {
    setValue(changeObject.selectedItem);
    props.onChange?.(changeObject);
  };
  return <CustomSelectControl {...props} onChange={onChange} value={value} />;
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`props => {
  const [value, setValue] = useState(props.options[0]);
  const onChange: React.ComponentProps<typeof CustomSelectControl>['onChange'] = changeObject => {
    setValue(changeObject.selectedItem);
    props.onChange?.(changeObject);
  };
  return <CustomSelectControl {...props} onChange={onChange} value={value} />;
}`,...m.parameters?.docs?.source}}}})))()}export{init_index_story as n,s as t};