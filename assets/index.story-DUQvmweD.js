import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-HHKy9azc.js";import{n as o,t as s}from"./custom-gradient-picker-SMhqFk-e.js";function CustomGradientPicker(e){return a(`wp.components.CustomGradientPicker`,{since:`7.3`,alternative:`wp.components.GradientPicker`,hint:"Set `clearable={ false }` to render only the custom gradient editor."}),(0,c.jsx)(s,{...e})}var c;function init_deprecated(){return(init_deprecated=e((()=>{i(),o(),c=t();try{CustomGradientPicker.__docgenInfo={description:"CustomGradientPicker is a React component that renders a UI for specifying\nlinear or radial gradients. Radial gradients are displayed in the picker as\na slice of the gradient from the center to the outside.\n\nThis component is deprecated. Use `GradientPicker` with `clearable={ false }`\ninstead. Without the `gradients` prop, it renders the same gradient editor\nwithout presets or a Clear button.\n\n`GradientPicker` types its `onChange` argument as `string | undefined`.\nWithout presets or a Clear button it only passes a string, but a callback\nthat accepts only a string needs to narrow the value first.",displayName:`CustomGradientPicker`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/custom-gradient-picker/deprecated.tsx`,methods:[],props:{__nextHasNoMargin:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/custom-gradient-picker/types.ts`,name:`TypeLiteral`}],description:`Start opting in to the new margin-free styles that will become the default
in a future version, currently scheduled to be WordPress 6.4. (The prop
can be safely removed once this happens.)
@deprecated Default behavior since WP 6.5. Prop can be safely removed.
@ignore`,name:`__nextHasNoMargin`,required:!1,tags:{},type:{name:`boolean`}},value:{defaultValue:{value:`'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)'`},declarations:[{fileName:`gutenberg/packages/components/src/custom-gradient-picker/types.ts`,name:`TypeLiteral`}],description:"The current value of the gradient. Pass a css gradient string (See default value for example).\nOptionally pass in a `null` value to specify no gradient is currently selected.",name:`value`,required:!1,tags:{},type:{name:`string | null`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/custom-gradient-picker/types.ts`,name:`TypeLiteral`}],description:"The function called when a new gradient has been defined. It is passed to\nthe `currentGradient` as an argument.",name:`onChange`,required:!0,tags:{},type:{name:`(currentGradient: string) => void`}},enableAlpha:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/custom-gradient-picker/types.ts`,name:`TypeLiteral`}],description:`Whether to enable alpha transparency options in the picker.`,name:`enableAlpha`,required:!1,tags:{},type:{name:`boolean`}},__experimentalIsRenderedInSidebar:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/custom-gradient-picker/types.ts`,name:`TypeLiteral`}],description:`Whether this is rendered in the sidebar.`,name:`__experimentalIsRenderedInSidebar`,required:!1,tags:{},type:{name:`boolean`}}},tags:{deprecated:`Use \`GradientPicker\` with \`clearable={ false }\` instead.

\`\`\`jsx
import { GradientPicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyGradientEditor = () => {
const [ gradient, setGradient ] = useState();

return (
<GradientPicker
clearable={ false }
value={ gradient }
onChange={ setGradient }
/>
);
};
\`\`\``}}}catch{}})))()}var l,u,d,CustomGradientPickerWithState,f;function init_index_story(){return(init_index_story=e((()=>{n(),init_deprecated(),l=t(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={title:`Components/@wordpress-components/Deprecated/CustomGradientPicker`,id:`components-customgradientpicker`,component:CustomGradientPicker,args:{onChange:u()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Deprecated. Use [`GradientPicker`](?path=/docs/components-gradientpicker--docs) with `clearable={ false }` instead."}}},CustomGradientPickerWithState=({onChange:e,...t})=>{let[n,i]=(0,r.useState)();return(0,l.jsx)(CustomGradientPicker,{...t,value:n,onChange:t=>{i(t),e(t)}})},f=CustomGradientPickerWithState.bind({}),f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [gradient, setGradient] = useState<string>();
  return <CustomGradientPicker {...props} value={gradient} onChange={newGradient => {
    setGradient(newGradient);
    onChange(newGradient);
  }} />;
}`,...f.parameters?.docs?.source}}}})))()}init_index_story();export{f as Default,d as default};