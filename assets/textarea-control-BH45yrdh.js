import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-instance-id-DuzD68j8.js";import{a as o,i as s}from"./iframe-y9psNcyg.js";import{n as c,t as l}from"./base-control-CyYzPRw2.js";var u,d;function init_style_module(){return(init_style_module=e((()=>{u=`_textarea_5f4c3_96`,d={textarea:u}})))()}function UnforwardedTextareaControl(e,t){let{__nextHasNoMarginBottom:n,label:r,hideLabelFromVision:a,value:o,help:c,onChange:u,rows:m=4,className:h,...g}=e,_=`inspector-textarea-control-${i(p)}`,onChangeValue=e=>u(e.target.value),v=s(`components-textarea-control`,h);return(0,f.jsx)(l,{label:r,hideLabelFromVision:a,id:_,help:c,className:v,children:(0,f.jsx)(`textarea`,{className:s(`components-textarea-control__input`,d.textarea),id:_,rows:m,onChange:onChangeValue,"aria-describedby":c?_+`__help`:void 0,value:o,ref:t,...g})})}var f,p;function init_textarea_control(){return(init_textarea_control=e((()=>{o(),a(),n(),c(),init_style_module(),f=t(),p=(0,r.forwardRef)(UnforwardedTextareaControl),p.displayName=`TextareaControl`;try{p.__docgenInfo={description:`TextareaControls are TextControls that allow for multiple lines of text, and
wrap overflow text onto a new line. They are a fixed height and scroll
vertically when the cursor reaches the bottom of the field.

\`\`\`jsx
import { TextareaControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyTextareaControl = () => {
  const [ text, setText ] = useState( '' );

  return (
    <TextareaControl
      label="Text"
      help="Enter some text"
      value={ text }
      onChange={ ( value ) => setText( value ) }
    />
  );
};
\`\`\``,displayName:`TextareaControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/textarea-control/index.tsx`,methods:[],props:{label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If this property is added, a label will be generated using label property as the content.`,name:`label`,required:!1,tags:{},type:{name:`ReactNode`}},__nextHasNoMarginBottom:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the new margin-free styles that will become the default in a future version.
@deprecated Default behavior since WordPress 7.0. Prop can be safely removed.
@ignore`,name:`__nextHasNoMarginBottom`,required:!1,tags:{},type:{name:`boolean`}},help:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Additional description for the control.

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},hideLabelFromVision:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If true, the label will only be visible to screen readers.`,name:`hideLabelFromVision`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/textarea-control/types.ts`,name:`TypeLiteral`}],description:`A function that receives the new value of the textarea each time it
changes.`,name:`onChange`,required:!0,tags:{},type:{name:`(value: string) => void`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/textarea-control/types.ts`,name:`TypeLiteral`}],description:`The current value of the textarea.`,name:`value`,required:!0,tags:{},type:{name:`string`}},rows:{defaultValue:{value:`4`},declarations:[{fileName:`gutenberg/packages/components/src/textarea-control/types.ts`,name:`TypeLiteral`}],description:`The number of rows the textarea should contain.`,name:`rows`,required:!1,tags:{},type:{name:`number`}}},tags:{}}}catch{}})))()}export{init_textarea_control as n,p as t};