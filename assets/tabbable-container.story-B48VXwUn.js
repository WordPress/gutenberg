import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./build-module-HHKy9azc.js";import{n as o,t as s}from"./container-BifUUaQb.js";function UnforwardedTabbableContainer({eventToOffset:e,...t},n){a(`wp.components.TabbableContainer`,{since:`7.3`,version:`7.5`,hint:`For focus trapping, consider the useConstrainedTabbing hook from @wordpress/compose.`});let innerEventToOffset=t=>{let{code:n,shiftKey:r}=t;if(n===`Tab`)return r?-1:1;if(e)return e(t)};return(0,c.jsx)(s,{ref:n,stopNavigationEvents:!0,onlyBrowserTabstops:!0,eventToOffset:innerEventToOffset,...t})}var c,l;function init_tabbable(){return(init_tabbable=e((()=>{i(),n(),o(),c=t(),l=(0,r.forwardRef)(UnforwardedTabbableContainer),l.displayName=`TabbableContainer`;try{l.__docgenInfo={description:"A container for tabbable elements.\n\nThis component is deprecated. For focus trapping, consider the\n`useConstrainedTabbing` hook from `@wordpress/compose`.",displayName:`TabbableContainer`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/navigable-container/tabbable.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`The component children.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},cycle:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`A boolean which tells the component whether or not to cycle from the end back to the beginning and vice versa.`,name:`cycle`,required:!1,tags:{},type:{name:`boolean`}},onKeyDown:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`A callback invoked on the keydown event.`,name:`onKeyDown`,required:!1,tags:{},type:{name:`((event: KeyboardEvent) => void)`}},onNavigate:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`A callback invoked when the menu navigates to one of its children passing the index and child as an argument`,name:`onNavigate`,required:!1,tags:{},type:{name:`((index: number, focusable: HTMLElement) => void)`}},eventToOffset:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`Gets an offset, given an event.`,name:`eventToOffset`,required:!1,tags:{},type:{name:`((event: KeyboardEvent) => 0 | 1 | -1)`}}},tags:{deprecated:`\`\`\`jsx
 import {
   TabbableContainer,
   Button,
 } from '@wordpress/components';

 function onNavigate( index, target ) {
   console.log( \`Navigates to \${ index }\`, target );
 }

 const MyTabbableContainer = () => (
   <div>
     <span>Tabbable Container:</span>
     <TabbableContainer onNavigate={ onNavigate }>
       <Button variant="secondary" tabIndex="0">
         Section 1
       </Button>
       <Button variant="secondary" tabIndex="0">
         Section 2
       </Button>
       <Button variant="secondary" tabIndex="0">
         Section 3
       </Button>
       <Button variant="secondary" tabIndex="0">
         Section 4
       </Button>
     </TabbableContainer>
   </div>
 );
 \`\`\``}}}catch{}})))()}var u,d,f,Default;function init_tabbable_container_story(){return(init_tabbable_container_story=e((()=>{init_tabbable(),u=t(),{fn:d}=__STORYBOOK_MODULE_TEST__,f={title:`Components/@wordpress-components/Deprecated/TabbableContainer`,id:`components-tabbablecontainer`,component:l,argTypes:{children:{control:!1}},args:{onKeyDown:d(),onNavigate:d()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Deprecated. For focus trapping, consider the `useConstrainedTabbing` hook from `@wordpress/compose`."}}},Default=e=>(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`button`,{children:`Before tabbable container`}),(0,u.jsxs)(l,{...e,style:{margin:`32px 0`,padding:`16px`,border:`1px solid black`},children:[(0,u.jsx)(`button`,{children:`Item 1`}),(0,u.jsx)(`button`,{children:`Item 2`}),(0,u.jsx)(`button`,{disabled:!0,children:`Item 3 (disabled)`}),(0,u.jsx)(`button`,{tabIndex:-1,children:`Item 4 (non-tabbable)`}),(0,u.jsx)(`button`,{tabIndex:0,children:`Item 5`}),(0,u.jsx)(`button`,{children:`Item 6`})]}),(0,u.jsx)(`button`,{children:`After tabbable container`})]}),Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`args => {
  return <>
            <button>Before tabbable container</button>
            <TabbableContainer {...args} style={{
      margin: '32px 0',
      padding: '16px',
      border: '1px solid black'
    }}>
                <button>Item 1</button>
                <button>Item 2</button>
                <button disabled>Item 3 (disabled)</button>
                <button tabIndex={-1}>Item 4 (non-tabbable)</button>
                <button tabIndex={0}>Item 5</button>
                <button>Item 6</button>
            </TabbableContainer>
            <button>After tabbable container</button>
        </>;
}`,...Default.parameters?.docs?.source}}}})))()}init_tabbable_container_story();export{Default,f as default};