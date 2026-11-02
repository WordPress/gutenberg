import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-HHKy9azc.js";import{n as o,t as s}from"./use-instance-id-DuzD68j8.js";import{n as c,t as l}from"./composite-store-D6h7Yhnq.js";import{n as u,t as d}from"./composite-DKpqkT-2.js";function mapLegacyStatePropsToComponentProps(e){if(e.state){let{state:t,...n}=e,{store:r,...i}=mapLegacyStatePropsToComponentProps(t);return{...n,...i,store:r}}return e}function proxyComposite(e,t={}){let n=e.displayName??``,Component=r=>{a(`wp.components.${n}`,{since:`6.7`,alternative:p.hasOwnProperty(n)?p[n]:void 0});let{store:i,...s}=mapLegacyStatePropsToComponentProps(r),c=s;return c={...c,id:o(i,c.baseId,c.id)},Object.entries(t).forEach(([e,t])=>{c.hasOwnProperty(e)&&(Object.assign(c,{[t]:c[e]}),delete c[e])}),delete c.baseId,(0,f.jsx)(e,{...c,store:i})};return Component.displayName=n,Component}function useCompositeState(e={}){a(`wp.components.__unstableUseCompositeState`,{since:`6.7`,alternative:p.__unstableUseCompositeState});let{baseId:t,currentId:n,orientation:r,rtl:i=!1,loop:s=!1,wrap:l=!1,shift:u=!1,unstable_virtual:d}=e;return{baseId:o(h,`composite`,t),store:c({defaultActiveId:n,rtl:i,orientation:r,focusLoop:s,focusShift:u,focusWrap:l,virtualFocus:d})}}var f,p,m,h,g,_;function init_legacy(){return(init_legacy=e((()=>{l(),n(),s(),i(),u(),f=t(),p={__unstableComposite:`Composite`,__unstableCompositeGroup:`Composite.Group or Composite.Row`,__unstableCompositeItem:`Composite.Item`,__unstableUseCompositeState:`Composite`},m=(0,r.forwardRef)(({role:e,...t},n)=>{let r=e===`row`?d.Row:d.Group;return(0,f.jsx)(r,{ref:n,role:e,...t})}),h=proxyComposite(Object.assign(d,{displayName:`__unstableComposite`}),{baseId:`id`}),g=proxyComposite(Object.assign(m,{displayName:`__unstableCompositeGroup`})),_=proxyComposite(Object.assign(d.Item,{displayName:`__unstableCompositeItem`}),{focusable:`accessibleWhenDisabled`});try{useCompositeState.__docgenInfo={description:"_Note: please use the `Composite` component instead._",displayName:`useCompositeState`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/composite/legacy/index.tsx`,methods:[],props:{baseId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`ID that will serve as a base for all the items IDs.`,name:`baseId`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`string`}},rtl:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:'Determines how next and previous functions will behave. If `rtl` is set\nto `true`, they will be inverted. This only affects the composite widget\nbehavior. You still need to set `dir="rtl"` on HTML/CSS.',name:`rtl`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean`}},orientation:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`Defines the orientation of the composite widget. If the composite has a
single row or column (one-dimensional), the orientation value determines
which arrow keys can be used to move focus.`,name:`orientation`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`enum`,raw:`Orientation`,value:[{value:`"horizontal"`},{value:`"vertical"`}]}},currentId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:"The current focused item `id`.",name:`currentId`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`string`}},loop:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`Determines how focus moves from the start and end of rows and columns.`,name:`loop`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean | Orientation`}},wrap:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`If enabled, moving to the next item from the last one in a row or column
will focus the first item in the next row or column and vice-versa.

** Has effect only on two-dimensional composites. **`,name:`wrap`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean | Orientation`}},shift:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`If enabled, moving up or down when there's no next item or the next item
is disabled will shift to the item right before it.

