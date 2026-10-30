import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,r as a}from"./alignment-control-Cz5RFoTS.js";var o,s,c;function init_aliginment_toolbar_story(){return(init_aliginment_toolbar_story=e((()=>{n(),a(),o=t(),s={id:`blockeditor-alignmenttoolbar`,title:`Editor/Block Editor/AlignmentToolbar`,component:i,argTypes:{value:{control:!1,defaultValue:`undefined`,description:`The current value of the alignment setting.`},onChange:{action:`onChange`,control:!1,description:"A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `left`, `center`, `right`, `undefined`) as the only argument."}},parameters:{docs:{description:{component:"The `AlignmentToolbar` component renders a dropdown menu that displays alignment options for the selected block in `Toolbar`."}}}},c={render:function Template({onChange:e,...t}){let[n,a]=(0,r.useState)();return(0,o.jsx)(i,{...t,onChange:(...t)=>{e(...t),a(...t)},value:n})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState<string>();
    return <AlignmentToolbar {...args} onChange={(...changeArgs) => {
      onChange(...changeArgs);
      setValue(...changeArgs);
    }} value={value} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_aliginment_toolbar_story();export{c as Default,s as default};