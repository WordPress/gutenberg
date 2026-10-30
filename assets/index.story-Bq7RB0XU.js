import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./component-lXS83C_h.js";import{n as i,t as a}from"./component-DjNXX17f.js";import{n as o,t as s}from"./component-w2k6js2k.js";import{n as c,t as l}from"./component-4ETjfpkJ.js";var u,d,GrayBox,Default,ResponsiveDirection;function init_index_story(){return(init_index_story=e((()=>{i(),o(),c(),n(),u=t(),d={component:a,id:`components-flex`,title:`Components/@wordpress-components/Flex`,subcomponents:{FlexBlock:l,FlexItem:s},argTypes:{align:{control:{type:`text`}},as:{control:{type:`text`}},children:{control:!1},gap:{control:{type:`text`}},justify:{control:{type:`text`}},isReversed:{table:{disable:!0}}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Planned for deprecation. For use cases not covered by [`Stack`](?path=/docs/design-system-components-stack--docs) from `@wordpress/ui`, write your own CSS."}}},GrayBox=({children:e})=>(0,u.jsx)(r,{style:{backgroundColor:`#eee`,padding:10},children:e}),Default=({...e})=>(0,u.jsxs)(a,{...e,children:[(0,u.jsx)(s,{children:(0,u.jsx)(GrayBox,{children:`Item 1`})}),(0,u.jsx)(s,{children:(0,u.jsx)(GrayBox,{children:`Item 2`})}),(0,u.jsx)(s,{children:(0,u.jsx)(GrayBox,{children:`Item 3`})})]}),Default.args={},ResponsiveDirection=({...e})=>(0,u.jsxs)(a,{...e,children:[(0,u.jsx)(s,{children:(0,u.jsx)(GrayBox,{children:`Item 1`})}),(0,u.jsx)(l,{children:(0,u.jsx)(GrayBox,{children:`Item 2`})}),(0,u.jsx)(s,{children:(0,u.jsx)(GrayBox,{children:`Item 3`})}),(0,u.jsx)(s,{children:(0,u.jsx)(GrayBox,{children:`Item 4`})})]}),ResponsiveDirection.args={direction:[`column`,`row`]},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`({
  ...args
}) => {
  return <Flex {...args}>
            <FlexItem>
                <GrayBox>Item 1</GrayBox>
            </FlexItem>
            <FlexItem>
                <GrayBox>Item 2</GrayBox>
            </FlexItem>
            <FlexItem>
                <GrayBox>Item 3</GrayBox>
            </FlexItem>
        </Flex>;
}`,...Default.parameters?.docs?.source}}},ResponsiveDirection.parameters={...ResponsiveDirection.parameters,docs:{...ResponsiveDirection.parameters?.docs,source:{originalSource:`({
  ...args
}) => {
  return <Flex {...args}>
            <FlexItem>
                <GrayBox>Item 1</GrayBox>
            </FlexItem>
            <FlexBlock>
                <GrayBox>Item 2</GrayBox>
            </FlexBlock>
            <FlexItem>
                <GrayBox>Item 3</GrayBox>
            </FlexItem>
            <FlexItem>
                <GrayBox>Item 4</GrayBox>
            </FlexItem>
        </Flex>;
}`,...ResponsiveDirection.parameters?.docs?.source}}}})))()}init_index_story();export{Default,ResponsiveDirection,d as default};