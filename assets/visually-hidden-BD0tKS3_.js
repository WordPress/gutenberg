import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{n as t,t as n}from"./react-Cd8OJmTE.js";import{i as r,o as i}from"./useRenderElement-RyDSR8R3.js";import{n as a,t as o}from"./useRender-UN-reKz9.js";var s;function init_style_module(){return(init_style_module=e((()=>{s={"visually-hidden":`_visually-hidden_1batu_3`}})))()}var c;function init_visually_hidden(){return(init_visually_hidden=e((()=>{r(),o(),t(),init_style_module(),c=(0,n.forwardRef)(function UnforwardedVisuallyHidden({render:e,...t},n){return a({render:e,ref:n,props:i({className:s[`visually-hidden`]},t,{"data-visually-hidden":``})})});try{c.__docgenInfo={description:`Visually hides content while keeping it accessible to screen readers.
Useful when providing context that's only meaningful to assistive technology.

Renders a \`<div>\` by default. Use the \`render\` prop to swap the
underlying element while preserving the visually-hidden behavior.

## Composing with other components

When composing with another component that uses the \`render\` prop
pattern, keep \`VisuallyHidden\` as the **host** (outer component) and
pass the other component via \`render\`. This keeps the other
component's HTML element and semantics intact, while \`VisuallyHidden\`
only adds its hiding styles:

\`\`\`jsx
// OtherComponent keeps its semantic element (e.g. <h2>).
<VisuallyHidden render={ <OtherComponent /> }>
  Accessible text
</VisuallyHidden>
\`\`\``,displayName:`VisuallyHidden`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/visually-hidden/visually-hidden.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/visually-hidden/types.ts`,name:`VisuallyHiddenProps`}],description:`The content to be rendered inside the component.`,name:`children`,parent:{fileName:`gutenberg/packages/ui/src/visually-hidden/types.ts`,name:`VisuallyHiddenProps`},required:!1,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}export{init_visually_hidden as n,c as t};