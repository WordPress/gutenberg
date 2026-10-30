import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./border-radius-control-CeluOnjH.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-borderradiuscontrol`,title:`Editor/Block Editor/BorderRadiusControl`,component:a,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`Control to display border radius options.`}}},argTypes:{values:{control:`object`,description:`Border radius values.`,table:{type:{summary:`object`}}},onChange:{action:`onChange`,control:{type:null},table:{type:{summary:`function`}},description:`Callback to handle onChange.`}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)(t.values);return(0,o.jsx)(a,{...t,values:n,onChange:(...t)=>{i(...t),e(...t)}})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [values, setValues] = useState(args.values);
    return <BorderRadiusControl {...args} values={values} onChange={(...changeArgs) => {
      setValues(...changeArgs);
      onChange(...changeArgs);
    }} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};