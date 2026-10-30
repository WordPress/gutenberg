import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./use-instance-id-DuzD68j8.js";import{a as s,i as c}from"./iframe-BbJPeSVw.js";import{n as l,t as u}from"./icon-BGlJFHC6.js";import{i as d,n as f}from"./build-module-DttIWYbV.js";import{n as p,t as m}from"./stack-yNRxuGKo.js";import{n as h,t as g}from"./component-4ETjfpkJ.js";import{n as _,t as v}from"./component-BY3Du5yg.js";import{n as y,t as b}from"./base-control-Br0KG0a3.js";import{n as x,t as S}from"./form-toggle-BhdmKaJO.js";function UnforwardedToggleControl({label:e,checked:t,help:n,className:r,onChange:i,disabled:o,__nextHasNoMarginBottom:s,...l},u){function onChangeToggle(e){i(e.target.checked)}let d=`inspector-toggle-control-${a(w)}`,f,p;return n&&(typeof n==`function`?t!==void 0&&(p=n(t)):p=n,p&&(f=d+`__help`)),(0,C.jsx)(b,{id:d,help:p&&(0,C.jsx)(`span`,{className:`components-toggle-control__help`,children:p}),className:c(`components-toggle-control`,r),children:(0,C.jsxs)(v,{justify:`flex-start`,spacing:2,children:[(0,C.jsx)(S,{id:d,checked:t,onChange:onChangeToggle,"aria-describedby":f,disabled:o,ref:u,...l}),(0,C.jsx)(g,{as:`label`,htmlFor:d,className:c(`components-toggle-control__label`,{"is-disabled":o}),children:e})]})})}var C,w;function init_toggle_control(){return(init_toggle_control=e((()=>{s(),r(),o(),h(),x(),y(),_(),C=n(),w=(0,i.forwardRef)(UnforwardedToggleControl),w.displayName=`ToggleControl`;try{w.__docgenInfo={description:`ToggleControl is used to generate a toggle user interface.

\`\`\`jsx
import { ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyToggleControl = () => {
  const [ value, setValue ] = useState( false );

  return (
    <ToggleControl
      label="Fixed Background"
      checked={ value }
      onChange={ () => setValue( ( state ) => ! state ) }
    />
  );
};
\`\`\``,displayName:`ToggleControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-control/index.tsx`,methods:[],props:{disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`If disabled is true the toggle will be disabled and apply the appropriate
styles.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},checked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-toggle/types.ts`,name:`TypeLiteral`}],description:`If checked is true the toggle will be checked. If checked is false the
toggle will be unchecked. If no value is passed the toggle will be
unchecked.`,name:`checked`,required:!1,tags:{},type:{name:`boolean`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:``,name:`className`,required:!1,tags:{},type:{name:`string`}},__nextHasNoMarginBottom:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the new margin-free styles that will become the default in a future version.
@deprecated Default behavior since WordPress 7.0. Prop can be safely removed.
@ignore`,name:`__nextHasNoMarginBottom`,required:!1,tags:{},type:{name:`boolean`}},help:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-control/types.ts`,name:`TypeLiteral`}],description:``,name:`help`,required:!1,tags:{},type:{name:`ReactNode | ((checked: boolean) => ReactNode)`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-control/types.ts`,name:`TypeLiteral`}],description:`The label for the toggle.`,name:`label`,required:!0,tags:{},type:{name:`ReactNode`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/toggle-control/types.ts`,name:`TypeLiteral`}],description:`A callback function invoked when the toggle is clicked.`,name:`onChange`,required:!0,tags:{},type:{name:`(value: boolean) => void`}}},tags:{}}}catch{}})))()}var T=t({Default:()=>O,WithHelpText:()=>k,WithVisual:()=>A,default:()=>D});function ControlledToggleControl({onChange:e,...t}){let[n,r]=(0,i.useState)(!0);return(0,E.jsx)(w,{...t,checked:n,onChange:(...t)=>{r(...t),e(...t)}})}var E,D,O,k,A;function init_index_story(){return(init_index_story=e((()=>{r(),f(),l(),p(),init_toggle_control(),E=n(),D={title:`Components/@wordpress-components/Selection & Input/Common/ToggleControl`,id:`components-togglecontrol`,component:w,argTypes:{checked:{control:!1},help:{control:{type:`text`}},label:{control:{type:`text`}},onChange:{action:`onChange`}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`SwitchControl`](?path=/docs/design-system-components-form-switchcontrol--docs) from `@wordpress/ui` instead. See the [migration guide](?path=/docs/components-togglecontrol--migration-guide)."}}},ControlledToggleControl.displayName=`ToggleControl`,O={render:e=>(0,E.jsx)(ControlledToggleControl,{...e}),args:{label:`Enable something`}},k={...O,args:{...O.args,help:`This is some help text.`}},A={...O,render:e=>(0,E.jsxs)(m,{gap:`md`,align:`flex-start`,justify:`space-between`,children:[(0,E.jsx)(m,{children:(0,E.jsx)(ControlledToggleControl,{...e})}),(0,E.jsx)(m,{align:`center`,justify:`center`,style:{backgroundColor:`var(--wpds-color-background-surface-neutral-weak, #f4f4f4)`,borderRadius:`var(--wpds-border-radius-md, 4px)`,flexShrink:0,height:`var(--wpds-dimension-size-lg, 40px)`,width:`var(--wpds-dimension-size-lg, 40px)`},children:(0,E.jsx)(u,{icon:d})})]}),args:{...O.args,help:`Additional context that helps users understand what this setting does and when they might want to turn it on or off.`}};try{A.__docgenInfo={description:`When adding a visual aid, prefer placing it at the trailing end of the row,
rather than placing it directly before the label, or moving the toggle to the trailing end.`,displayName:`WithVisual`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/toggle-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  render: args => <ControlledToggleControl {...args} />,
  args: {
    label: 'Enable something'
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    help: 'This is some help text.'
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  ...Default,
  render: args => <Stack gap="md" align="flex-start" justify="space-between">
            <Stack>
                <ControlledToggleControl {...args} />
            </Stack>
            <Stack align="center" justify="center" style={{
      backgroundColor: 'var(--wpds-color-background-surface-neutral-weak)',
      borderRadius: 'var(--wpds-border-radius-md)',
      flexShrink: 0,
      height: 'var(--wpds-dimension-size-lg)',
      width: 'var(--wpds-dimension-size-lg)'
    }}>
                <Icon icon={wordpress} />
            </Stack>
        </Stack>,
  args: {
    ...Default.args,
    help: 'Additional context that helps users understand what this setting does and when they might want to turn it on or off.'
  }
}`,...A.parameters?.docs?.source},description:{story:`When adding a visual aid, prefer placing it at the trailing end of the row,
rather than placing it directly before the label, or moving the toggle to the trailing end.`,...A.parameters?.docs?.description}}}})))()}export{init_index_story as n,T as t};