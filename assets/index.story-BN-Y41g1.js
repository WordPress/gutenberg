import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./alignment-control-CGJK8ulh.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-alignmentcontrol`,title:`Editor/Block Editor/AlignmentControl`,component:a,argTypes:{value:{control:!1,defaultValue:`undefined`,description:`The current value of the alignment setting.`},onChange:{action:`onChange`,control:!1,description:"A callback function invoked when the toolbar's alignment value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `left`, `center`, `right`, `undefined`) as the only argument."}},parameters:{docs:{description:{component:"The `AlignmentControl` component renders a dropdown menu that displays alignment options for the selected block.\n\nThis component is mostly used for blocks that display text, such as Heading, Paragraph, Post Author, Post Comments, Verse, Quote, Post Title, etc... And the available alignment options are `left`, `center` or `right` alignment.\n\nIf you want to use the alignment control in a toolbar, you should use the `AlignmentToolbar` component instead."}}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)();return(0,o.jsx)(a,{...t,onChange:(...t)=>{e(...t),i(...t)},value:n})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState<string>();
    return <AlignmentControl {...args} onChange={(...changeArgs) => {
      onChange(...changeArgs);
      setValue(...changeArgs);
    }} value={value} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};