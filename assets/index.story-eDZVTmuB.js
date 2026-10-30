import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./panel-CI5F-2X7.js";import{n as o,t as s}from"./component-DX1TOh_O.js";import{n as c,t as l}from"./dimensions-tool-DcYwbtwq.js";var u,d,f,Default;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o(),c(),u=t(),d={id:`blockeditor-dimensionstool-dimensionstool`,title:`Editor/Block Editor/DimensionsTool/DimensionsTool`,component:l,tags:[`status-private`],argTypes:{panelId:{control:!1},onChange:{action:`changed`}}},f={},Default=({panelId:e,onChange:t,...n})=>{let[i,o]=(0,r.useState)(f),resetAll=()=>{o(f),t(f)};return(0,u.jsx)(a,{children:(0,u.jsx)(s,{label:`Dimensions`,panelId:e,resetAll,children:(0,u.jsx)(l,{panelId:e,onChange:e=>{o(e),t(e)},value:i,...n})})})},Default.args={panelId:`panel-id`},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`({
  panelId,
  onChange,
  ...props
}) => {
  const [value, setValue] = useState<Dimensions>(EMPTY_OBJECT);
  const resetAll = () => {
    setValue(EMPTY_OBJECT);
    // Storybook passes the \`onChange\` action.
    onChange!(EMPTY_OBJECT);
  };
  return <Panel>
            <ToolsPanel label="Dimensions" panelId={panelId} resetAll={resetAll}>
                <DimensionsTool panelId={panelId} onChange={nextValue => {
        setValue(nextValue);
        // Storybook passes the \`onChange\` action.
        onChange!(nextValue);
      }} value={value} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...Default.parameters?.docs?.source}}}})))()}init_index_story();export{Default,d as default};