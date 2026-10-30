import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./block-alignment-matrix-control-DAaK2F7R.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-blockalignmentmatrixcontrol`,title:`Editor/Block Editor/BlockAlignmentMatrixControl`,component:a,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`Renders a control for selecting block alignment using a matrix of alignment options.`}}},argTypes:{label:{control:`text`,table:{type:{summary:`string`},defaultValue:{summary:`'Change matrix alignment'`}},description:`Label for the control.`},onChange:{action:`onChange`,control:{type:null},table:{type:{summary:`function`},defaultValue:{summary:`() => {}`}},description:`Function to execute upon a user's change of the matrix state.`},isDisabled:{control:`boolean`,table:{type:{summary:`boolean`},defaultValue:{summary:`false`}},description:`Whether the control should be disabled.`},value:{control:{type:null},table:{type:{summary:`string`},defaultValue:{summary:`'center'`}},description:`Content alignment location.`}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)();return(0,o.jsx)(a,{...t,value:n,onChange:(...t)=>{e(...t),i(...t)}})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState<ComponentProps<typeof BlockAlignmentMatrixControl>['value']>();
    return <BlockAlignmentMatrixControl {...args} value={value} onChange={(...changeArgs) => {
      // Storybook passes an action.
      onChange!(...changeArgs);
      setValue(...changeArgs);
    }} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};