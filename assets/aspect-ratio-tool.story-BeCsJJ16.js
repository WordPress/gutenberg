import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./panel-CI5F-2X7.js";import{n as o,t as s}from"./component-DX1TOh_O.js";import{n as c,t as l}from"./aspect-ratio-tool-BEvgwElK.js";var u,d,Template,f,p,m,h;function init_aspect_ratio_tool_story(){return(init_aspect_ratio_tool_story=e((()=>{n(),i(),o(),c(),u=t(),d={id:`blockeditor-dimensionstool-aspectratiotool`,title:`Editor/Block Editor/DimensionsTool/AspectRatioTool`,component:l,tags:[`status-private`],argTypes:{panelId:{control:!1},onChange:{action:`changed`}}},Template=({panelId:e,onChange:t,value:n,...i})=>{let[o,c]=(0,r.useState)(n),resetAll=()=>{c(void 0),t(void 0)};return(0,u.jsx)(a,{children:(0,u.jsx)(s,{label:`Aspect Ratio`,panelId:e,resetAll,children:(0,u.jsx)(l,{panelId:e,onChange:e=>{c(e),t(e)},value:o,...i})})})},f=Template.bind({}),f.args={panelId:`panel-id`},p=Template.bind({}),p.args={panelId:`panel-id`,value:`16/9`,options:[{label:`Original`,value:`auto`},{label:`Square - 1:1`,value:`1`},{label:`Standard - 4:3`,value:`4/3`},{label:`Portrait - 3:4`,value:`3/4`},{label:`Classic - 3:2`,value:`3/2`},{label:`Classic Portrait - 2:3`,value:`2/3`},{label:`Wide - 16:9`,value:`16/9`},{label:`Tall - 9:16`,value:`9/16`},{label:`Custom`,value:`custom`,disabled:!0,hidden:!0}]},m=Template.bind({}),m.args={...p.args,value:`21/9`},h=Template.bind({}),h.args={...p.args,value:`4/3`,options:[{label:`Original`,value:`auto`},{label:`A theme preset with a very long name that does not fit - 4:3`,value:`4/3`},{label:`Wide - 16:9`,value:`16/9`}]},h.decorators=[e=>(0,u.jsx)(`div`,{style:{width:260},children:(0,u.jsx)(e,{})})];try{p.__docgenInfo={description:`The options can be provided, as the editor does with the default and theme
ratios. Each option shows an icon in the shape of its ratio.`,displayName:`WithOptions`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/dimensions-tool/stories/aspect-ratio-tool.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{m.__docgenInfo={description:`A ratio that doesn't match any option is shown as "Custom", with an icon in
the shape of the actual ratio.`,displayName:`CustomRatio`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/dimensions-tool/stories/aspect-ratio-tool.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{h.__docgenInfo={description:`A long name, such as one from a theme, is truncated with an ellipsis in the
closed control.`,displayName:`LongLabel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/block-editor/src/components/dimensions-tool/stories/aspect-ratio-tool.story.tsx`,methods:[],props:{},tags:{}}}catch{}f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  panelId,
  onChange: onChangeProp,
  value: initialValue,
  ...props
}) => {
  const [value, setValue] = useState<string | null | undefined>(initialValue);
  const resetAll = () => {
    setValue(undefined);
    // Storybook passes the \`onChange\` action.
    onChangeProp!(undefined);
  };
  return <Panel>
            <ToolsPanel label="Aspect Ratio" panelId={panelId} resetAll={resetAll}>
                <AspectRatioTool panelId={panelId} onChange={nextValue => {
        setValue(nextValue);
        // Storybook passes the \`onChange\` action.
        onChangeProp!(nextValue);
      }} value={value} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`({
  panelId,
  onChange: onChangeProp,
  value: initialValue,
  ...props
}) => {
  const [value, setValue] = useState<string | null | undefined>(initialValue);
  const resetAll = () => {
    setValue(undefined);
    // Storybook passes the \`onChange\` action.
    onChangeProp!(undefined);
  };
  return <Panel>
            <ToolsPanel label="Aspect Ratio" panelId={panelId} resetAll={resetAll}>
                <AspectRatioTool panelId={panelId} onChange={nextValue => {
        setValue(nextValue);
        // Storybook passes the \`onChange\` action.
        onChangeProp!(nextValue);
      }} value={value} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...p.parameters?.docs?.source},description:{story:`The options can be provided, as the editor does with the default and theme
ratios. Each option shows an icon in the shape of its ratio.`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`({
  panelId,
  onChange: onChangeProp,
  value: initialValue,
  ...props
}) => {
  const [value, setValue] = useState<string | null | undefined>(initialValue);
  const resetAll = () => {
    setValue(undefined);
    // Storybook passes the \`onChange\` action.
    onChangeProp!(undefined);
  };
  return <Panel>
            <ToolsPanel label="Aspect Ratio" panelId={panelId} resetAll={resetAll}>
                <AspectRatioTool panelId={panelId} onChange={nextValue => {
        setValue(nextValue);
        // Storybook passes the \`onChange\` action.
        onChangeProp!(nextValue);
      }} value={value} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...m.parameters?.docs?.source},description:{story:`A ratio that doesn't match any option is shown as "Custom", with an icon in
the shape of the actual ratio.`,...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`({
  panelId,
  onChange: onChangeProp,
  value: initialValue,
  ...props
}) => {
  const [value, setValue] = useState<string | null | undefined>(initialValue);
  const resetAll = () => {
    setValue(undefined);
    // Storybook passes the \`onChange\` action.
    onChangeProp!(undefined);
  };
  return <Panel>
            <ToolsPanel label="Aspect Ratio" panelId={panelId} resetAll={resetAll}>
                <AspectRatioTool panelId={panelId} onChange={nextValue => {
        setValue(nextValue);
        // Storybook passes the \`onChange\` action.
        onChangeProp!(nextValue);
      }} value={value} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...h.parameters?.docs?.source},description:{story:`A long name, such as one from a theme, is truncated with an ellipsis in the
closed control.`,...h.parameters?.docs?.description}}}})))()}init_aspect_ratio_tool_story();export{m as CustomRatio,f as Default,h as LongLabel,p as WithOptions,d as default};