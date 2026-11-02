import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./form-token-field-Ckd5DNGH.js";var o,s,c,DefaultTemplate,l,Async,u,d,f;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={tags:[`manifest`],component:a,title:`Components/@wordpress-components/Selection & Input/Common/FormTokenField`,id:`components-formtokenfield`,argTypes:{value:{control:!1},__experimentalValidateInput:{control:!1},help:{control:`text`}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Will be superseded by `SearchableChipSelect` in `@wordpress/ui`, but continue using for now."}}},c=[`Africa`,`America`,`Antarctica`,`Asia`,`Europe`,`Oceania`],DefaultTemplate=({...e})=>{let[t,n]=(0,r.useState)([]);return(0,o.jsx)(a,{...e,value:t,onChange:e=>n(e)})},l=DefaultTemplate.bind({}),l.args={label:`Type a continent`,suggestions:c},Async=({suggestions:e,...t})=>{let[n,i]=(0,r.useState)([]),[s,c]=(0,r.useState)([]),searchContinents=t=>{let n=setTimeout(()=>{let n=(e||[]).filter(e=>e.toLowerCase().includes(t.toLowerCase()));c(n)},1e3);return()=>clearTimeout(n)};return(0,o.jsx)(a,{...t,value:n,suggestions:s,onChange:e=>i(e),onInputChange:searchContinents})},Async.args={label:`Type a continent`,suggestions:c},u=DefaultTemplate.bind({}),u.args={...l.args,__experimentalExpandOnFocus:!0,__experimentalAutoSelectFirstMatch:!0},d=DefaultTemplate.bind({}),d.args={...l.args,displayTransform:e=>`📍 ${e}`,__experimentalRenderItem:({item:e})=>(0,o.jsx)(`div`,{children:`${e} — a nice place to visit`}),__experimentalExpandOnFocus:!0},f=DefaultTemplate.bind({}),f.args={...l.args,__experimentalValidateInput:e=>c.includes(e),__experimentalExpandOnFocus:!0};try{d.__docgenInfo={description:`The rendered content of each token can be customized by passing a
render function to the \`displayTransform\` prop.

Similarly, each suggestion can be customized by passing a
render function to the \`__experimentalRenderItem\` prop. (This is still an
experimental feature and is subject to change.)`,displayName:`WithCustomRenderedItems`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/form-token-field/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{f.__docgenInfo={description:`Only values for which the \`__experimentalValidateInput\` function returns
\`true\` will be tokenized. (This is still an experimental feature and is
subject to change.)

In this example, the user can only add tokens that are already in the list.`,displayName:`ValidateNewTokens`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/form-token-field/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`({
  ...args
}) => {
  const [selectedContinents, setSelectedContinents] = useState<ComponentProps<typeof FormTokenField>['value']>([]);
  return <FormTokenField {...args} value={selectedContinents} onChange={tokens => setSelectedContinents(tokens)} />;
}`,...l.parameters?.docs?.source}}},Async.parameters={...Async.parameters,docs:{...Async.parameters?.docs,source:{originalSource:`({
  suggestions,
  ...args
}) => {
  const [selectedContinents, setSelectedContinents] = useState<ComponentProps<typeof FormTokenField>['value']>([]);
  const [availableContinents, setAvailableContinents] = useState<string[]>([]);
  const searchContinents = (input: string) => {
    const timeout = setTimeout(() => {
      const available = (suggestions || []).filter(continent => continent.toLowerCase().includes(input.toLowerCase()));
      setAvailableContinents(available);
    }, 1000);
    return () => clearTimeout(timeout);
  };
  return <FormTokenField {...args} value={selectedContinents} suggestions={availableContinents} onChange={tokens => setSelectedContinents(tokens)} onInputChange={searchContinents} />;
}`,...Async.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`({
  ...args
}) => {
  const [selectedContinents, setSelectedContinents] = useState<ComponentProps<typeof FormTokenField>['value']>([]);
  return <FormTokenField {...args} value={selectedContinents} onChange={tokens => setSelectedContinents(tokens)} />;
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`({
  ...args
}) => {
  const [selectedContinents, setSelectedContinents] = useState<ComponentProps<typeof FormTokenField>['value']>([]);
  return <FormTokenField {...args} value={selectedContinents} onChange={tokens => setSelectedContinents(tokens)} />;
}`,...d.parameters?.docs?.source},description:{story:`The rendered content of each token can be customized by passing a
render function to the \`displayTransform\` prop.

Similarly, each suggestion can be customized by passing a
render function to the \`__experimentalRenderItem\` prop. (This is still an
experimental feature and is subject to change.)`,...d.parameters?.docs?.description}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  ...args
}) => {
  const [selectedContinents, setSelectedContinents] = useState<ComponentProps<typeof FormTokenField>['value']>([]);
  return <FormTokenField {...args} value={selectedContinents} onChange={tokens => setSelectedContinents(tokens)} />;
}`,...f.parameters?.docs?.source},description:{story:`Only values for which the \`__experimentalValidateInput\` function returns
\`true\` will be tokenized. (This is still an experimental feature and is
subject to change.)

In this example, the user can only add tokens that are already in the list.`,...f.parameters?.docs?.description}}}})))()}init_index_story();export{Async,l as Default,u as DropdownSelector,f as ValidateNewTokens,d as WithCustomRenderedItems,s as default};