import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./panel-CI5F-2X7.js";import{n as o,t as s}from"./component-DX1TOh_O.js";import{n as c,t as l}from"./scale-tool-BtX51coU.js";var u,d,Default;function init_scale_tool_story(){return(init_scale_tool_story=e((()=>{n(),i(),o(),c(),u=t(),d={id:`blockeditor-dimensionstool-scaletool`,title:`Editor/Block Editor/DimensionsTool/ScaleTool`,component:l,tags:[`status-private`],argTypes:{panelId:{control:!1},onChange:{action:`changed`}}},Default=({panelId:e,onChange:t,...n})=>{let[i,o]=(0,r.useState)(void 0),resetAll=()=>{o(void 0),t(void 0)};return(0,u.jsx)(a,{children:(0,u.jsx)(s,{label:`Scale`,panelId:e,resetAll,children:(0,u.jsx)(l,{panelId:e,onChange:e=>{o(e),t(e)},value:i,...n})})})},Default.args={panelId:`panel-id`},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`({
  panelId,
  onChange: onChangeProp,
  ...props
}) => {
  const [value, setValue] = useState<string | undefined>(undefined);
  const resetAll = () => {
    setValue(undefined);
    onChangeProp(undefined);
  };
  return <Panel>
            <ToolsPanel label="Scale" panelId={panelId} resetAll={resetAll}>
                <ScaleTool panelId={panelId} onChange={nextValue => {
        setValue(nextValue);
        onChangeProp(nextValue);
      }} value={value} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...Default.parameters?.docs?.source}}}})))()}init_scale_tool_story();export{Default,d as default};