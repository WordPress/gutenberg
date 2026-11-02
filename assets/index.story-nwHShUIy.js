import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./panel-B9bOmvl6.js";import{n as o,t as s}from"./component-pUp_-3GV.js";import{n as c,t as l}from"./resolution-tool-Rv35mRuW.js";var u,d,Default;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o(),c(),u=t(),d={id:`blockeditor-resolutioncontrol`,title:`Editor/Block Editor/ResolutionControl`,component:l,tags:[`status-private`],parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`A control for selecting image resolution with preset size options.`}}},argTypes:{value:{control:{type:null},description:`Currently selected resolution value.`,table:{type:{summary:`string`}}},onChange:{action:`onChange`,control:{type:null},description:`Handles change in resolution selection.`,table:{type:{summary:`function`}}},options:{control:`object`,description:`Array of resolution options to display.`,table:{type:{summary:`array`}}},defaultValue:{control:`radio`,options:[`thumbnail`,`medium`,`large`,`full`],description:`Default resolution value.`,table:{type:{summary:`string`}}},isShownByDefault:{control:`boolean`,description:`Whether the control is shown by default in the panel.`,table:{type:{summary:`boolean`}}},panelId:{control:{type:null},description:`ID of the parent tools panel.`,table:{type:{summary:`string`}}}}},Default=({label:e,panelId:t,onChange:n,...i})=>{let[o,c]=(0,r.useReducer)((e,t)=>({...e,...t}),{}),{resolution:d}=o,resetAll=(e=[])=>{let t={};e.forEach(e=>{t={...t,...e(t)}}),c(t),n(void 0)};return(0,u.jsx)(a,{children:(0,u.jsx)(s,{label:e,panelId:t,resetAll,children:(0,u.jsx)(l,{panelId:t,onChange:e=>{c({resolution:e}),n(e)},value:d,resetAllFilter:()=>({resolution:void 0}),...i})})})},Default.args={label:`Settings`,defaultValue:`full`,panelId:`panel-id`},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`({
  label,
  panelId,
  onChange: onChangeProp,
  ...props
}) => {
  const [attributes, setAttributes] = useReducer((prevState: Record<string, unknown>, nextState: Record<string, unknown>) => ({
    ...prevState,
    ...nextState
  }), {});
  // The story stores the resolution as a string.
  const {
    resolution
  } = attributes as {
    resolution?: string;
  };
  const resetAll = (resetFilters: ((attributes: Record<string, unknown>) => Record<string, unknown>)[] = []) => {
    let newAttributes: Record<string, unknown> = {};
    resetFilters.forEach(resetFilter => {
      newAttributes = {
        ...newAttributes,
        ...resetFilter(newAttributes)
      };
    });
    setAttributes(newAttributes);
    // Storybook passes the \`onChange\` action.
    onChangeProp!(undefined);
  };
  return <Panel>
            <ToolsPanel
    // The story args set the label.
    label={label as string} panelId={panelId} resetAll={resetAll}>
                <ResolutionTool panelId={panelId} onChange={newValue => {
        setAttributes({
          resolution: newValue
        });
        // Storybook passes the \`onChange\` action.
        onChangeProp!(newValue);
      }} value={resolution} resetAllFilter={() => ({
        resolution: undefined
      })} {...props} />
            </ToolsPanel>
        </Panel>;
}`,...Default.parameters?.docs?.source}}}})))()}init_index_story();export{Default,d as default};