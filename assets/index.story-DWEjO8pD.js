import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./create-higher-order-component-BGZCdWUc.js";import{n as o,t as s}from"./use-instance-id-DuzD68j8.js";import{n as c,t as l}from"./use-focus-outside-B4DHecJ0.js";import{c as u,n as d,r as f,t as p}from"./build-module-CqL0UdL5.js";import{r as m}from"./build-module-CI6dFhun.js";import{n as h}from"./with-ignore-ime-events-Bpp5KvQf.js";import{a as g,i as _}from"./iframe-y9psNcyg.js";import{r as v,t as y}from"./build-module-BvdTt2vY.js";import{n as b,yc as x}from"./build-module-CPA2Y5FH.js";import{n as S,t as C}from"./use-controlled-value-CIKLJQvw.js";import{n as w,t as T}from"./component-144DDHoP.js";import{n as E,t as ee}from"./component-B6MShLjh.js";import{n as D,t as O}from"./base-control-CyYzPRw2.js";import{n as k,t as A}from"./button-8ccnOjTA.js";import{n as j,r as M}from"./strings-74OMIQDH.js";import{i as N,n as P,r as F,t as I}from"./suggestions-list-NarMzyPT.js";import{n as L,t as R}from"./spinner-BmMnnBtE.js";var z,B;function init_with_focus_outside(){return(init_with_focus_outside=e((()=>{n(),i(),l(),z=t(),B=a(e=>function WithFocusOutside(t){let[n,i]=(0,r.useState)(void 0),a=(0,r.useCallback)(e=>i(()=>e?.handleFocusOutside?e.handleFocusOutside.bind(e):void 0),[]);return(0,z.jsx)(`div`,{...c(n),children:(0,z.jsx)(e,{ref:a,...t})})},`withFocusOutside`)})))()}var V;function init_style_module(){return(init_style_module=e((()=>{V={"input-wrapper":`_input-wrapper_nq9ld_46`}})))()}function ComboboxControl(e){let{value:t,label:n,options:i,onChange:a,onFilterValueChange:s=noop,hideLabelFromVision:c,help:l,allowReset:p=!0,className:m,isLoading:g=!1,messages:y={selected:d(`Item selected.`)},__experimentalRenderItem:b,expandOnFocus:C=!0,placeholder:w}=e,[E,D]=S({value:t,onChange:a}),k=i.find(e=>e.value===E),j=k?.label??``,N=o(ComboboxControl,`combobox-control`),[P,L]=(0,r.useState)(k||null),[z,B]=(0,r.useState)(!1),[W,G]=(0,r.useState)(!1),[K,q]=(0,r.useState)(``),J=(0,r.useRef)(null),Y=(0,r.useMemo)(()=>{let e=[],t=[],n=M(K);return i.forEach(r=>{let i=M(r.label).indexOf(n);i===0?e.push(r):i>0&&t.push(r)}),e.concat(t)},[K,i]),onSuggestionSelected=e=>{e.disabled||(D(e.value),v(y.selected,`assertive`),L(e),q(``),B(!1))},handleArrowNavigation=(e=1)=>{let t=getIndexOfMatchingSuggestion(P,Y)+e;t<0?t=Y.length-1:t>=Y.length&&(t=0),L(Y[t]),B(!0)},X=h(e=>{let t=!1;if(!e.defaultPrevented){switch(e.code){case`Enter`:P&&(onSuggestionSelected(P),t=!0);break;case`ArrowUp`:handleArrowNavigation(-1),t=!0;break;case`ArrowDown`:handleArrowNavigation(1),t=!0;break;case`Escape`:B(!1),L(null),t=!0}t&&e.preventDefault()}}),onBlur=()=>{G(!1)},onFocus=()=>{G(!0),C&&B(!0),s(``),q(``)},onClick=()=>{B(!0)},onFocusOutside=()=>{B(!1)},onInputChange=e=>{let t=e.value;q(t),s(t),W&&B(!0)},handleOnReset=()=>{D(null),J.current?.focus()},handleResetStopPropagation=e=>{e.stopPropagation()};return(0,r.useEffect)(()=>{let e=Y.length>0,t=getIndexOfMatchingSuggestion(P,Y)>0;e&&!t&&L(Y[0])},[Y,P]),(0,r.useEffect)(()=>{let e=Y.length>0;if(z){let t=e?u(f(`%d result found, use up and down arrow keys to navigate.`,`%d results found, use up and down arrow keys to navigate.`,Y.length),Y.length):d(`No results.`);v(t,`polite`)}},[Y,z]),(0,H.jsx)(U,{onFocusOutside,children:(0,H.jsx)(O,{className:_(m,`components-combobox-control`),label:n,id:`components-form-token-input-${N}`,hideLabelFromVision:c,help:l,children:(0,H.jsxs)(`div`,{className:`components-combobox-control__suggestions-container`,tabIndex:-1,onKeyDown:X,children:[(0,H.jsxs)(T,{className:V[`input-wrapper`],children:[(0,H.jsx)(ee,{children:(0,H.jsx)(F,{className:`components-combobox-control__input`,instanceId:N,ref:J,placeholder:w,value:z?K:j,onFocus,onBlur,onClick,isExpanded:z,selectedSuggestionIndex:getIndexOfMatchingSuggestion(P,Y),onChange:onInputChange,"aria-describedby":l?`components-form-token-input-${N}__help`:void 0})}),g&&(0,H.jsx)(R,{}),p&&!!E&&!z&&(0,H.jsx)(A,{size:`small`,icon:x,onClick:handleOnReset,onKeyDown:handleResetStopPropagation,label:d(`Reset`)})]}),z&&!g&&(0,H.jsx)(I,{instanceId:N,match:{label:K,value:``},displayTransform:e=>e.label,suggestions:Y,selectedIndex:getIndexOfMatchingSuggestion(P,Y),onHover:L,onSelect:onSuggestionSelected,scrollIntoView:!0,__experimentalRenderItem:b})]})})})}var H,noop,U,getIndexOfMatchingSuggestion;function init_combobox_control(){return(init_combobox_control=e((()=>{g(),p(),n(),s(),y(),b(),m(),N(),P(),D(),k(),w(),E(),init_with_focus_outside(),C(),j(),L(),init_style_module(),H=t(),noop=()=>{},U=B(class DetectOutsideComponent extends r.Component{handleFocusOutside(e){this.props.onFocusOutside(e)}render(){return this.props.children}}),getIndexOfMatchingSuggestion=(e,t)=>e===null?-1:t.indexOf(e);try{ComboboxControl.__docgenInfo={description:`\`ComboboxControl\` is an enhanced version of a [\`SelectControl\`](../select-control/README.md) with the addition of
being able to search for options using a search input.

