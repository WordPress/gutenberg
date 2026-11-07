import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-merge-refs-BNmiIksj.js";import{i as o,n as s,r as c,t as l}from"./base-control-3b6OpV76.js";var u,d;function init_style_module(){return(init_style_module=e((()=>{u=`_editable_2kl5r_96`,d={editable:u}})))()}function UnforwardedContentEditableControl({label:e,id:t,className:n,help:a,hideLabelFromVision:s,disabled:c,required:u,placeholder:p,...m},h){let{baseControlProps:g,controlProps:_}=o({id:t,className:n,help:a}),v=`${_.id}__label`,y=(0,r.useRef)(null),b=i([y,h]);return(0,f.jsxs)(l,{...g,children:[!s&&(0,f.jsx)(l.VisualLabel,{id:v,onClick:()=>y.current?.focus(),children:e}),(0,f.jsx)(`div`,{className:d.editable,role:`textbox`,"aria-multiline":!0,"aria-label":s?e:void 0,"aria-labelledby":s?void 0:v,"aria-placeholder":p||void 0,"aria-disabled":c||void 0,"aria-required":u||void 0,ref:b,contentEditable:!c,tabIndex:c?-1:void 0,suppressContentEditableWarning:!0,...m,..._})]})}var f,p;function init_content_editable_control(){return(init_content_editable_control=e((()=>{a(),n(),s(),c(),init_style_module(),f=t(),p=(0,r.forwardRef)(UnforwardedContentEditableControl);try{p.__docgenInfo={description:`A presentational \`contentEditable\` form control: a labeled editable element
rendered with the chrome (\`BaseControl\` + label) shared by the other form
controls in the package.

Unlike the in-canvas \`RichText\` from \`@wordpress/block-editor\`, this control
is intended for standalone form fields (DataForms, sidebar inputs, etc.).
It is deliberately **presentational only** and has no \`@wordpress/rich-text\`
dependency: the editable behavior (value, formatting, keyboard shortcuts)
and any focus/selection tracking are owned by the consumer, which wires them
through the forwarded ref and native event props (see the richtext DataForm
control in \`@wordpress/dataviews\` for the canonical assembly).

\`\`\`jsx
// The rich-text "assembly" lives in the consumer.
<ContentEditableControl
    label="Caption"
    ref={ mergedRef }
    onFocus={ onEditableFocus }
    onBlur={ onEditableBlur }
/>
\`\`\``,displayName:`ContentEditableControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/content-editable-control/index.tsx`,methods:[],props:{className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:``,name:`className`,required:!1,tags:{},type:{name:`string`}},help:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Additional description for the control.

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},hideLabelFromVision:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If true, the label will only be visible to screen readers.`,name:`hideLabelFromVision`,required:!1,tags:{},type:{name:`boolean`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:`Label text for the control.`,name:`label`,required:!0,tags:{},type:{name:`string`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:"Whether the field is non-editable. A disabled field exposes\n`aria-disabled`, leaves the tab order, and keeps focus if it had it.",name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},required:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:"Whether the field is required. Exposed to assistive technology via\n`aria-required`.",name:`required`,required:!1,tags:{},type:{name:`boolean`}},placeholder:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:`Placeholder text shown while the element has no content. Exposed to
assistive technology via \`aria-placeholder\` and drawn by the stylesheet
when the element is empty.`,name:`placeholder`,required:!1,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}export{init_content_editable_control as n,p as t};