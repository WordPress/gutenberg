import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,n as a,o,t as s}from"./component-BcQfUhUY.js";function UnforwardedToggleGroupControlOption(e,t){o(`ToggleGroupControlOption`);let{label:n,...r}=e,i=r[`aria-label`]||n;return(0,c.jsx)(s,{...r,"aria-label":i,ref:t,children:n})}var c,l;function init_component(){return(init_component=e((()=>{n(),a(),i(),c=t(),l=(0,r.forwardRef)(UnforwardedToggleGroupControlOption),l.displayName=`ToggleGroupControlOption`;try{l.__docgenInfo={description:`\`ToggleGroupControlOption\` is a form component and is meant to be used as a
child of \`ToggleGroupControl\`.

\`\`\`jsx
import {
  __experimentalToggleGroupControl as ToggleGroupControl,
  __experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

function Example() {
  return (
    <ToggleGroupControl
      label="my label"
      value="vertical"
      isBlock
    >
      <ToggleGroupControlOption value="horizontal" label="Horizontal" />
      <ToggleGroupControlOption value="vertical" label="Vertical" />
    </ToggleGroupControl>
  );
}
\`\`\``,displayName:`ToggleGroupControlOption`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-group-control/toggle-group-control-option/component.tsx`,methods:[],props:{disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:`Whether this option is unselectable.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:``,name:`value`,required:!0,tags:{},type:{name:`string | number`}},showTooltip:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:"Whether to display a Tooltip for the control option. If set to `true`, the tooltip will\nshow the aria-label or the label prop text.",name:`showTooltip`,required:!1,tags:{},type:{name:`boolean`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-group-control/types.ts`,name:`TypeLiteral`}],description:"Label for the option. If needed, the `aria-label` prop can be used in addition\nto specify a different label for assistive technologies.",name:`label`,required:!0,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}export{init_component as n,l as t};