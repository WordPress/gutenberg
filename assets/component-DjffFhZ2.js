import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./icon-0FKfN3kn.js";import{a as o,n as s,o as c,t as l}from"./component-BcQfUhUY.js";function UnforwardedToggleGroupControlOptionIcon(e,t){c(`ToggleGroupControlOptionIcon`);let{icon:n,label:r,...i}=e;return(0,u.jsx)(l,{...i,isIcon:!0,"aria-label":r,showTooltip:!0,ref:t,children:(0,u.jsx)(a,{icon:n})})}var u,d;function init_component(){return(init_component=e((()=>{n(),s(),o(),i(),u=t(),d=(0,r.forwardRef)(UnforwardedToggleGroupControlOptionIcon),d.displayName=`ToggleGroupControlOptionIcon`;try{d.__docgenInfo={description:`\`ToggleGroupControlOptionIcon\` is a form component which is meant to be used as a
child of \`ToggleGroupControl\` and displays an icon.

\`\`\`jsx

import {
__experimentalToggleGroupControl as ToggleGroupControl,
__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
from '@wordpress/components';
import { formatLowercase, formatUppercase } from '@wordpress/icons';

function Example() {
 return (
   <ToggleGroupControl>
     <ToggleGroupControlOptionIcon
       value="uppercase"
       label="Uppercase"
       icon={ formatUppercase }
     />
     <ToggleGroupControlOptionIcon
       value="lowercase"
       label="Lowercase"
       icon={ formatLowercase }
     />
   </ToggleGroupControl>
 );
}
\`\`\``,displayName:`ToggleGroupControlOptionIcon`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-group-control/toggle-group-control-option-icon/component.tsx`,methods:[],props:{disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:`Whether this option is unselectable.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:``,name:`value`,required:!0,tags:{},type:{name:`string | number`}},icon:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:"Icon displayed as the content of the option. Usually one of the icons from\nthe `@wordpress/icons` package, or a custom React `<svg>` icon.",name:`icon`,required:!0,tags:{},type:{name:`Element`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:`The text to accessibly label the icon option. Will also be shown in a tooltip.`,name:`label`,required:!0,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}export{init_component as n,d as t};