** Has effect only on two-dimensional composites. **`,name:`shift`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean`}},unstable_virtual:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:``,name:`unstable_virtual`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean`}}},tags:{deprecated:``}}}catch{}try{h.__docgenInfo={description:"_Note: please use the `Composite` component instead._",displayName:`Composite`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/composite/legacy/index.tsx`,methods:[],props:{},tags:{deprecated:``}}}catch{}try{g.__docgenInfo={description:"_Note: please use the `Composite.Row` or `Composite.Group` components instead._",displayName:`CompositeGroup`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/composite/legacy/index.tsx`,methods:[],props:{},tags:{deprecated:``}}}catch{}try{_.__docgenInfo={description:"_Note: please use the `Composite.Item` component instead._",displayName:`CompositeItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/composite/legacy/index.tsx`,methods:[],props:{},tags:{deprecated:``}}}catch{}})))()}function UseCompositeStatePlaceholder(e){return(0,v.jsx)(`dl`,{children:Object.entries(e).map(([e,t])=>(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)(`dt`,{children:e}),(0,v.jsx)(`dd`,{children:JSON.stringify(t)})]}))})}function transform(e,t){return[`const state = useCompositeState(${` ${JSON.stringify(t.args,null,2)} `.replace(` {} `,``)});`,``,`return (`,`  `+e.replaceAll(/state=\{\{[\s\S]*?\}\}/g,`state={ state }`).replaceAll(`=>`,``).replaceAll(/baseId=[^>]+?(\s*>)/g,(e,t)=>`{ ...state }${t}`).replaceAll(/<Composite\w+[\s\S]*?>/g,e=>e.replaceAll(/\s+\s/g,` `)).replaceAll(/ >\s+([\w\s]*?)\s+<\//g,(e,t)=>`>${t}</`).replaceAll(`} >`,`}>`).replaceAll(/\n/g,`
  `),`);`].join(`
`)}var v;function init_utils(){return(init_utils=e((()=>{v=t(),UseCompositeStatePlaceholder.displayName=`useCompositeState`;try{UseCompositeStatePlaceholder.__docgenInfo={description:`Renders a composite widget.

This unstable component is deprecated. Use \`Composite\` instead.

\`\`\`jsx
import {
	__unstableUseCompositeState as useCompositeState,
	__unstableComposite as Composite,
	__unstableCompositeItem as CompositeItem,
} from '@wordpress/components';

const state = useCompositeState();
<Composite state={ state }>
	<CompositeItem>Item 1</CompositeItem>
	<CompositeItem>Item 2</CompositeItem>
</Composite>;
\`\`\``,displayName:`UseCompositeStatePlaceholder`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/composite/legacy/stories/utils.tsx`,methods:[],props:{baseId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`ID that will serve as a base for all the items IDs.`,name:`baseId`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`string`}},rtl:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:'Determines how next and previous functions will behave. If `rtl` is set\nto `true`, they will be inverted. This only affects the composite widget\nbehavior. You still need to set `dir="rtl"` on HTML/CSS.',name:`rtl`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean`}},orientation:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`Defines the orientation of the composite widget. If the composite has a
single row or column (one-dimensional), the orientation value determines
which arrow keys can be used to move focus.`,name:`orientation`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`enum`,raw:`Orientation`,value:[{value:`"horizontal"`},{value:`"vertical"`}]}},currentId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:"The current focused item `id`.",name:`currentId`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`string`}},loop:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`Determines how focus moves from the start and end of rows and columns.`,name:`loop`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean | Orientation`}},wrap:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`If enabled, moving to the next item from the last one in a row or column
will focus the first item in the next row or column and vice-versa.

