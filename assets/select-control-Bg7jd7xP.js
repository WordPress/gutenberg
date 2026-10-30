import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-instance-id-DuzD68j8.js";import{o,t as s}from"./build-module-CqL0UdL5.js";import{a as c,i as l}from"./iframe-BbJPeSVw.js";import{i as u,r as d}from"./component-lXS83C_h.js";import{n as f,t as p}from"./input-base-CQFH0y8v.js";import{n as m,t as h}from"./base-control-Br0KG0a3.js";import{i as g,n as _,r as v,t as y}from"./chevron-down-CNLroY7V.js";function useUniqueId(e){let t=`inspector-select-control-${i(x)}`;return e||t}function SelectOptions({options:e}){return e.map(({id:e,label:t,value:n,...r},i)=>{let a=e||`${t}-${n}-${i}`;return(0,b.jsx)(`option`,{value:n,...r,children:t},a)})}function UnforwardedSelectControl(e,t){let{__nextHasNoMarginBottom:n,__next40pxDefaultSize:r,__next36pxDefaultSize:i,className:a,disabled:s=!1,help:c,hideLabelFromVision:u,id:p,label:m,multiple:_=!1,onChange:v,options:x=[],size:S=`default`,value:C,labelPosition:w=`top`,children:T,prefix:E,suffix:D,variant:O=`default`,...k}=e,A=useUniqueId(p),j=c?`${A}__help`:void 0;if(!x?.length&&!T)return null;let handleOnChange=t=>{if(e.multiple){let n=Array.from(t.target.options).filter(({selected:e})=>e).map(({value:e})=>e);e.onChange?.(n,{event:t})}else e.onChange?.(t.target.value,{event:t})},M=l(`components-select-control`,a);return(0,b.jsx)(h,{help:c,id:A,className:M,children:(0,b.jsx)(f,{disabled:s,hideLabelFromVision:u,id:A,isBorderless:O===`minimal`,label:m,size:S,suffix:D||!_&&(0,b.jsx)(y,{}),prefix:E,labelPosition:w,__unstableInputWidth:O===`minimal`?`auto`:void 0,className:l(g.root,{[g[`is-disabled`]]:s,[g[`is-minimal`]]:O===`minimal`}),children:(0,b.jsx)(d,{as:`select`,...k,"aria-describedby":j,className:l(`components-select-control__input`,g.input,{[g[`is-small`]]:S===`small`,[g[`is-compact`]]:S===`compact`,[g[`is-multiple`]]:_,[g[`is-minimal`]]:O===`minimal`,[g[`is-rtl`]]:o()}),disabled:s,id:A,multiple:_,onChange:handleOnChange,ref:t,value:C,children:T||(0,b.jsx)(SelectOptions,{options:x})})})})}var b,x;function init_select_control(){return(init_select_control=e((()=>{c(),a(),n(),s(),m(),p(),u(),v(),_(),b=t(),x=(0,r.forwardRef)(UnforwardedSelectControl),x.displayName=`SelectControl`;try{x.__docgenInfo={description:`\`SelectControl\` allows users to select from a single or multiple option menu.
It functions as a wrapper around the browser's native \`<select>\` element.

