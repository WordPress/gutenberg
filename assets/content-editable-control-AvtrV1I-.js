import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-merge-refs-BNmiIksj.js";import{n as o,t as s}from"./input-layout-D2an4EUm.js";import{i as c,n as l,r as u,t as d}from"./base-control-Cba0gW66.js";var f,p,m;function init_style_module(){return(init_style_module=e((()=>{f=`_layout_1kfbo_96`,p=`_editable_1kfbo_112`,m={layout:f,editable:p}})))()}function UnforwardedContentEditableControl({label:e,id:t,className:n,help:a,hideLabelFromVision:o,disabled:l,required:u,placeholder:f,onMouseDown:p,...g},_){let{baseControlProps:v,controlProps:y}=c({id:t,className:n,help:a}),b=`${y.id}__label`,x=(0,r.useRef)(null),S=i([x,_]);return(0,h.jsxs)(d,{...v,children:[!o&&(0,h.jsx)(d.VisualLabel,{id:b,onClick:()=>{l||x.current?.focus()},children:e}),(0,h.jsx)(s,{className:m.layout,visuallyDisabled:l,children:(0,h.jsx)(`div`,{className:m.editable,role:`textbox`,"aria-multiline":!0,"aria-label":o?e:void 0,"aria-labelledby":o?void 0:b,"aria-placeholder":f||void 0,"aria-disabled":l||void 0,"aria-required":u||void 0,ref:S,contentEditable:!l,tabIndex:l?-1:void 0,onMouseDown:e=>{p?.(e),l&&e.preventDefault()},suppressContentEditableWarning:!0,...g,...y})})]})}var h,g;function init_content_editable_control(){return(init_content_editable_control=e((()=>{a(),n(),o(),l(),u(),init_style_module(),h=t(),g=(0,r.forwardRef)(UnforwardedContentEditableControl);try{g.__docgenInfo={description:`A presentational \`contentEditable\` form control: a labeled editable element
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

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},hideLabelFromVision:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If true, the label will only be visible to screen readers.`,name:`hideLabelFromVision`,required:!1,tags:{},type:{name:`boolean`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:`Label text for the control.`,name:`label`,required:!0,tags:{},type:{name:`string`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:`Whether the field is non-editable.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},required:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:"Whether the field is required. Exposed to assistive technology via\n`aria-required`.",name:`required`,required:!1,tags:{},type:{name:`boolean`}},placeholder:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/content-editable-control/types.ts`,name:`TypeLiteral`}],description:`Placeholder text shown while the element has no content. Exposed to
assistive technology via \`aria-placeholder\` and drawn by the stylesheet
when the element is empty.`,name:`placeholder`,required:!1,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}export{init_content_editable_control as n,g as t};