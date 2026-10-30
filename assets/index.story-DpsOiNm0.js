import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./text-transform-control-zv2_AWqx.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-texttransformcontrol`,title:`Editor/Block Editor/TextTransformControl`,component:a,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`Control to facilitate text transformation selections.`}}},argTypes:{onChange:{action:`onChange`,control:{type:null},description:`Handles change in text transform selection.`,table:{type:{summary:`function`}}},className:{control:{type:`text`},description:`Class name to add to the control.`,table:{type:{summary:`string`}}},value:{control:{type:null},description:`Currently selected text transform.`,table:{type:{summary:`string`}}}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)();return(0,o.jsx)(a,{...t,onChange:(...t)=>{e(...t),i(...t)},value:n})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState<string>();
    return <TextTransformControl {...args} onChange={(...changeArgs) => {
      onChange(...changeArgs);
      setValue(...changeArgs);
    }} value={value} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};