import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./letter-spacing-control-Dqs4BsSS.js";var o,s,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={id:`blockeditor-letterspacingcontrol`,title:`Editor/Block Editor/LetterSpacingControl`,component:a,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`LetterSpacingControl renders a UnitControl that lets the user enter a letter-spacing value with a unit (px, em, rem).`}}},argTypes:{value:{control:{type:null},description:`The current value of the letter spacing setting.`,table:{type:{summary:`string`}}},onChange:{action:`onChange`,control:{type:null},description:`A callback function invoked when the value is changed.`,table:{type:{summary:`function`}}},__unstableInputWidth:{control:`text`,description:`Input width to pass through to inner UnitControl. Should be a valid CSS value.`,table:{type:{summary:`string | number | undefined`},defaultValue:{summary:`60px`}}}}},c={render:function Template({onChange:e,...t}){let[n,i]=(0,r.useState)(``);return(0,o.jsx)(a,{...t,value:n,onChange:t=>{e(t),i(t)}})}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Template({
    onChange,
    ...args
  }) {
    const [value, setValue] = useState<string | undefined>('');
    return <LetterSpacingControl {...args} value={value} onChange={newValue => {
      // Storybook passes the \`onChange\` action.
      onChange!(newValue);
      setValue(newValue);
    }} />;
  }
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};