\`\`\`jsx
import { SelectControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MySelectControl = () => {
  const [ size, setSize ] = useState( '50%' );

  return (
    <SelectControl
      label="Size"
      value={ size }
      options={ [
        { label: 'Big', value: '100%' },
        { label: 'Medium', value: '50%' },
        { label: 'Small', value: '25%' },
      ] }
      onChange={ setSize }
    />
  );
};
\`\`\``,displayName:`SelectControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/select-control/index.tsx`,methods:[],props:{disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:"If true, the `input` will be disabled.",name:`disabled`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`boolean`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`If this property is added, a label will be generated using label property as the content.`,name:`label`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`ReactNode`}},prefix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`Renders an element on the left side of the input.

By default, the prefix is aligned with the edge of the input border, with no padding.
If you want to apply standard padding in accordance with the size variant, wrap the element in
the provided \`<InputControlPrefixWrapper>\` component.

\`\`\`jsx
import {
  __experimentalInputControl as InputControl,
  __experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';

<InputControl
  prefix={<InputControlPrefixWrapper>@</InputControlPrefixWrapper>}
/>
\`\`\``,name:`prefix`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`ReactNode`}},size:{defaultValue:{value:`'default'`},declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`}],description:`Adjusts the size of the input.`,name:`size`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`enum`,raw:`Size`,value:[{value:`"default"`},{value:`"small"`},{value:`"compact"`}]}},suffix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`Renders an element on the right side of the input.

By default, the suffix is aligned with the edge of the input border, with no padding.
If you want to apply standard padding in accordance with the size variant, wrap the element in
the provided \`<InputControlSuffixWrapper>\` component.

\`\`\`jsx
import {
  __experimentalInputControl as InputControl,
  __experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';

<InputControl
  suffix={<InputControlSuffixWrapper>%</InputControlSuffixWrapper>}
/>
\`\`\``,name:`suffix`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`ReactNode`}},hideLabelFromVision:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`}],description:`If true, the label will only be visible to screen readers.`,name:`hideLabelFromVision`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`boolean`}},labelPosition:{defaultValue:{value:`'top'`},declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`}],description:`The position of the label.`,name:`labelPosition`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`enum`,raw:`LabelPosition`,value:[{value:`"top"`},{value:`"bottom"`},{value:`"side"`},{value:`"edge"`}]}},help:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Additional description for the control.

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},__nextHasNoMarginBottom:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the new margin-free styles that will become the default in a future version.
@deprecated Default behavior since WordPress 7.0. Prop can be safely removed.
@ignore`,name:`__nextHasNoMarginBottom`,required:!1,tags:{},type:{name:`boolean`}},__next36pxDefaultSize:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:`Deprecated. Use \`__next40pxDefaultSize\` instead.
@deprecated
@ignore`,name:`__next36pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},__next40pxDefaultSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the larger default height that will become the default size in a future version.
@deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
@ignore`,name:`__next40pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},options:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:"An array of option property objects to be rendered,\neach with a `label` and `value` property, as well as any other\n`<option>` attributes.",name:`options`,required:!1,tags:{},type:{name:`readonly ({ label: string; value: V; } & Omit<OptionHTMLAttributes<HTMLOptionElement>, "label" | "value">)[]`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:"As an alternative to the `options` prop, `optgroup`s and `options` can be\npassed in as `children` for more customizability.",name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},variant:{defaultValue:{value:`'default'`},declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:`The style variant of the control.`,name:`variant`,required:!1,tags:{},type:{name:`enum`,raw:`"default" | "minimal"`,value:[{value:`"default"`},{value:`"minimal"`}]}},multiple:{defaultValue:{value:`false
false`},declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`},{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:"If this property is added, multiple values can be selected. The `value` passed should be an array.\n\nIn most cases, it is preferable to use the `FormTokenField` or `CheckboxControl` components instead.",name:`multiple`,required:!1,tags:{},type:{name:`boolean`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`},{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:"The value of the selected option.\n\nIf `multiple` is true, the `value` should be an array with the values of the selected options.",name:`value`,required:!1,tags:{},type:{name:`string | NoInfer<V>[]`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`},{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:"A function that receives the value of the new option that is being selected as input.\n\nIf `multiple` is `true`, the value received is an array of the selected value.\nOtherwise, the value received is a single value with the new selected value.",name:`onChange`,required:!1,tags:{},type:{name:`((value: NoInfer<V>, extra?: { event?: ChangeEvent<HTMLSelectElement, Element>; }) => void) | ((value: NoInfer<V>[], extra?: { ...; } | undefined) => void) | undefined`}},ref:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/index.tsx`,name:`TypeLiteral`}],description:``,name:`ref`,required:!1,tags:{},type:{name:`Ref<HTMLSelectElement>`}}},tags:{}}}catch{}})))()}export{init_select_control as n,x as t};