import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-HHKy9azc.js";import{n as o,t as s}from"./form-toggle-BhdmKaJO.js";function UnforwardedDeprecatedFormToggle(e,t){return a(`wp.components.FormToggle`,{since:`7.3`,version:`7.5`,alternative:`Switch from @wordpress/ui`}),(0,c.jsx)(s,{...e,ref:t})}var c,l;function init_deprecated(){return(init_deprecated=e((()=>{i(),n(),o(),c=t(),l=(0,r.forwardRef)(UnforwardedDeprecatedFormToggle),l.displayName=`FormToggle`;try{l.__docgenInfo={description:`FormToggle switches a single setting on or off.`,displayName:`FormToggle`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/form-toggle/deprecated.tsx`,methods:[],props:{checked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`If checked is true the toggle will be checked. If checked is false the
toggle will be unchecked. If no value is passed the toggle will be
unchecked.`,name:`checked`,required:!1,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`If disabled is true the toggle will be disabled and apply the appropriate
styles.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`A callback function invoked when the toggle is clicked.`,name:`onChange`,required:!0,tags:{},type:{name:`(event: ChangeEvent<HTMLInputElement, Element>) => void`}}},tags:{deprecated:`Use \`Switch\` from \`@wordpress/ui\` instead.

\`\`\`jsx
import { FormToggle } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyFormToggle = () => {
const [ isChecked, setChecked ] = useState( true );

return (
<FormToggle
checked={ isChecked }
onChange={ () => setChecked( ( state ) => ! state ) }
/>
);
};
\`\`\``}}}catch{}})))()}var u,d,Template,f;function init_index_story(){return(init_index_story=e((()=>{n(),init_deprecated(),u=t(),d={component:l,id:`components-formtoggle`,title:`Components/@wordpress-components/Deprecated/FormToggle`,argTypes:{onChange:{action:`onChange`}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Deprecated. Use [`Switch`](?path=/docs/design-system-components-form-primitives-switch--docs) from `@wordpress/ui` instead. See the [migration guide](?path=/docs/components-togglecontrol--migration-guide)."},a11y:{test:`todo`}}},Template=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(!0);return(0,u.jsx)(l,{...t,checked:n,onChange:t=>{i(e=>!e),e(t)}})},f=Template.bind({}),f.args={},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [isChecked, setChecked] = useState(true);
  return <FormToggle {...args} checked={isChecked} onChange={e => {
    setChecked(state => !state);
    onChange(e);
  }} />;
}`,...f.parameters?.docs?.source}}}})))()}init_index_story();export{f as Default,d as default};