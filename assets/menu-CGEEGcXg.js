import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./container-BifUUaQb.js";function UnforwardedNavigableMenu({role:e=`menu`,orientation:t=`vertical`,...n},r){let eventToOffset=e=>{let{code:n}=e,r=[`ArrowDown`],i=[`ArrowUp`];if(t===`horizontal`&&(r=[`ArrowRight`],i=[`ArrowLeft`]),t===`both`&&(r=[`ArrowRight`,`ArrowDown`],i=[`ArrowLeft`,`ArrowUp`]),r.includes(n))return 1;if(i.includes(n))return-1;if([`ArrowDown`,`ArrowUp`,`ArrowLeft`,`ArrowRight`].includes(n))return 0};return(0,o.jsx)(a,{ref:r,stopNavigationEvents:!0,onlyBrowserTabstops:!1,role:e,"aria-orientation":e!==`presentation`&&(t===`vertical`||t===`horizontal`)?t:void 0,eventToOffset,...n})}var o,s;function init_menu(){return(init_menu=e((()=>{n(),i(),o=t(),s=(0,r.forwardRef)(UnforwardedNavigableMenu),s.displayName=`NavigableMenu`;try{s.__docgenInfo={description:`A container for a navigable menu.

 \`\`\`jsx
 import {
   NavigableMenu,
   Button,
 } from '@wordpress/components';

 function onNavigate( index, target ) {
   console.log( \`Navigates to \${ index }\`, target );
 }

 const MyNavigableContainer = () => (
   <div>
     <span>Navigable Menu:</span>
     <NavigableMenu onNavigate={ onNavigate } orientation="horizontal">
       <Button variant="secondary">Item 1</Button>
       <Button variant="secondary">Item 2</Button>
       <Button variant="secondary">Item 3</Button>
     </NavigableMenu>
   </div>
 );
 \`\`\``,displayName:`NavigableMenu`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/navigable-container/menu.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`The component children.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},cycle:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`A boolean which tells the component whether or not to cycle from the end back to the beginning and vice versa.`,name:`cycle`,required:!1,tags:{},type:{name:`boolean`}},onKeyDown:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`A callback invoked on the keydown event.`,name:`onKeyDown`,required:!1,tags:{},type:{name:`((event: KeyboardEvent) => void)`}},onNavigate:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`A callback invoked when the menu navigates to one of its children passing the index and child as an argument`,name:`onNavigate`,required:!1,tags:{},type:{name:`((index: number, focusable: HTMLElement) => void)`}},orientation:{defaultValue:{value:`'vertical'`},declarations:[{fileName:`gutenberg/packages/components/src/navigable-container/types.ts`,name:`TypeLiteral`}],description:`The orientation of the menu.`,name:`orientation`,required:!1,tags:{},type:{name:`enum`,raw:`"horizontal" | "vertical" | "both"`,value:[{value:`"horizontal"`},{value:`"vertical"`},{value:`"both"`}]}}},tags:{}}}catch{}})))()}export{init_menu as n,s as t};