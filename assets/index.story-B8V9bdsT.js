import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./build-module-HHKy9azc.js";import{n as s,t as c}from"./use-instance-id-DuzD68j8.js";import{n as l,t as u}from"./use-ref-effect-CLpda56c.js";import{a as d,i as f}from"./iframe-BbJPeSVw.js";import{n as p,t as m}from"./icon-BGlJFHC6.js";import{Fc as h,In as g,Ll as _,i as v,n as y}from"./build-module-DttIWYbV.js";import{n as b,t as x}from"./stack-yNRxuGKo.js";import{n as S,t as C}from"./component-BY3Du5yg.js";import{n as w,t as T}from"./base-control-Br0KG0a3.js";import{n as E,t as D}from"./component-lc2omK31.js";function CheckboxControl(e){let{__nextHasNoMarginBottom:t,label:n,className:r,heading:a,checked:c,indeterminate:u,help:d,id:p,onChange:m,onClick:v,...y}=e;a&&o("`heading` prop in `CheckboxControl`",{alternative:`a separate element to implement a heading`,since:`5.8`});let[b,x]=(0,i.useState)(!1),[S,w]=(0,i.useState)(!1),E=l(e=>{e&&(e.indeterminate=!!u,x(e.matches(`:checked`)),w(e.matches(`:indeterminate`)))},[c,u]),D=s(CheckboxControl,`inspector-checkbox-control`,p),onChangeValue=e=>m(e.target.checked);return(0,O.jsx)(T,{label:a,id:D,help:d&&(0,O.jsx)(`span`,{className:`components-checkbox-control__help`,children:d}),className:f(`components-checkbox-control`,r),children:(0,O.jsxs)(C,{spacing:0,justify:`start`,alignment:`top`,children:[(0,O.jsxs)(`span`,{className:`components-checkbox-control__input-container`,children:[(0,O.jsx)(`input`,{ref:E,id:D,className:`components-checkbox-control__input`,type:`checkbox`,value:`1`,onChange:onChangeValue,checked:c,"aria-describedby":d?D+`__help`:void 0,onClick:e=>{e.currentTarget.focus(),v?.(e)},...y}),S?(0,O.jsx)(_,{icon:g,className:`components-checkbox-control__indeterminate`,role:`presentation`,size:16,viewBox:`4 4 16 16`}):null,b?(0,O.jsx)(_,{icon:h,className:`components-checkbox-control__checked`,role:`presentation`,size:16,viewBox:`4 4 16 16`}):null]}),n&&(0,O.jsx)(`label`,{className:`components-checkbox-control__label`,htmlFor:D,children:n})]})})}var O;function init_checkbox_control(){return(init_checkbox_control=e((()=>{d(),r(),c(),u(),a(),y(),w(),S(),O=n();try{CheckboxControl.__docgenInfo={description:`Checkboxes allow the user to select one or more items from a set.

