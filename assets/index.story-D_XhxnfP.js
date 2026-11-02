import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a}from"./iframe-y9psNcyg.js";import{n as o,t as s}from"./stack-BwmLRIE8.js";import{a as c,i as l,n as u,o as d,r as f,t as p}from"./description-QbEutRc0.js";import{n as m,t as h}from"./item-eVSJU8Vk.js";import{a as g,i as _,n as v,o as y,r as b,t as x}from"./description-DjlOrFzr.js";import{n as S,t as C}from"./details-DNIikmoT.js";import{i as w,n as T,r as E,t as D}from"./radio-group-CIDqTPZB.js";import{i as O,n as k,t as A}from"./shared-CtChWZpH.js";var j,M,N,P,F;function init_style_module(){return(init_style_module=e((()=>{j=`_root_1himi_5`,M=`_radio_1himi_10`,N=`_label_1himi_22`,P=`_item_1himi_26`,F={root:j,"radio-wrapper":`_radio-wrapper_1himi_10`,radio:M,label:N,item:P}})))()}var I,L,TextContainer,R;function init_radio_group_control(){return(init_radio_group_control=e((()=>{i(),n(),d(),m(),l(),u(),y(),_(),v(),S(),w(),T(),o(),init_style_module(),I=t(),L=(0,I.jsx)(s,{gap:`sm`,align:`start`,className:F.item}),TextContainer=({isStack:e,...t})=>e?(0,I.jsx)(s,{direction:`column`,gap:`xs`,...t}):(0,I.jsx)(r.Fragment,{...t}),R=(0,r.forwardRef)(function UnforwardedRadioGroupControl({items:e,className:t,label:n,description:r,details:i,hideLabelFromVision:o,name:s,...l},u){return(0,I.jsx)(c,{name:s,className:a(F.root,t),children:(0,I.jsxs)(g,{render:(0,I.jsx)(D,{ref:u,...l}),children:[(0,I.jsx)(b,{hideFromVision:o,children:n}),r&&(0,I.jsx)(x,{children:r}),i&&(0,I.jsx)(C,{children:i}),e.map(e=>(0,I.jsxs)(h,{render:L,children:[(0,I.jsx)(`div`,{className:F[`radio-wrapper`],children:(0,I.jsx)(E,{value:e.value,disabled:e.disabled,className:F.radio})}),(0,I.jsxs)(TextContainer,{isStack:!!e.description,children:[(0,I.jsx)(f,{variant:`plain`,className:F.label,children:e.label}),e.description&&(0,I.jsx)(p,{children:e.description})]})]},e.value))]})})});try{R.__docgenInfo={description:`A complete radio group with a legend, optional description, and labeled items.`,displayName:`RadioGroupControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/radio-group-control/radio-group-control.tsx`,methods:[],props:{render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},name:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`Identifies the field when a form is submitted.`,name:`name`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`string`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},form:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`Identifies the form that owns the radio inputs.
Useful when the radio group is rendered outside the form.`,name:`form`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},defaultValue:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`The uncontrolled value of the radio button that should be initially selected.

To render a controlled radio group, use the \`value\` prop instead.`,name:`defaultValue`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`string`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`Whether the component should ignore user interaction.`,name:`disabled`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`boolean`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`The controlled value of the radio item that should be currently selected.

To render an uncontrolled radio group, use the \`defaultValue\` prop instead.`,name:`value`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`string`}},readOnly:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`Whether the user should be unable to select a different radio button in the group.`,name:`readOnly`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`boolean`}},required:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`Whether the user must choose a value before submitting a form.`,name:`required`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`boolean`}},onValueChange:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`Callback fired when the value changes.`,name:`onValueChange`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`((value: string, eventDetails: { reason: "none"; event: Event; cancel: () => void; allowPropagation: () => void; isCanceled: boolean; isPropagationAllowed: boolean; trigger: Element; }) => void)`}},inputRef:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`}],description:`A ref to access the hidden input element.`,name:`inputRef`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/radio-group/RadioGroup.d.mts`,name:`RadioGroupProps`},required:!1,tags:{},type:{name:`Ref<HTMLInputElement>`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/form/types.ts`,name:`TypeLiteral`}],description:`The accessible label. All controls must be labeled.`,name:`label`,required:!0,tags:{},type:{name:`string`}},description:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/form/types.ts`,name:`TypeLiteral`}],description:`The accessible description, associated using \`aria-describedby\`.

For screen reader accessibility, this should only contain plain text,
and no semantics such as links.`,name:`description`,required:!1,tags:{},type:{name:`string`}},details:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/form/types.ts`,name:`TypeLiteral`}],description:`Additional information about the field, which unlike a normal description,
can include links and other semantic elements.

