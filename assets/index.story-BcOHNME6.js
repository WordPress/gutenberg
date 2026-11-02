import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a}from"./iframe-y9psNcyg.js";import{n as o,t as s}from"./build-module-moyqbjZD.js";import{n as c,t as l}from"./component-BYEAdrbI.js";import{n as u,t as d}from"./select-control-qAN9rh93.js";import{n as f,t as p}from"./text-control-AmUHLMk8.js";import{n as m,t as h}from"./textarea-control-BH45yrdh.js";var g;function init_context(){return(init_context=e((()=>{n(),g=(0,r.createContext)(!1),g.displayName=`DisabledContext`})))()}var _,v;function init_style_module(){return(init_style_module=e((()=>{_=`_disabled_1kaze_1`,v={disabled:_}})))()}function Disabled({className:e,children:t,isDisabled:n=!0,...r}){return(0,y.jsx)(x,{value:n,children:(0,y.jsx)(`div`,{inert:s(n),className:a(e,n&&[v.disabled,`components-disabled`])||void 0,...r,children:t})})}var y,b,x;function init_disabled(){return(init_disabled=e((()=>{i(),o(),init_context(),init_style_module(),y=t(),{Consumer:b,Provider:x}=g,Disabled.Context=g,Disabled.Consumer=b;try{Disabled.__docgenInfo={description:`\`Disabled\` is a component which disables descendant tabbable elements and
prevents pointer interaction.

_Note: this component may not behave as expected in browsers that don't
support the \`inert\` HTML attribute. We recommend adding the official WICG
polyfill when using this component in your project._`,displayName:`Disabled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/disabled/index.tsx`,methods:[],props:{isDisabled:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/disabled/types.ts`,name:`DisabledProps`}],description:`Whether to disable all the descendant fields.`,name:`isDisabled`,parent:{fileName:`gutenberg/packages/components/src/disabled/types.ts`,name:`DisabledProps`},required:!1,tags:{},type:{name:`boolean`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/disabled/types.ts`,name:`DisabledProps`}],description:`The children elements.`,name:`children`,parent:{fileName:`gutenberg/packages/components/src/disabled/types.ts`,name:`DisabledProps`},required:!0,tags:{},type:{name:`ReactNode`}},as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element or React component to render the component as.`,name:`as`,required:!1,tags:{},type:{name:`JSXElementConstructor<any> | keyof IntrinsicElements`}}},tags:{see:`https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert

\`\`\`jsx
import { Button, Disabled, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyDisabled = () => {
const [ isDisabled, setIsDisabled ] = useState( true );

let input = (
<TextControl
label="Input"
onChange={ () => {} }
/>
);
if ( isDisabled ) {
input = <Disabled>{ input }</Disabled>;
}

const toggleDisabled = () => {
setIsDisabled( ( state ) => ! state );
};

return (
<div>
{ input }
<Button variant="primary" onClick={ toggleDisabled }>
Toggle Disabled
</Button>
</div>
);
};
\`\`\``}}}catch{}})))()}var S,C,Form,Default,ContentEditable;function init_index_story(){return(init_index_story=e((()=>{n(),init_disabled(),u(),f(),m(),c(),S=t(),C={tags:[`manifest`],title:`Components/@wordpress-components/Utilities/Disabled`,id:`components-disabled`,component:Disabled,argTypes:{as:{control:!1},children:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},Form=()=>{let[e,t]=(0,r.useState)(``),[n,i]=(0,r.useState)(``);return(0,S.jsxs)(l,{children:[(0,S.jsx)(p,{label:`Text Control`,value:e,onChange:t}),(0,S.jsx)(h,{label:`TextArea Control`,value:n,onChange:i}),(0,S.jsx)(d,{label:`Select Control`,onChange:()=>{},options:[{value:``,label:`Select an option`,disabled:!0},{value:`a`,label:`Option A`},{value:`b`,label:`Option B`},{value:`c`,label:`Option C`}]})]})},Default=e=>(0,S.jsx)(Disabled,{...e,children:(0,S.jsx)(Form,{})}),Default.args={isDisabled:!0},ContentEditable=e=>(0,S.jsx)(Disabled,{...e,children:(0,S.jsx)(`div`,{contentEditable:!0,tabIndex:0,suppressContentEditableWarning:!0,children:`contentEditable`})}),ContentEditable.args={isDisabled:!0},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`args => {
  return <Disabled {...args}>
            <Form />
        </Disabled>;
}`,...Default.parameters?.docs?.source}}},ContentEditable.parameters={...ContentEditable.parameters,docs:{...ContentEditable.parameters?.docs,source:{originalSource:`args => {
  return <Disabled {...args}>
            <div contentEditable tabIndex={0} suppressContentEditableWarning>
                contentEditable
            </div>
        </Disabled>;
}`,...ContentEditable.parameters?.docs?.source}}}})))()}init_index_story();export{ContentEditable,Default,C as default};