\`\`\`jsx
import { CheckboxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyCheckboxControl = () => {
  const [ isChecked, setChecked ] = useState( true );
  return (
    <CheckboxControl
      label="Is author"
      help="Is the user a author or not?"
      checked={ isChecked }
      onChange={ setChecked }
    />
  );
};
\`\`\``,displayName:`CheckboxControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/checkbox-control/index.tsx`,methods:[],props:{help:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Additional description for the control.

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},__nextHasNoMarginBottom:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the new margin-free styles that will become the default in a future version.
@deprecated Default behavior since WordPress 7.0. Prop can be safely removed.
@ignore`,name:`__nextHasNoMarginBottom`,required:!1,tags:{},type:{name:`boolean`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/checkbox-control/types.ts`,name:`TypeLiteral`}],description:`Whether the checkbox should be disabled.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/checkbox-control/types.ts`,name:`TypeLiteral`}],description:`A function that receives the checked state (boolean) as input.`,name:`onChange`,required:!0,tags:{},type:{name:`(value: boolean) => void`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/checkbox-control/types.ts`,name:`TypeLiteral`}],description:`A label for the input field, that appears at the side of the checkbox.
The prop will be rendered as content a label element. If no prop is
passed an empty label is rendered.`,name:`label`,required:!1,tags:{},type:{name:`string`}},checked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/checkbox-control/types.ts`,name:`TypeLiteral`}],description:`If checked is true the checkbox will be checked. If checked is false the
checkbox will be unchecked. If no value is passed the checkbox will be
unchecked.`,name:`checked`,required:!1,tags:{},type:{name:`boolean`}},indeterminate:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/checkbox-control/types.ts`,name:`TypeLiteral`}],description:`If indeterminate is true the state of the checkbox will be indeterminate.`,name:`indeterminate`,required:!1,tags:{},type:{name:`boolean`}},heading:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/checkbox-control/types.ts`,name:`TypeLiteral`}],description:`@deprecated`,name:`heading`,required:!1,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var k=t({Default:()=>M,Indeterminate:()=>N,WithCustomLabel:()=>P,WithVisual:()=>F,default:()=>j});function ControlledCheckboxControl({onChange:e,...t}){let[n,r]=(0,i.useState)(!0);return(0,A.jsx)(CheckboxControl,{...t,checked:n,onChange:t=>{r(t),e(t)}})}var A,j,M,N,P,F;function init_index_story(){return(init_index_story=e((()=>{r(),y(),p(),b(),init_checkbox_control(),E(),S(),A=n(),j={component:CheckboxControl,title:`Components/@wordpress-components/Selection & Input/Common/CheckboxControl`,id:`components-checkboxcontrol`,argTypes:{onChange:{action:`onChange`},checked:{control:!1},help:{control:{type:`text`}}},parameters:{controls:{expanded:!0,exclude:[`heading`]},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`CheckboxControl`](?path=/docs/design-system-components-form-checkboxcontrol--docs) from `@wordpress/ui` instead. See the [migration guide](?path=/docs/components-checkboxcontrol--migration-guide)."}}},ControlledCheckboxControl.displayName=`CheckboxControl`,M={render:e=>(0,A.jsx)(ControlledCheckboxControl,{...e}),args:{label:`Is author`,help:`Is the user an author or not?`}},N={render:({onChange:e,...t})=>{let[n,r]=(0,i.useState)({apple:!1,orange:!1}),a=Object.values(n).every(Boolean),o=Object.values(n).some(Boolean)&&!a;return(0,A.jsxs)(D,{children:[(0,A.jsx)(CheckboxControl,{...t,checked:a,indeterminate:o,onChange:t=>{r({apple:t,orange:t}),e(t)}}),(0,A.jsx)(CheckboxControl,{label:`Apple`,checked:n.apple,onChange:e=>r(t=>({...t,apple:e}))}),(0,A.jsx)(CheckboxControl,{label:`Orange`,checked:n.orange,onChange:e=>r(t=>({...t,orange:e}))})]})},args:{label:`Select all`}},P={render:({onChange:e,...t})=>{let[n,r]=(0,i.useState)(!0);return(0,A.jsxs)(C,{justify:`flex-start`,alignment:`top`,spacing:0,children:[(0,A.jsx)(CheckboxControl,{...t,checked:n,onChange:t=>{r(t),e(t)},id:`my-checkbox-with-custom-label`,"aria-describedby":`my-custom-description`}),(0,A.jsxs)(D,{children:[(0,A.jsx)(`label`,{htmlFor:`my-checkbox-with-custom-label`,children:`My custom label`}),(0,A.jsx)(`div`,{id:`my-custom-description`,style:{fontSize:13},children:`A custom description.`})]})]})}},F={...M,render:e=>(0,A.jsxs)(x,{gap:`md`,align:`flex-start`,justify:`space-between`,children:[(0,A.jsx)(x,{children:(0,A.jsx)(ControlledCheckboxControl,{...e})}),(0,A.jsx)(x,{align:`center`,justify:`center`,style:{backgroundColor:`var(--wpds-color-background-surface-neutral-weak, #f4f4f4)`,borderRadius:`var(--wpds-border-radius-md, 4px)`,flexShrink:0,height:`var(--wpds-dimension-size-lg, 40px)`,width:`var(--wpds-dimension-size-lg, 40px)`},children:(0,A.jsx)(m,{icon:v})})]}),args:{...M.args,help:`Additional context that helps users understand what this setting does and when they might want to turn it on or off.`}};try{P.__docgenInfo={description:"For more complex designs, a custom `<label>` element can be associated with the checkbox\nby leaving the `label` prop undefined and using the `id` and `htmlFor` props instead.\nBecause the label element also functions as a click target for the checkbox, [do not\nplace interactive elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#interactive_content)\nsuch as links or buttons inside the `<label>` node.\n\nSimilarly, a custom description can be added by omitting the `help` prop\nand using the `aria-describedby` prop instead.",displayName:`WithCustomLabel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/checkbox-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{F.__docgenInfo={description:`When adding a visual aid, prefer placing it at the trailing end of the row,
rather than placing it directly before the label, or moving the checkbox to the trailing end.`,displayName:`WithVisual`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/checkbox-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  render: args => <ControlledCheckboxControl {...args} />,
  args: {
    label: 'Is author',
    help: 'Is the user an author or not?'
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: ({
    onChange,
    ...args
  }) => {
    const [fruits, setFruits] = useState({
      apple: false,
      orange: false
    });
    const isAllChecked = Object.values(fruits).every(Boolean);
    const isIndeterminate = Object.values(fruits).some(Boolean) && !isAllChecked;
    return <VStack>
                <CheckboxControl {...args} checked={isAllChecked} indeterminate={isIndeterminate} onChange={v => {
        setFruits({
          apple: v,
          orange: v
        });
        onChange(v);
      }} />
                <CheckboxControl label="Apple" checked={fruits.apple} onChange={apple => setFruits(prevState => ({
        ...prevState,
        apple
      }))} />
                <CheckboxControl label="Orange" checked={fruits.orange} onChange={orange => setFruits(prevState => ({
        ...prevState,
        orange
      }))} />
            </VStack>;
  },
  args: {
    label: 'Select all'
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  render: ({
    onChange,
    ...args
  }) => {
    const [isChecked, setChecked] = useState(true);
    return <HStack justify="flex-start" alignment="top" spacing={0}>
                <CheckboxControl {...args} checked={isChecked} onChange={v => {
        setChecked(v);
        onChange(v);
      }} id="my-checkbox-with-custom-label" aria-describedby="my-custom-description" />
                <VStack>
                    <label htmlFor="my-checkbox-with-custom-label">
                        My custom label
                    </label>
                    <div id="my-custom-description" style={{
          fontSize: 13
        }}>
                        A custom description.
                    </div>
                </VStack>
            </HStack>;
  }
}`,...P.parameters?.docs?.source},description:{story:"For more complex designs, a custom `<label>` element can be associated with the checkbox\nby leaving the `label` prop undefined and using the `id` and `htmlFor` props instead.\nBecause the label element also functions as a click target for the checkbox, [do not\nplace interactive elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#interactive_content)\nsuch as links or buttons inside the `<label>` node.\n\nSimilarly, a custom description can be added by omitting the `help` prop\nand using the `aria-describedby` prop instead.",...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  ...Default,
  render: args => <Stack gap="md" align="flex-start" justify="space-between">
            <Stack>
                <ControlledCheckboxControl {...args} />
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
}`,...F.parameters?.docs?.source},description:{story:`When adding a visual aid, prefer placing it at the trailing end of the row,
rather than placing it directly before the label, or moving the checkbox to the trailing end.`,...F.parameters?.docs?.description}}}})))()}export{init_index_story as n,k as t};