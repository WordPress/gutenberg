import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./component-BlCtSwIO.js";var o,s,c,l,Template,u,d,f,p,m;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`components-bordercontrol`,title:`Components/@wordpress-components/BorderControl`,component:a,argTypes:{onChange:{action:`onChange`},width:{control:{type:`text`}},value:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`editor`}}},c=[{name:`Blue 20`,color:`#72aee6`},{name:`Blue 40`,color:`#3582c4`},{name:`Red 40`,color:`#e65054`},{name:`Red 70`,color:`#8a2424`},{name:`Yellow 10`,color:`#f2d675`},{name:`Yellow 40`,color:`#bd8600`}],l=[{name:`Default`,colors:[{name:`Gray 20`,color:`#a7aaad`},{name:`Gray 70`,color:`#3c434a`}]},{name:`Theme`,colors:[{name:`Blue 20`,color:`#72aee6`},{name:`Blue 40`,color:`#3582c4`},{name:`Blue 70`,color:`#0a4b78`}]},{name:`User`,colors:[{name:`Green`,color:`#00a32a`},{name:`Yellow`,color:`#f2d675`}]}],Template=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(),onChangeMerged=t=>{i(t),e(t)};return(0,o.jsx)(a,{onChange:onChangeMerged,value:n,...t})},u=Template.bind({}),u.args={colors:c,label:`Border`,enableAlpha:!0,enableStyle:!0,shouldSanitizeBorder:!0},d=Template.bind({}),d.args={...u.args,withSlider:!0},f=Template.bind({}),f.args={...u.args,withSlider:!0,width:`150px`},f.storyName=`With Slider (Custom Width)`,p=Template.bind({}),p.args={...u.args,isCompact:!0},m=Template.bind({}),m.args={...u.args,colors:l};try{d.__docgenInfo={description:`Render a slider beside the control.`,displayName:`WithSlider`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/border-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{f.__docgenInfo={description:"When rendering with a slider, the `width` prop is useful to customize the width of the number input.",displayName:`WithSliderCustomWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/border-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{p.__docgenInfo={description:"Restrict the width of the control and prevent it from expanding to take up additional space.\nWhen `true`, the `width` prop will be ignored.",displayName:`IsCompact`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/border-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{m.__docgenInfo={description:"The `colors` object can contain multiple origins.",displayName:`WithMultipleOrigins`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/border-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [border, setBorder] = useState<Border>();
  const onChangeMerged: ComponentProps<typeof BorderControl>['onChange'] = newBorder => {
    setBorder(newBorder);
    onChange(newBorder);
  };
  return <BorderControl onChange={onChangeMerged} value={border} {...props} />;
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [border, setBorder] = useState<Border>();
  const onChangeMerged: ComponentProps<typeof BorderControl>['onChange'] = newBorder => {
    setBorder(newBorder);
    onChange(newBorder);
  };
  return <BorderControl onChange={onChangeMerged} value={border} {...props} />;
}`,...d.parameters?.docs?.source},description:{story:`Render a slider beside the control.`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [border, setBorder] = useState<Border>();
  const onChangeMerged: ComponentProps<typeof BorderControl>['onChange'] = newBorder => {
    setBorder(newBorder);
    onChange(newBorder);
  };
  return <BorderControl onChange={onChangeMerged} value={border} {...props} />;
}`,...f.parameters?.docs?.source},description:{story:"When rendering with a slider, the `width` prop is useful to customize the width of the number input.",...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [border, setBorder] = useState<Border>();
  const onChangeMerged: ComponentProps<typeof BorderControl>['onChange'] = newBorder => {
    setBorder(newBorder);
    onChange(newBorder);
  };
  return <BorderControl onChange={onChangeMerged} value={border} {...props} />;
}`,...p.parameters?.docs?.source},description:{story:"Restrict the width of the control and prevent it from expanding to take up additional space.\nWhen `true`, the `width` prop will be ignored.",...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [border, setBorder] = useState<Border>();
  const onChangeMerged: ComponentProps<typeof BorderControl>['onChange'] = newBorder => {
    setBorder(newBorder);
    onChange(newBorder);
  };
  return <BorderControl onChange={onChangeMerged} value={border} {...props} />;
}`,...m.parameters?.docs?.source},description:{story:"The `colors` object can contain multiple origins.",...m.parameters?.docs?.description}}}})))()}init_index_story();export{u as Default,p as IsCompact,m as WithMultipleOrigins,d as WithSlider,f as WithSliderCustomWidth,s as default};