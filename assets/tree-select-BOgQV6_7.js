import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-tQmaFdfy.js";import{n as o,t as s}from"./select-control-Bg7jd7xP.js";function getSelectOptions(e,t=0){return e.flatMap(e=>[{value:e.id,label:`\xA0`.repeat(t*3)+a(e.name)},...getSelectOptions(e.children||[],t+1)])}function TreeSelect(e){let{__nextHasNoMarginBottom:t,__next40pxDefaultSize:n,label:i,noOptionLabel:a,onChange:o,selectedId:l,tree:u=[],...d}=e,f=(0,r.useMemo)(()=>[a&&{value:``,label:a},...getSelectOptions(u)].filter(e=>!!e),[a,u]);return(0,c.jsx)(s,{label:i,options:f,onChange:o,value:l,...d})}var c;function init_tree_select(){return(init_tree_select=e((()=>{n(),i(),o(),c=t();try{TreeSelect.__docgenInfo={description:`Generates a hierarchical select input.

\`\`\`jsx
import { useState } from 'react';
import { TreeSelect } from '@wordpress/components';

const MyTreeSelect = () => {
	const [ page, setPage ] = useState( 'p21' );

	return (
		<TreeSelect
			label="Parent page"
			noOptionLabel="No parent page"
			onChange={ ( newPage ) => setPage( newPage ) }
			selectedId={ page }
			tree={ [
				{
					name: 'Page 1',
					id: 'p1',
					children: [
						{ name: 'Descend 1 of page 1', id: 'p11' },
						{ name: 'Descend 2 of page 1', id: 'p12' },
					],
				},
				{
					name: 'Page 2',
					id: 'p2',
					children: [
						{
							name: 'Descend 1 of page 2',
							id: 'p21',
							children: [
								{
									name: 'Descend 1 of Descend 1 of page 2',
									id: 'p211',
								},
							],
						},
					],
				},
			] }
		/>
	);
}
\`\`\``,displayName:`TreeSelect`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/tree-select/index.tsx`,methods:[],props:{noOptionLabel:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`}],description:`If this property is added, an option will be added with this label to represent empty selection.`,name:`noOptionLabel`,parent:{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`},required:!1,tags:{},type:{name:`string`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`}],description:`A function that receives the value of the new option that is being selected as input.`,name:`onChange`,parent:{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`},required:!1,tags:{},type:{name:`((value: string, extra?: { event?: ChangeEvent<HTMLSelectElement, Element>; }) => void) | undefined`}},tree:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`}],description:`An array containing the tree objects with the possible nodes the user can select.`,name:`tree`,parent:{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`},required:!1,tags:{},type:{name:`Tree[]`}},selectedId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`}],description:`The id of the currently selected node.`,name:`selectedId`,parent:{fileName:`gutenberg/packages/components/src/tree-select/types.ts`,name:`TreeSelectProps`},required:!1,tags:{},type:{name:`string`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:"If true, the `input` will be disabled.",name:`disabled`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`boolean`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:"As an alternative to the `options` prop, `optgroup`s and `options` can be\npassed in as `children` for more customizability.",name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`If this property is added, a label will be generated using label property as the content.`,name:`label`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`ReactNode`}},prefix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`Renders an element on the left side of the input.

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
\`\`\``,name:`prefix`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`},required:!1,tags:{},type:{name:`ReactNode`}},size:{defaultValue:{value:`'default'`},declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`}],description:`Adjusts the size of the input.`,name:`size`,parent:{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`BaseProps`},required:!1,tags:{},type:{name:`enum`,raw:`Size`,value:[{value:`"default"`},{value:`"small"`},{value:`"compact"`}]}},variant:{defaultValue:{value:`'default'`},declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:`The style variant of the control.`,name:`variant`,required:!1,tags:{},type:{name:`enum`,raw:`"default" | "minimal"`,value:[{value:`"default"`},{value:`"minimal"`}]}},suffix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/input-control/types.ts`,name:`InputBaseProps`}],description:`Renders an element on the right side of the input.

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

Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an \`aria-describedby\` attribute.`,name:`help`,required:!1,tags:{},type:{name:`ReactNode`}},__next36pxDefaultSize:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:`Deprecated. Use \`__next40pxDefaultSize\` instead.
@deprecated
@ignore`,name:`__next36pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},__next40pxDefaultSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the larger default height that will become the default size in a future version.
@deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
@ignore`,name:`__next40pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},options:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/select-control/types.ts`,name:`TypeLiteral`}],description:"An array of option property objects to be rendered,\neach with a `label` and `value` property, as well as any other\n`<option>` attributes.",name:`options`,required:!1,tags:{},type:{name:`readonly ({ label: string; value: string; } & Omit<OptionHTMLAttributes<HTMLOptionElement>, "label" | "value">)[]`}},__nextHasNoMarginBottom:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/base-control/types.ts`,name:`TypeLiteral`}],description:`Start opting into the new margin-free styles that will become the default in a future version.
@deprecated Default behavior since WordPress 7.0. Prop can be safely removed.
@ignore`,name:`__nextHasNoMarginBottom`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}export{init_tree_select as n,TreeSelect as t};