Do not use this prop when the content is only plain text;
use \`description\` instead.`,name:`details`,required:!1,tags:{},type:{name:`ReactNode`}},hideLabelFromVision:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/ui/src/form/types.ts`,name:`TypeLiteral`}],description:`Whether to visually hide the label while keeping it accessible
to screen readers.`,name:`hideLabelFromVision`,required:!1,tags:{},type:{name:`boolean`}},items:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/form/radio-group-control/types.ts`,name:`TypeLiteral`}],description:`The radio options to render.`,name:`items`,required:!0,tags:{},type:{name:`{ label: string; value: string; description?: string | undefined; disabled?: boolean | undefined; }[]`}}},tags:{}}}catch{}})))()}var z,B,V,H,U,W,G,K,q;function init_index_story(){return(init_index_story=e((()=>{init_radio_group_control(),O(),z={tags:[`manifest`],title:`Components/@wordpress-ui/Form/RadioGroupControl`,id:`design-system-components-form-radiogroupcontrol`,component:R,argTypes:{onValueChange:{action:`onValueChange`},value:{control:!1},defaultValue:{control:!1}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},B=[{label:`Apple`,value:`apple`,description:`This is the description for the apple.`},{label:`Banana`,value:`banana`,description:`This is the description for the banana.`}],V={args:{label:`Label`,items:B}},H={args:{...V.args,description:`This is the description for the entire fieldset.`}},U={args:{...V.args,items:[{label:`This is a long label that should wrap to the next line. This is a long label that should wrap to the next line. This is a long label that should wrap to the next line.`,value:`apple`},{label:`Banana`,value:`banana`}]}},W={args:{...V.args,hideLabelFromVision:!0}},G={parameters:{docs:{description:{story:k}}},args:{...V.args,details:A}},K={args:{...V.args,items:[{label:`Apple`,value:`apple`},{label:`Banana`,value:`banana`,description:`This item is disabled.`,disabled:!0},{label:`Orange`,value:`orange`}]}},q={args:{...V.args,disabled:!0}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Label',
    items: defaultItems
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    description: 'This is the description for the entire fieldset.'
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    items: [{
      label: 'This is a long label that should wrap to the next line. This is a long label that should wrap to the next line. This is a long label that should wrap to the next line.',
      value: 'apple'
    }, {
      label: 'Banana',
      value: 'banana'
    }]
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    hideLabelFromVision: true
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: WITH_DETAILS_DESCRIPTION
      }
    }
  },
  args: {
    ...Default.args,
    details: DETAILS_EXAMPLE
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    items: [{
      label: 'Apple',
      value: 'apple'
    }, {
      label: 'Banana',
      value: 'banana',
      description: 'This item is disabled.',
      disabled: true
    }, {
      label: 'Orange',
      value: 'orange'
    }]
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    disabled: true
  }
}`,...q.parameters?.docs?.source}}}})))()}init_index_story();export{V as Default,q as Disabled,W as VisuallyHiddenLabel,H as WithDescription,G as WithDetails,K as WithDisabledItem,U as WithLongLabel,z as default};