\`\`\`jsx
import { ComboboxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const options = [
	{
		value: 'small',
		label: 'Small',
	},
	{
		value: 'normal',
		label: 'Normal',
		disabled: true,
	},
	{
		value: 'large',
		label: 'Large',
		disabled: false,
	},
];

function MyComboboxControl() {
	const [ fontSize, setFontSize ] = useState();
	const [ filteredOptions, setFilteredOptions ] = useState( options );
	return (
		<ComboboxControl
			label="Font Size"
			value={ fontSize }
			onChange={ setFontSize }
			options={ filteredOptions }
			onFilterValueChange={ ( inputValue ) =>
				setFilteredOptions(
					options.filter( ( option ) =>
						option.label
							.toLowerCase()
							.startsWith( inputValue.toLowerCase() )
					)
				)
			}
		/>
	);
}
\`\`\``,displayName:`ComboboxControl`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/combobox-control/index.tsx`,methods:[],props:{className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:``,name:`className`,required:!1,tags:{},type:{name:`string`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If this property is added, a label will be generated using label property as the content.`,name:`label`,required:!1,tags:{},type:{name:`ReactNode`}},__nextHasNoMarginBottom:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the new margin-free styles that will become the default in a future version.
@deprecated Default behavior since WordPress 7.0. Prop can be safely removed.
@ignore`,name:`__nextHasNoMarginBottom`,required:!1,tags:{},type:{name:`boolean`}},help:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Additional description for the control.

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},hideLabelFromVision:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`If true, the label will only be visible to screen readers.`,name:`hideLabelFromVision`,required:!1,tags:{},type:{name:`boolean`}},__experimentalRenderItem:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:"Custom renderer invoked for each option in the suggestion list.\nThe render prop receives as its argument an object containing, under the `item` key,\nthe single option's data (directly from the array of data passed to the `options` prop).",name:`__experimentalRenderItem`,required:!1,tags:{},type:{name:`((args: { item: ComboboxControlOption; }) => ReactNode)`}},__next36pxDefaultSize:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`Deprecated. Use \`__next40pxDefaultSize\` instead.
@deprecated
@ignore`,name:`__next36pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},__next40pxDefaultSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the larger default height that will become the default size in a future version.
@deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
@ignore`,name:`__next40pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},allowReset:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`Show a reset button to clear the input.`,name:`allowReset`,required:!1,tags:{},type:{name:`boolean`}},expandOnFocus:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`Automatically expand the dropdown when the control is focused.
If the control is clicked, the dropdown will expand regardless of this prop.`,name:`expandOnFocus`,required:!1,tags:{},type:{name:`boolean`}},messages:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`Customizable UI messages.`,name:`messages`,required:!1,tags:{},type:{name:`{ selected: string; }`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`Function called with the selected value changes.`,name:`onChange`,required:!1,tags:{},type:{name:`((value: ComboboxControlValue) => void)`}},onFilterValueChange:{defaultValue:{value:`noop`},declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`Function called when the control's search input value changes. The argument contains the next input value.`,name:`onFilterValueChange`,required:!1,tags:{},type:{name:`((value: string) => void)`}},options:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`The options that can be chosen from.`,name:`options`,required:!0,tags:{},type:{name:`ComboboxControlOption[]`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`The current value of the control.`,name:`value`,required:!1,tags:{},type:{name:`ComboboxControlValue`}},placeholder:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:`If passed, the combobox input will show a placeholder string if no values are present.`,name:`placeholder`,required:!1,tags:{},type:{name:`string`}},isLoading:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/combobox-control/types.ts`,name:`TypeLiteral`}],description:"Show a spinner (and hide the suggestions dropdown) while data\nabout the matching suggestions (ie the `options` prop) is loading",name:`isLoading`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var W,G,K,q,mapCountryOption,J,Template,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{n(),init_combobox_control(),W=t(),{fn:G}=__STORYBOOK_MODULE_TEST__,K=[{name:`Afghanistan`,code:`AF`},{name:`Åland Islands`,code:`AX`},{name:`Albania`,code:`AL`},{name:`Algeria`,code:`DZ`},{name:`American Samoa`,code:`AS`},{name:`Andorra`,code:`AD`},{name:`Angola`,code:`AO`},{name:`Anguilla`,code:`AI`},{name:`Antarctica`,code:`AQ`},{name:`Antigua and Barbuda`,code:`AG`},{name:`Argentina`,code:`AR`},{name:`Armenia`,code:`AM`},{name:`Aruba`,code:`AW`},{name:`Australia`,code:`AU`},{name:`Austria`,code:`AT`},{name:`Azerbaijan`,code:`AZ`}],q={tags:[`manifest`],title:`Components/@wordpress-components/Selection & Input/Common/ComboboxControl`,id:`components-comboboxcontrol`,component:ComboboxControl,argTypes:{value:{control:!1}},args:{onChange:G(),onFilterValueChange:G()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Will be superseded by `SearchableSelectControl` in `@wordpress/ui`, but continue using for now."}}},mapCountryOption=e=>({value:e.code,label:e.name}),J=K.map(mapCountryOption),Template=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(null);return(0,W.jsx)(W.Fragment,{children:(0,W.jsx)(ComboboxControl,{...t,value:n,onChange:(...t)=>{i(...t),e?.(...t)}})})},Y=Template.bind({}),Y.args={label:`Country`,options:J,help:`Help text to describe the control.`},X=Template.bind({}),X.args={...Y.args,label:`Author`,options:[{value:`parsley`,label:`Parsley Montana`,age:48,country:`Germany`},{value:`cabbage`,label:`Cabbage New York`,age:44,country:`France`},{value:`jake`,label:`Jake Weary`,age:41,country:`United Kingdom`}],__experimentalRenderItem:({item:e})=>{let{label:t,age:n,country:r}=e;return(0,W.jsxs)(`div`,{children:[(0,W.jsx)(`div`,{style:{marginBottom:`0.2rem`},children:t}),(0,W.jsxs)(`small`,{children:[`Age: `,n,`, Country: `,r]})]})}},Z=Template.bind({}),Q=J.map((e,t)=>({...e,disabled:t%3==0})),Z.args={...Y.args,options:Q},$=Template.bind({}),$.args={...Y.args,options:J,expandOnFocus:!1};try{X.__docgenInfo={description:`The rendered output of each suggestion can be customized by passing a
render function to the \`__experimentalRenderItem\` prop. (This is still an experimental feature
and is subject to change.)`,displayName:`WithCustomRenderItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/combobox-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:`You can disable options in the list
by setting the \`disabled\` property to true
for individual items in the option object.`,displayName:`WithDisabledOptions`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/combobox-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:"By default, the combobox expands when focused.\nYou can disable this behavior by setting the `expandOnFocus` prop to `false`.\nThis is useful when you want to show the suggestions only when the user interacts with the input.",displayName:`NotExpandOnFocus`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/combobox-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<ComboboxControlProps['value']>(null);
  return <>
            <ComboboxControl {...args} value={value} onChange={(...changeArgs) => {
      setValue(...changeArgs);
      onChange?.(...changeArgs);
    }} />
        </>;
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<ComboboxControlProps['value']>(null);
  return <>
            <ComboboxControl {...args} value={value} onChange={(...changeArgs) => {
      setValue(...changeArgs);
      onChange?.(...changeArgs);
    }} />
        </>;
}`,...X.parameters?.docs?.source},description:{story:`The rendered output of each suggestion can be customized by passing a
render function to the \`__experimentalRenderItem\` prop. (This is still an experimental feature
and is subject to change.)`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<ComboboxControlProps['value']>(null);
  return <>
            <ComboboxControl {...args} value={value} onChange={(...changeArgs) => {
      setValue(...changeArgs);
      onChange?.(...changeArgs);
    }} />
        </>;
}`,...Z.parameters?.docs?.source},description:{story:`You can disable options in the list
by setting the \`disabled\` property to true
for individual items in the option object.`,...Z.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`({
  onChange,
  ...args
}) => {
  const [value, setValue] = useState<ComboboxControlProps['value']>(null);
  return <>
            <ComboboxControl {...args} value={value} onChange={(...changeArgs) => {
      setValue(...changeArgs);
      onChange?.(...changeArgs);
    }} />
        </>;
}`,...$.parameters?.docs?.source},description:{story:"By default, the combobox expands when focused.\nYou can disable this behavior by setting the `expandOnFocus` prop to `false`.\nThis is useful when you want to show the suggestions only when the user interacts with the input.",...$.parameters?.docs?.description}}}})))()}init_index_story();export{Y as Default,$ as NotExpandOnFocus,X as WithCustomRenderItem,Z as WithDisabledOptions,q as default};