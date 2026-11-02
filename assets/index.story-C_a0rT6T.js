import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./block-heading-level-dropdown-d6MXjuJx.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-headingleveldropdown`,title:`Editor/Block Editor/HeadingLevelDropdown`,component:a,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`Dropdown for selecting a heading level (1 through 6) or paragraph (0).`}}},argTypes:{value:{control:{type:null},description:`The chosen heading level.`},options:{control:`check`,options:[1,2,3,4,5,6],description:`An array of supported heading levels.`},onChange:{action:`onChange`,control:{type:null},description:`Function called with the selected value changes.`}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)(t.value);return(0,o.jsx)(a,{...t,value:n,onChange:(...t)=>{i(...t),e(...t)}})},args:{value:2}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState(args.value);
    return <HeadingLevelDropdown {...args} value={value} onChange={(...changeArgs) => {
      setValue(...changeArgs);
      onChange(...changeArgs);
    }} />;
  },
  args: {
    value: 2
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};