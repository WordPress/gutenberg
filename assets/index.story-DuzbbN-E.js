import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./plain-text-C9ZsCe1N.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-plaintext`,title:`Editor/Block Editor/PlainText`,component:a,parameters:{a11y:{test:`todo`},docs:{canvas:{sourceState:`shown`},description:{component:`PlainText renders an auto-growing textarea that allows users to enter any textual content.`}}},argTypes:{value:{control:{type:null},table:{type:{summary:`string`}},description:`String value of the textarea.`},onChange:{action:`onChange`,control:{type:null},table:{type:{summary:`function`}},description:`Function called when the text value changes.`},className:{control:`text`,table:{type:{summary:`string`}},description:`Additional class name for the PlainText.`}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)();return(0,o.jsx)(a,{...t,onChange:(...t)=>{e(...t),i(...t)},value:n})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState<string>();
    return <PlainText {...args} onChange={(...changeArgs) => {
      onChange(...changeArgs);
      setValue(...changeArgs);
    }} value={value} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};