** Has effect only on two-dimensional composites. **`,name:`wrap`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean | Orientation`}},shift:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:`If enabled, moving up or down when there's no next item or the next item
is disabled will shift to the item right before it.

** Has effect only on two-dimensional composites. **`,name:`shift`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean`}},unstable_virtual:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`}],description:``,name:`unstable_virtual`,parent:{fileName:`gutenberg/packages/components/src/composite/legacy/index.tsx`,name:`LegacyStateOptions`},required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var y,b,TwoDimensionsWithStateProp,TwoDimensionsWithSpreadProps,OneDimensionWithStateProp,OneDimensionWithSpreadProps;function init_index_story(){return(init_index_story=e((()=>{init_legacy(),init_utils(),y=t(),b={title:`Components/@wordpress-components/Deprecated/Composite (Unstable)`,id:`components-composite-unstable`,component:UseCompositeStatePlaceholder,subcomponents:{Composite:h,CompositeGroup:g,CompositeItem:_},args:{},parameters:{controls:{exclude:/^unstable_/},docs:{canvas:{sourceState:`shown`},source:{transform}}},argTypes:{orientation:{control:`select`},loop:{control:`select`,options:[!0,!1,`horizontal`,`vertical`]},wrap:{control:`select`,options:[!0,!1,`horizontal`,`vertical`]}}},TwoDimensionsWithStateProp=e=>{let t=useCompositeState(e);return(0,y.jsxs)(h,{role:`grid`,state:t,"aria-label":`Legacy Composite with state prop (two dimensions)`,children:[(0,y.jsxs)(g,{state:t,role:`row`,children:[(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item A1`}),(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item A2`}),(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item A3`})]}),(0,y.jsxs)(g,{state:t,role:`row`,children:[(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item B1`}),(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item B2`}),(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item B3`})]}),(0,y.jsxs)(g,{state:t,role:`row`,children:[(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item C1`}),(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item C2`}),(0,y.jsx)(_,{state:t,role:`gridcell`,children:`Item C3`})]})]})},TwoDimensionsWithStateProp.args={},TwoDimensionsWithSpreadProps=e=>{let t=useCompositeState(e);return(0,y.jsxs)(h,{role:`grid`,...t,"aria-label":`Legacy Composite with spread props (two dimensions)`,children:[(0,y.jsxs)(g,{...t,role:`row`,children:[(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item A1`}),(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item A2`}),(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item A3`})]}),(0,y.jsxs)(g,{...t,role:`row`,children:[(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item B1`}),(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item B2`}),(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item B3`})]}),(0,y.jsxs)(g,{...t,role:`row`,children:[(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item C1`}),(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item C2`}),(0,y.jsx)(_,{...t,role:`gridcell`,children:`Item C3`})]})]})},TwoDimensionsWithSpreadProps.args={},OneDimensionWithStateProp=e=>{let t=useCompositeState(e);return(0,y.jsxs)(h,{role:`list`,state:t,"aria-label":`Legacy Composite with state prop (one dimension)`,children:[(0,y.jsx)(_,{state:t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 1`}),(0,y.jsx)(_,{state:t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 2`}),(0,y.jsx)(_,{state:t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 3`}),(0,y.jsx)(_,{state:t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 4`}),(0,y.jsx)(_,{state:t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 5`})]})},OneDimensionWithStateProp.args={},OneDimensionWithSpreadProps=e=>{let t=useCompositeState(e);return(0,y.jsxs)(h,{role:`list`,...t,"aria-label":`Legacy Composite with spread props (one dimension)`,children:[(0,y.jsx)(_,{...t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 1`}),(0,y.jsx)(_,{...t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 2`}),(0,y.jsx)(_,{...t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 3`}),(0,y.jsx)(_,{...t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 4`}),(0,y.jsx)(_,{...t,role:`listitem`,render:(0,y.jsx)(`div`,{}),children:`Item 5`})]})},OneDimensionWithSpreadProps.args={},TwoDimensionsWithStateProp.parameters={...TwoDimensionsWithStateProp.parameters,docs:{...TwoDimensionsWithStateProp.parameters?.docs,source:{originalSource:`initialState => {
  const state = useCompositeState(initialState);
  return <Composite role="grid" state={state} aria-label="Legacy Composite with state prop (two dimensions)">
            <CompositeGroup state={state} role="row">
                <CompositeItem state={state} role="gridcell">
                    Item A1
                </CompositeItem>
                <CompositeItem state={state} role="gridcell">
                    Item A2
                </CompositeItem>
                <CompositeItem state={state} role="gridcell">
                    Item A3
                </CompositeItem>
            </CompositeGroup>
            <CompositeGroup state={state} role="row">
                <CompositeItem state={state} role="gridcell">
                    Item B1
                </CompositeItem>
                <CompositeItem state={state} role="gridcell">
                    Item B2
                </CompositeItem>
                <CompositeItem state={state} role="gridcell">
                    Item B3
                </CompositeItem>
            </CompositeGroup>
            <CompositeGroup state={state} role="row">
                <CompositeItem state={state} role="gridcell">
                    Item C1
                </CompositeItem>
                <CompositeItem state={state} role="gridcell">
                    Item C2
                </CompositeItem>
                <CompositeItem state={state} role="gridcell">
                    Item C3
                </CompositeItem>
            </CompositeGroup>
        </Composite>;
}`,...TwoDimensionsWithStateProp.parameters?.docs?.source}}},TwoDimensionsWithSpreadProps.parameters={...TwoDimensionsWithSpreadProps.parameters,docs:{...TwoDimensionsWithSpreadProps.parameters?.docs,source:{originalSource:`initialState => {
  const state = useCompositeState(initialState);
  return <Composite role="grid" {...state} aria-label="Legacy Composite with spread props (two dimensions)">
            <CompositeGroup {...state} role="row">
                <CompositeItem {...state} role="gridcell">
                    Item A1
                </CompositeItem>
                <CompositeItem {...state} role="gridcell">
                    Item A2
                </CompositeItem>
                <CompositeItem {...state} role="gridcell">
                    Item A3
                </CompositeItem>
            </CompositeGroup>
            <CompositeGroup {...state} role="row">
                <CompositeItem {...state} role="gridcell">
                    Item B1
                </CompositeItem>
                <CompositeItem {...state} role="gridcell">
                    Item B2
                </CompositeItem>
                <CompositeItem {...state} role="gridcell">
                    Item B3
                </CompositeItem>
            </CompositeGroup>
            <CompositeGroup {...state} role="row">
                <CompositeItem {...state} role="gridcell">
                    Item C1
                </CompositeItem>
                <CompositeItem {...state} role="gridcell">
                    Item C2
                </CompositeItem>
                <CompositeItem {...state} role="gridcell">
                    Item C3
                </CompositeItem>
            </CompositeGroup>
        </Composite>;
}`,...TwoDimensionsWithSpreadProps.parameters?.docs?.source}}},OneDimensionWithStateProp.parameters={...OneDimensionWithStateProp.parameters,docs:{...OneDimensionWithStateProp.parameters?.docs,source:{originalSource:`initialState => {
  const state = useCompositeState(initialState);
  return <Composite role="list" state={state} aria-label="Legacy Composite with state prop (one dimension)">
            <CompositeItem state={state} role="listitem" render={<div />}>
                Item 1
            </CompositeItem>
            <CompositeItem state={state} role="listitem" render={<div />}>
                Item 2
            </CompositeItem>
            <CompositeItem state={state} role="listitem" render={<div />}>
                Item 3
            </CompositeItem>
            <CompositeItem state={state} role="listitem" render={<div />}>
                Item 4
            </CompositeItem>
            <CompositeItem state={state} role="listitem" render={<div />}>
                Item 5
            </CompositeItem>
        </Composite>;
}`,...OneDimensionWithStateProp.parameters?.docs?.source}}},OneDimensionWithSpreadProps.parameters={...OneDimensionWithSpreadProps.parameters,docs:{...OneDimensionWithSpreadProps.parameters?.docs,source:{originalSource:`initialState => {
  const state = useCompositeState(initialState);
  return <Composite role="list" {...state} aria-label="Legacy Composite with spread props (one dimension)">
            <CompositeItem {...state} role="listitem" render={<div />}>
                Item 1
            </CompositeItem>
            <CompositeItem {...state} role="listitem" render={<div />}>
                Item 2
            </CompositeItem>
            <CompositeItem {...state} role="listitem" render={<div />}>
                Item 3
            </CompositeItem>
            <CompositeItem {...state} role="listitem" render={<div />}>
                Item 4
            </CompositeItem>
            <CompositeItem {...state} role="listitem" render={<div />}>
                Item 5
            </CompositeItem>
        </Composite>;
}`,...OneDimensionWithSpreadProps.parameters?.docs?.source}}}})))()}init_index_story();export{OneDimensionWithSpreadProps,OneDimensionWithStateProp,TwoDimensionsWithSpreadProps,TwoDimensionsWithStateProp,b as default};