import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./use-instance-id-DuzD68j8.js";import{a as s,i as c}from"./iframe-BbJPeSVw.js";import{n as l,t as u}from"./visually-hidden-Bafg0_Jr.js";import{n as d,t as f}from"./text-CZST2HxV.js";import{n as p,t as m}from"./stack-yNRxuGKo.js";import{n as h,o as g}from"./base-control-styles-BOtcM_cV.js";import{n as _,t as v}from"./base-control-Br0KG0a3.js";function generateOptionDescriptionId(e,t){return`${e}-${t}-option-description`}function generateOptionId(e,t){return`${e}-${t}`}function generateHelpId(e){return`${e}__help`}function RadioControl(e){let{label:t,className:n,selected:r,help:i,onChange:o,onClick:s,hideLabelFromVision:l,disabled:d,options:p=[],id:g,..._}=e,b=a(RadioControl,`inspector-radio-control`,g),onChangeValue=e=>o(e.target.value);return p?.length?(0,y.jsxs)(`fieldset`,{id:b,role:`radiogroup`,className:c(n,`components-radio-control`),disabled:d,"aria-describedby":i?generateHelpId(b):void 0,children:[l?(0,y.jsx)(u,{render:(0,y.jsx)(`legend`,{}),children:t}):(0,y.jsx)(v.VisualLabel,{as:`legend`,children:t}),(0,y.jsxs)(m,{direction:`column`,gap:`md`,align:`stretch`,className:c(`components-radio-control__group-wrapper`,{"has-help":!!i}),children:[!!i&&(0,y.jsx)(f,{id:generateHelpId(b),variant:`body-sm`,className:`components-radio-control__help`,children:i}),p.map((e,t)=>(0,y.jsxs)(`div`,{className:`components-radio-control__option`,children:[(0,y.jsx)(`input`,{id:generateOptionId(b,t),className:`components-radio-control__input`,type:`radio`,name:b,value:e.value,disabled:e.disabled,onChange:onChangeValue,checked:e.value===r,"aria-describedby":e.description?generateOptionDescriptionId(b,t):void 0,onClick:e=>{e.currentTarget.focus(),s?.(e)},..._}),(0,y.jsx)(`label`,{className:`components-radio-control__label`,htmlFor:generateOptionId(b,t),children:e.label}),e.description?(0,y.jsx)(h,{id:generateOptionDescriptionId(b,t),className:`components-radio-control__option-description`,children:e.description}):null]},generateOptionId(b,t)))]})]}):null}var y;function init_radio_control(){return(init_radio_control=e((()=>{s(),o(),p(),d(),l(),_(),g(),y=n();try{RadioControl.__docgenInfo={description:`Render a user interface to select the user type using radio inputs.

\`\`\`jsx
import { RadioControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyRadioControl = () => {
  const [ option, setOption ] = useState( 'a' );

  return (
    <RadioControl
      label="User type"
      help="The type of the current user"
      selected={ option }
      options={ [
        { label: 'Author', value: 'a' },
        { label: 'Editor', value: 'e' },
      ] }
      onChange={ ( value ) => setOption( value ) }
    />
  );
};
\`\`\``,displayName:`RadioControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/radio-control/index.tsx`,methods:[],props:{label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If this property is added, a label will be generated using label property as the content.`,name:`label`,required:!1,tags:{},type:{name:`ReactNode`}},hideLabelFromVision:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If true, the label will only be visible to screen readers.`,name:`hideLabelFromVision`,required:!1,tags:{},type:{name:`boolean`}},help:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Additional description for the control.

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/radio-control/types.ts`,name:`TypeLiteral`}],description:`Whether the radio group should be disabled.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/radio-control/types.ts`,name:`TypeLiteral`}],description:`A function that receives the value of the new option that is being
selected as input.`,name:`onChange`,required:!0,tags:{},type:{name:`(value: string) => void`}},options:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/radio-control/types.ts`,name:`TypeLiteral`}],description:`An array of objects containing the value and label of the options.`,name:`options`,required:!1,tags:{},type:{name:`{ label: string; value: string; description?: string; disabled?: boolean; }[] | undefined`}},selected:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/radio-control/types.ts`,name:`TypeLiteral`}],description:`The value property of the currently selected option.`,name:`selected`,required:!1,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}var b=t({Default:()=>C,WithDisabledOption:()=>T,WithOptionDescriptions:()=>w,default:()=>S}),x,S,Template,C,w,T;function init_index_story(){return(init_index_story=e((()=>{r(),init_radio_control(),x=n(),S={component:RadioControl,title:`Components/@wordpress-components/Selection & Input/Common/RadioControl`,id:`components-radiocontrol`,argTypes:{onChange:{action:`onChange`},selected:{control:!1},label:{control:{type:`text`}},help:{control:{type:`text`}}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`RadioGroupControl`](?path=/docs/design-system-components-form-radiogroupcontrol--docs) from `@wordpress/ui` instead. See the [migration guide](?path=/docs/components-radiocontrol--migration-guide)."}}},Template=({onChange:e,options:t,...n})=>{let[r,a]=(0,i.useState)(t?.[0]?.value);return(0,x.jsx)(RadioControl,{...n,selected:r,options:t,onChange:t=>{a(t),e(t)}})},C=Template.bind({}),C.args={label:`Post visibility`,options:[{label:`Public`,value:`public`},{label:`Private`,value:`private`},{label:`Password Protected`,value:`password`}]},w=Template.bind({}),w.args={...C.args,options:[{label:`Public`,value:`public`,description:`Visible to everyone`},{label:`Private`,value:`private`,description:`Only visible to you`},{label:`Password Protected`,value:`password`,description:`Protected by a password`}]},T=Template.bind({}),T.args={...C.args,options:[{label:`Public`,value:`public`},{label:`Private`,value:`private`,disabled:!0},{label:`Password Protected`,value:`password`}]},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`({
  onChange,
  options,
  ...args
}) => {
  const [value, setValue] = useState(options?.[0]?.value);
  return <RadioControl {...args} selected={value} options={options} onChange={v => {
    setValue(v);
    onChange(v);
  }} />;
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`({
  onChange,
  options,
  ...args
}) => {
  const [value, setValue] = useState(options?.[0]?.value);
  return <RadioControl {...args} selected={value} options={options} onChange={v => {
    setValue(v);
    onChange(v);
  }} />;
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`({
  onChange,
  options,
  ...args
}) => {
  const [value, setValue] = useState(options?.[0]?.value);
  return <RadioControl {...args} selected={value} options={options} onChange={v => {
    setValue(v);
    onChange(v);
  }} />;
}`,...T.parameters?.docs?.source}}}})))()}export{init_index_story as n,b as t};