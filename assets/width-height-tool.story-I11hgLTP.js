import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./panel-B9bOmvl6.js";import{n as o,t as s}from"./component-pUp_-3GV.js";import{n as c,t as l}from"./width-height-tool-CkDxoqGH.js";var u,d,f,Default;function init_width_height_tool_story(){return(init_width_height_tool_story=e((()=>{n(),i(),o(),c(),u=t(),d={id:`blockeditor-dimensionstool-widthheighttool`,title:`Editor/Block Editor/DimensionsTool/WidthHeightTool`,component:l,tags:[`status-private`],argTypes:{panelId:{control:!1},onChange:{action:`changed`}}},f={},Default=({panelId:e,onChange:t,...n})=>{let[i,o]=(0,r.useState)(f),resetAll=()=>{o(f),t(f)};return(0,u.jsx)(a,{children:(0,u.jsx)(s,{label:`Width & Height`,panelId:e,resetAll,children:(0,u.jsx)(l,{panelId:e,onChange:e=>{o(e),t(e)},value:i,...n})})})},Default.args={panelId:`panel-id`},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`({
  panelId,
  onChange: onChangeProp,
  ...props
}) => {
  const [value, setValue] = useState<WidthHeightToolValue>(EMPTY_OBJECT);
  const resetAll = () => {
    setValue(EMPTY_OBJECT);
    // Storybook passes the \`onChange\` action.
    onChangeProp!(EMPTY_OBJECT);
  };
  return <Panel>
            <ToolsPanel label="Width & Height" panelId={panelId} resetAll={resetAll}>
                <WidthHeightTool panelId={panelId} onChange={nextValue => {
        setValue(nextValue);
        // Storybook passes the \`onChange\` action.
        onChangeProp!(nextValue);
      }} value={value} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...Default.parameters?.docs?.source}}}})))()}init_width_height_tool_story();export{Default,d as default};