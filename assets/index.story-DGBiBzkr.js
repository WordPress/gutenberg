import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{En as i,In as a,Tt as o,cn as s}from"./store-BhNPWe19.js";import{At as c,B as l,Rt as u,V as d,b as f,jt as p,y as m,zt as h}from"./utils-2-5U2Wyg.js";function ExampleEdit({attributes:e}){return(0,g.jsx)(`p`,{...h(),children:e.content})}function useExampleBlocks(){return(0,r.useMemo)(()=>(i(_)||a(_,{apiVersion:3,title:`Example`,category:`text`,attributes:{content:{type:`string`}},edit:ExampleEdit,save:()=>null}),v.map((e,t)=>({...s(_,{content:`${e} example block.`}),clientId:y[t]}))),[])}var g,_,v,y,b,x,S,C;function init_index_story(){return(init_index_story=e((()=>{o(),n(),d(),f(),u(),p(),g=t(),_=`storybook/example`,v=[`First`,`Second`,`Third`],y=v.map((e,t)=>`example-block-${t+1}`),b=`
    .block-popover-story {
        position: relative;
        padding: 48px 0;
    }
    .block-popover-story .block-editor-block-list__block {
        border: 1px dashed #949494;
        padding: 8px;
        margin-bottom: 16px;
    }
    .block-popover-story .block-editor-block-popover .components-popover__content {
        background: #fff;
        border: 1px solid #1e1e1e;
        padding: 8px;
    }
`,x=Object.fromEntries(y.map((e,t)=>[e,`Block ${t+1}`])),S={id:`blockeditor-blockpopover`,title:`Editor/Block Editor/BlockPopover`,component:l,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:"BlockPopover renders editor UI by the block in a popover, positioned outside the canvas so that it doesn't interfere with the block list layout. The popover is anchored to the block matching `clientId`, so that block has to be rendered by a block list within a block editor provider. When a `bottomClientId` is passed as well, the popover is anchored to the area covered by both blocks."}}},decorators:[e=>{let t=useExampleBlocks();return(0,g.jsxs)(c,{value:t,children:[(0,g.jsx)(`style`,{children:b}),(0,g.jsxs)(`div`,{className:`block-popover-story`,children:[(0,g.jsx)(m,{}),(0,g.jsx)(e,{})]})]})}],argTypes:{clientId:{control:{type:`select`,labels:x},options:y,description:`The client ID of the block representing the top position of the popover.`,type:{name:`string`,required:!0},table:{type:{summary:`string`}}},bottomClientId:{control:{type:`select`,labels:x},options:y,description:`The client ID of the block representing the bottom position of the popover.`,table:{type:{summary:`string`}}},shift:{control:{type:`boolean`},description:`Determines whether the block popover always shifts into the viewport or remains at its original position.`,table:{type:{summary:`boolean`},defaultValue:{summary:`true`}}},children:{control:{type:`text`},description:`The content rendered inside the popover.`,table:{type:{summary:`ReactNode`}}}}},C={args:{clientId:y[1],children:`This is a block popover example.`}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    clientId: clientIds[1],
    children: 'This is a block popover example.'
  }
}`,...C.parameters?.docs?.source}}}})))()}init_index_story();export{C as Default,S as default};