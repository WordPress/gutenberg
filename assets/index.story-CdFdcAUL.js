import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./date-format-picker-tlxptEeM.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-dateformatpicker`,title:`Editor/Block Editor/DateFormatPicker`,component:a,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:"The `DateFormatPicker` component enables users to configure their preferred *date format*. This determines how dates are displayed."}}},argTypes:{defaultFormat:{control:`text`,description:`The date format that will be used if the user selects "Default".`,table:{type:{summary:`string`}}},format:{control:{type:null},description:"The selected date format. If `null`, _Default_ is selected.",table:{type:{summary:`string | null`}}},onChange:{action:`onChange`,control:{type:null},description:"Called when a selection is made. If `null`, _Default_ is selected.",table:{type:{summary:`function`}}}}},c={args:{defaultFormat:`M j, Y`},render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)(null);return(0,o.jsx)(a,{...t,onChange:(...t)=>{e(...t),i(...t)},format:n})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    defaultFormat: 'M j, Y'
  },
  render: function Template({
    onChange,
    ...args
  }) {
    const [format, setFormat] = useState<string | null>(null);
    return <DateFormatPicker {...args} onChange={(...changeArgs) => {
      onChange(...changeArgs);
      setFormat(...changeArgs);
    }} format={format} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};