import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./writing-mode-control-w-eseD6c.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-writingmodecontrol`,title:`Editor/Block Editor/WritingModeControl`,component:a,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`Control to facilitate writing mode selections.`}}},argTypes:{value:{control:{type:null},description:`Currently selected writing mode.`},className:{control:`text`,description:`Class name to add to the control.`},onChange:{action:`onChange`,control:{type:null},description:`Handles change in the writing mode selection.`}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)();return(0,o.jsx)(a,{...t,onChange:(...t)=>{e(...t),i(...t)},value:n})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState<string>();
    return <WritingModeControl {...args} onChange={(...changeArgs) => {
      onChange(...changeArgs);
      setValue(...changeArgs);
    }} value={value} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};