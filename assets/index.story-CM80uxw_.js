import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./component-BpQ9fa0N.js";var i,a,o,BlackBox,Template,s,Nested;function init_index_story(){return(init_index_story=e((()=>{n(),i=t(),a=[`margin`,`marginY`,`marginX`,`marginTop`,`marginBottom`,`marginLeft`,`marginRight`,`padding`,`paddingY`,`paddingX`,`paddingTop`,`paddingBottom`,`paddingLeft`,`paddingRight`].reduce((e,t)=>({...e,[t]:{control:{type:`text`}}}),{}),o={component:r,id:`components-spacer`,title:`Components/@wordpress-components/Spacer`,argTypes:{as:{control:{type:`text`}},children:{control:{type:`text`}},...a},tags:[`status-experimental`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:`Planned for deprecation.`}}},BlackBox=()=>(0,i.jsx)(`div`,{style:{backgroundColor:`black`,width:`100px`,height:`100px`}}),Template=({onChange:e,...t})=>(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(BlackBox,{}),(0,i.jsx)(r,{...t}),(0,i.jsx)(BlackBox,{})]}),s=Template.bind({}),s.args={children:`This is the spacer`},Nested=()=>(0,i.jsx)(r,{padding:4,style:{backgroundColor:`#ddd`},children:(0,i.jsx)(r,{style:{backgroundColor:`#fff`},children:(0,i.jsx)(BlackBox,{})})}),s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  return <>
            <BlackBox />
            <Spacer {...args} />
            <BlackBox />
        </>;
}`,...s.parameters?.docs?.source}}},Nested.parameters={...Nested.parameters,docs:{...Nested.parameters?.docs,source:{originalSource:`() => <Spacer padding={4} style={{
  backgroundColor: '#ddd'
}}>
        <Spacer style={{
    backgroundColor: '#fff'
  }}>
            <BlackBox />
        </Spacer>
    </Spacer>`,...Nested.parameters?.docs?.source}}}})))()}init_index_story();export{s as Default,Nested,o as default};