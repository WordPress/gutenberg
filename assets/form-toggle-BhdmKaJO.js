import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a}from"./iframe-BbJPeSVw.js";function UnforwardedFormToggle(e,t){let{className:n,checked:r,id:i,disabled:s,onChange:c=noop,onClick:l,...u}=e,d=a(`components-form-toggle`,n,{"is-checked":r,"is-disabled":s});return(0,o.jsxs)(`span`,{className:d,children:[(0,o.jsx)(`input`,{className:`components-form-toggle__input`,id:i,type:`checkbox`,checked:r,onChange:c,disabled:s,onClick:e=>{e.currentTarget.focus(),l?.(e)},...u,ref:t}),(0,o.jsx)(`span`,{className:`components-form-toggle__track`}),(0,o.jsx)(`span`,{className:`components-form-toggle__thumb`})]})}var o,noop,s;function init_form_toggle(){return(init_form_toggle=e((()=>{i(),n(),o=t(),noop=()=>{},s=(0,r.forwardRef)(UnforwardedFormToggle),s.displayName=`FormToggle`;try{s.__docgenInfo={description:`FormToggle switches a single setting on or off.

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
\`\`\``,displayName:`FormToggle`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/form-toggle/index.tsx`,methods:[],props:{checked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`If checked is true the toggle will be checked. If checked is false the
toggle will be unchecked. If no value is passed the toggle will be
unchecked.`,name:`checked`,required:!1,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`If disabled is true the toggle will be disabled and apply the appropriate
styles.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`A callback function invoked when the toggle is clicked.`,name:`onChange`,required:!0,tags:{},type:{name:`(event: ChangeEvent<HTMLInputElement, Element>) => void`}}},tags:{}}}catch{}})))()}export{init_form_toggle as n,s as t};