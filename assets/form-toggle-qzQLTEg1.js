import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a}from"./iframe-C1l0lKsJ.js";import{a as o,o as s,r as c,t as l}from"./svg-Dgb-Scyw.js";function UnforwardedFormToggle(e,t){let{className:n,checked:r,id:i,disabled:o,onChange:s=noop,onClick:c,...l}=e,p=a(`components-form-toggle`,n,{"is-checked":r,"is-disabled":o});return(0,u.jsxs)(`span`,{className:p,children:[(0,u.jsx)(`input`,{className:`components-form-toggle__input`,id:i,type:`checkbox`,checked:r,onChange:s,disabled:o,onClick:e=>{e.currentTarget.focus(),c?.(e)},...l,ref:t}),(0,u.jsx)(`span`,{className:`components-form-toggle__track`}),(0,u.jsxs)(`span`,{className:`components-form-toggle__labels`,children:[d,f]}),(0,u.jsx)(`span`,{className:`components-form-toggle__thumb`})]})}var u,noop,d,f,p;function init_form_toggle(){return(init_form_toggle=e((()=>{i(),n(),s(),u=t(),noop=()=>{},d=(0,u.jsx)(o,{className:`components-form-toggle__label components-form-toggle__on-label`,xmlns:`http://www.w3.org/2000/svg`,viewBox:`0 0 8 8`,children:(0,u.jsx)(c,{d:`M4 1.5v5`,fill:`none`,stroke:`currentColor`,strokeLinecap:`round`})}),f=(0,u.jsx)(o,{className:`components-form-toggle__label components-form-toggle__off-label`,xmlns:`http://www.w3.org/2000/svg`,viewBox:`0 0 8 8`,children:(0,u.jsx)(l,{cx:4,cy:4,r:2.5,fill:`none`,stroke:`currentColor`})}),p=(0,r.forwardRef)(UnforwardedFormToggle),p.displayName=`FormToggle`;try{p.__docgenInfo={description:`FormToggle switches a single setting on or off.

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
styles.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`A callback function invoked when the toggle is clicked.`,name:`onChange`,required:!0,tags:{},type:{name:`(event: ChangeEvent<HTMLInputElement, Element>) => void`}}},tags:{}}}catch{}})))()}export{init_form_toggle as n,p as t};