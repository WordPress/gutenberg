import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./build-module-HHKy9azc.js";import{a as i,i as a}from"./iframe-BbJPeSVw.js";import{ir as o,ka as s,ls as c,n as l,zc as u}from"./build-module-DttIWYbV.js";import{n as d,t as f}from"./icon-DQj1iRYw.js";function contextBasedIcon(e=`default`){switch(e){case`info`:return s;case`success`:return o;case`warning`:return u;case`error`:return c;default:return null}}function Badge({className:e,intent:t=`default`,children:n,...i}){r(`wp.components.privateApis.Badge`,{since:`7.2`,alternative:`Badge from @wordpress/ui`,hint:`This private API will be completely removed within a few Gutenberg plugin releases.`});let o=contextBasedIcon(t),s=!!o;return(0,p.jsx)(`span`,{className:a(`components-badge`,e,{[`is-${t}`]:t,"has-icon":s}),...i,children:(0,p.jsxs)(`span`,{className:`components-badge__flex-wrapper`,children:[s&&(0,p.jsx)(f,{icon:o,size:16,fill:`currentColor`,className:`components-badge__icon`}),(0,p.jsx)(`span`,{className:`components-badge__content`,children:n})]})})}var p;function init_badge(){return(init_badge=e((()=>{i(),l(),n(),d(),p=t();try{Badge.__docgenInfo={description:``,displayName:`Badge`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/badge/index.tsx`,methods:[],props:{intent:{defaultValue:{value:`default`},declarations:[{fileName:`gutenberg/packages/components/src/badge/types.ts`,name:`TypeLiteral`}],description:`Badge variant.`,name:`intent`,required:!1,tags:{},type:{name:`enum`,raw:`"default" | "info" | "success" | "warning" | "error"`,value:[{value:`"default"`},{value:`"info"`},{value:`"success"`},{value:`"warning"`},{value:`"error"`}]}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/badge/types.ts`,name:`TypeLiteral`}],description:`Text to display inside the badge.`,name:`children`,required:!0,tags:{},type:{name:`string`}}},tags:{deprecated:"Use `Badge` from `@wordpress/ui` instead."}}}catch{}})))()}var m,h,g,_,v,y;function init_index_story(){return(init_index_story=e((()=>{init_badge(),m={component:Badge,title:`Components/@wordpress-components/Deprecated/Badge`,id:`components-badge`,tags:[`status-private`],parameters:{componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Deprecated. Use [`Badge`](?path=/docs/design-system-components-badge--docs) from `@wordpress/ui` instead."},docs:{description:{component:"This component is deprecated. Please use `Badge` from the `@wordpress/ui`\npackage instead."}}}},h={args:{children:`Code is Poetry`}},g={args:{...h.args,intent:`info`}},_={args:{...h.args,intent:`success`}},v={args:{...h.args,intent:`warning`}},y={args:{...h.args,intent:`error`}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Code is Poetry'
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    intent: 'info'
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    intent: 'success'
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    intent: 'warning'
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    intent: 'error'
  }
}`,...y.parameters?.docs?.source}}}})))()}init_index_story();export{h as Default,y as Error,g as Info,_ as Success,v as Warning,m as default};