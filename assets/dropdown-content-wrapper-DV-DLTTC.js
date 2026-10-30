import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{a as n,i as r}from"./iframe-BbJPeSVw.js";import{n as i,o as a,r as o,t as s}from"./use-context-system-CT9ido3G.js";var c;function init_style_module(){return(init_style_module=e((()=>{c={"content-wrapper":`_content-wrapper_s8m4k_46`,"padding-small":`_padding-small_s8m4k_61`,"padding-medium":`_padding-medium_s8m4k_65`}})))()}function UnconnectedDropdownContentWrapper(e,t){let{paddingSize:n=`small`,className:a,...o}=i(e,`DropdownContentWrapper`);return(0,l.jsx)(`div`,{...o,className:r(c[`content-wrapper`],{[c[`padding-small`]]:n!==`none`&&n!==`medium`,[c[`padding-medium`]]:n===`medium`},a),ref:t})}var l,u;function init_dropdown_content_wrapper(){return(init_dropdown_content_wrapper=e((()=>{n(),a(),s(),init_style_module(),l=t(),u=o(UnconnectedDropdownContentWrapper,`DropdownContentWrapper`);try{u.__docgenInfo={description:`A convenience wrapper for the \`renderContent\` when you want to apply
different padding. (Default is \`paddingSize="small"\`).

\`\`\`jsx
import {
  Dropdown,
  __experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';

<Dropdown
  renderContent={ () => (
    <DropdownContentWrapper paddingSize="medium">
      My dropdown content
    </DropdownContentWrapper>
) }
/>
\`\`\``,displayName:`DropdownContentWrapper`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/dropdown/dropdown-content-wrapper.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown/types.ts`,name:`TypeLiteral`}],description:`The content to render inside the wrapper.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},paddingSize:{defaultValue:{value:`'small'`},declarations:[{fileName:`gutenberg/packages/components/src/dropdown/types.ts`,name:`TypeLiteral`}],description:`Amount of padding to apply on the dropdown content.`,name:`paddingSize`,required:!1,tags:{},type:{name:`enum`,raw:`"small" | "none" | "medium"`,value:[{value:`"small"`},{value:`"none"`},{value:`"medium"`}]}}},tags:{}}}catch{}})))()}export{init_dropdown_content_wrapper as n,u as t};