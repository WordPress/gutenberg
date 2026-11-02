import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-isomorphic-layout-effect-CgrzDkxH.js";import{a as o,i as s}from"./iframe-y9psNcyg.js";import{i as c,o as l}from"./useRenderElement-RyDSR8R3.js";import{n as u,t as d}from"./useRender-UN-reKz9.js";import{Nc as f,n as p}from"./build-module-CPA2Y5FH.js";import{n as m,t as h}from"./global-css-defense.module-BCx5sFzT.js";import{n as g,t as ee}from"./icon-CuFTK1Qw.js";import{n as _,t as v}from"./text-CMRHx_-b.js";import{n as y,t as b}from"./stack-BwmLRIE8.js";import{a as x,c as S,i as te,l as C,n as ne,o as w,r as T,s as E,t as D,u as O}from"./title-BR6Vw9jt.js";import{a as k,i as re,n as ie,o as ae,r as oe,t as se}from"./trigger-CwpVLMPb.js";var A,j;function init_root(){return(init_root=e((()=>{n(),O(),re(),A=t(),j=(0,r.forwardRef)(function CollapsibleCardRoot({render:e,...t},n){return(0,A.jsx)(oe,{ref:n,render:(0,A.jsx)(C,{render:e}),...t})});try{j.__docgenInfo={description:`A card that can be expanded and collapsed. When collapsed, only the
header is visible.

\`\`\`jsx
import { CollapsibleCard, Card } from '@wordpress/ui';

function MyComponent() {
	return (
		<CollapsibleCard.Root defaultOpen>
			<CollapsibleCard.Header>
				<Card.Title>Heading</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<p>Collapsible content here.</p>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
\`\`\``,displayName:`Root`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/root.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`}],description:"The content to be rendered inside the collapsible card.\nShould include `CollapsibleCard.Header` and `CollapsibleCard.Content`.",name:`children`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`},required:!1,tags:{},type:{name:`ReactNode`}},open:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`}],description:`Whether the collapsible panel is currently open (controlled).

To render an uncontrolled collapsible card, use \`defaultOpen\` instead.`,name:`open`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`},required:!1,tags:{},type:{name:`boolean`}},defaultOpen:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`}],description:`Whether the collapsible panel is initially open (uncontrolled).`,name:`defaultOpen`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`},required:!1,tags:{},type:{name:`boolean`}},onOpenChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`}],description:`Event handler called when the panel is opened or closed.`,name:`onOpenChange`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`},required:!1,tags:{},type:{name:`((open: boolean) => void)`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`}],description:`Whether the component should ignore user interaction.`,name:`disabled`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`RootProps`},required:!1,tags:{},type:{name:`boolean`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var M,N,P;function init_style_module(){return(init_style_module=e((()=>{M=`_header_14h67_118`,N=`_content_14h67_162`,P={"heading-wrapper":`_heading-wrapper_14h67_109`,"header-content":`_header-content_14h67_118`,"header-description":`_header-description_14h67_122`,"header-trigger-positioner":`_header-trigger-positioner_14h67_125`,"header-trigger-wrapper":`_header-trigger-wrapper_14h67_134`,header:M,"header-trigger":`_header-trigger_14h67_125`,content:N,"overflow-visible":`_overflow-visible_14h67_171`,"content-inner":`_content-inner_14h67_187`}})))()}var F;function init_context(){return(init_context=e((()=>{n(),F=(0,r.createContext)(null)})))()}var I,L;function init_header(){return(init_header=e((()=>{c(),d(),o(),a(),n(),p(),S(),ie(),g(),init_style_module(),m(),init_context(),I=t(),L=(0,r.forwardRef)(function CollapsibleCardHeader({children:e,className:t,render:n,"aria-describedby":a,...o},c){let[d,p]=(0,r.useState)([]),[m,g]=(0,r.useState)([]),_=(0,r.useRef)(null),v=(0,r.useCallback)(e=>(p(t=>t.includes(e)?t:[...t,e]),()=>{p(t=>t.filter(t=>t!==e))}),[]),y=(0,r.useMemo)(()=>({registerDescriptionId:v}),[v]);i(()=>{let e=new Set(d),t=Array.from(_.current?.querySelectorAll(`[id]`)??[]).map(e=>e.id).filter(t=>e.has(t));g(e=>e.length===t.length&&e.every((e,n)=>e===t[n])?e:t)});let b=Array.from(new Set([...a?.split(/\s+/).filter(Boolean)??[],...m])).join(` `)||void 0;return u({defaultTagName:`div`,render:n,ref:c,props:l(o,{className:s(h.heading,P[`heading-wrapper`],t),children:(0,I.jsx)(F.Provider,{value:y,children:(0,I.jsxs)(se,{className:P.header,render:(0,I.jsx)(E,{}),nativeButton:!1,"aria-describedby":b,children:[(0,I.jsx)(`div`,{ref:_,className:P[`header-content`],children:e}),(0,I.jsx)(`div`,{className:s(P[`header-trigger-positioner`]),children:(0,I.jsx)(`div`,{className:s(P[`header-trigger-wrapper`],h.div),children:(0,I.jsx)(ee,{icon:f,className:P[`header-trigger`]})})})]})})})})});try{L.__docgenInfo={description:`The header of a collapsible card. Always visible, and acts as the
toggle trigger — clicking anywhere on it expands or collapses the
card's content.

Defaults to a \`<div>\` wrapper around the trigger. Since the right heading
level depends on the surrounding document outline, the consumer is
expected to opt in to heading semantics. Pass \`render\` to wrap the
trigger in a heading (e.g. \`render={ <h2 /> }\`), following the W3C APG
accordion pattern (heading wraps button).

Avoid placing interactive elements (buttons, links, inputs) inside the
header, since the entire area is clickable and their events will bubble
to trigger the collapse toggle.

Place full-bleed media in \`CollapsibleCard.Content\`, not the header.`,displayName:`Header`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/header.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`HeaderProps`}],description:`The content to be rendered inside the header.`,name:`children`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`HeaderProps`},required:!1,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var R,z,B;function init_header_description(){return(init_header_description=e((()=>{o(),n(),init_context(),_(),init_style_module(),R=t(),z=(0,R.jsx)(`div`,{}),B=(0,r.forwardRef)(function CollapsibleCardHeaderDescription({children:e,className:t,id:n,render:i=z,...a},o){let c=(0,r.useId)(),l=n??c,u=(0,r.useContext)(F);return(0,r.useEffect)(()=>u?.registerDescriptionId(l),[u,l]),(0,R.jsx)(v,{ref:o,variant:`body-md`,render:i,id:l,"aria-hidden":`true`,className:s(P[`header-description`],t),...a,children:e})});try{B.__docgenInfo={description:`Secondary content placed in the collapsible card header that describes
the trigger button via \`aria-describedby\`. Use it for supplementary
information such as status badges or summary values.

Must be rendered inside \`CollapsibleCard.Header\`.

The content is visually rendered but marked \`aria-hidden\` so that
assistive technologies consume it only through the \`aria-describedby\`
relationship on the trigger, avoiding double announcements.

Avoid interactive elements (buttons, links, inputs) inside this
component — the entire header is the toggle trigger.`,displayName:`HeaderDescription`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/header-description.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`HeaderDescriptionProps`}],description:`Secondary content that describes the header trigger via
\`aria-describedby\`. Rendered visually but marked \`aria-hidden\`
so assistive technologies consume it only through the description
relationship, avoiding double announcements.

Avoid interactive elements — the entire header is the toggle trigger.`,name:`children`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`HeaderDescriptionProps`},required:!1,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:{value:`<div />`},declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var V,H;function init_content(){return(init_content=e((()=>{n(),o(),w(),ae(),init_style_module(),V=t(),H=(0,r.forwardRef)(function CollapsibleCardContent({className:e,render:t,children:n,hiddenUntilFound:r=!0,...i},a){return(0,V.jsx)(k,{ref:a,className:t=>s(P.content,t.open&&t.transitionStatus===`idle`&&P[`overflow-visible`],e),hiddenUntilFound:r,...i,children:(0,V.jsx)(x,{className:P[`content-inner`],render:t,children:n})})});try{H.__docgenInfo={description:`The collapsible content area of the card. Hidden when collapsed,
visible when expanded.`,displayName:`Content`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/content.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`ContentProps`}],description:`The content to be rendered inside the collapsible content area.`,name:`children`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`ContentProps`},required:!1,tags:{},type:{name:`ReactNode`}},hiddenUntilFound:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`ContentProps`}],description:'Allows the browser’s built-in page search to find and expand the panel contents.\n\nOverrides the `keepMounted` prop and uses `hidden="until-found"`\nto hide the element without removing it from the DOM.',name:`hiddenUntilFound`,parent:{fileName:`gutenberg/packages/ui/src/collapsible-card/types.ts`,name:`ContentProps`},required:!1,tags:{},type:{name:`boolean`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{te(),ne(),O(),S(),w(),y(),_(),init_root(),init_header(),init_header_description(),init_content(),U=t(),W={tags:[`manifest`],title:`Components/@wordpress-ui/CollapsibleCard`,id:`design-system-components-collapsiblecard`,component:j,subcomponents:{"CollapsibleCard.Header":L,"CollapsibleCard.HeaderDescription":B,"CollapsibleCard.Content":H,"Card.FullBleed":T},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},G={args:{children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:`Collapsible card (closed by default)`})},`header`),(0,U.jsxs)(H,{children:[(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`This is the collapsible content area. It can contain any elements, just like a regular Card.Content.`}),(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`When collapsed, only the header and chevron are visible.`})]},`content`)]}},K={argTypes:{open:{control:!1}},args:{...G.args,defaultOpen:!0,children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:`Collapsed by default`})},`header`),(0,U.jsx)(H,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`This content was hidden until you expanded it.`})},`content`)]}},q={args:{...G.args,disabled:!0,children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:`Disabled card`})},`header`),(0,U.jsx)(H,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`The header is not interactive when disabled.`})},`content`)]}},J={parameters:{controls:{disable:!0}},render:()=>(0,U.jsx)(b,{direction:`column`,gap:`lg`,children:[`General`,`Advanced`,`Accessibility`,`Performance`,`Privacy`,`Notifications`].map(e=>(0,U.jsxs)(j,{children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:e})}),(0,U.jsxs)(H,{children:[(0,U.jsxs)(v,{render:(0,U.jsx)(`p`,{}),children:[`Configure all `,e.toLowerCase(),` settings for your site. Changes here affect how your site behaves across all pages and posts.`]}),(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`Review each option carefully before saving. Some changes may require a page reload to take effect. Hover over individual options for more details about what they control.`}),(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`If you're unsure about a setting, you can always reset to defaults using the button at the bottom of this section. Your previous configuration will be saved as a backup.`})]})]},e))})},Y={parameters:{controls:{disable:!0}},render:()=>(0,U.jsxs)(b,{direction:`column`,gap:`lg`,children:[(0,U.jsxs)(j,{children:[(0,U.jsx)(L,{render:(0,U.jsx)(`h2`,{}),children:(0,U.jsx)(D,{children:`Heading level 2`})}),(0,U.jsx)(H,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`The wrapper renders as an h2 element when the consumer passes an h2 React element to the render prop.`})})]}),(0,U.jsxs)(j,{children:[(0,U.jsx)(L,{render:(0,U.jsx)(`h3`,{}),children:(0,U.jsx)(D,{children:`Heading level 3`})}),(0,U.jsx)(H,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`Pass any of h1–h6 to choose the level that fits the surrounding document outline.`})})]}),(0,U.jsxs)(j,{children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:`No heading (default)`})}),(0,U.jsx)(H,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`Without a render prop, the header wraps the trigger in a plain div and does not contribute to the document outline.`})})]})]})},X={argTypes:{open:{control:!1},defaultOpen:{control:!1},onOpenChange:{control:!1}},render:({open:e,defaultOpen:t,onOpenChange:n,...r})=>(0,U.jsxs)(j,{...r,children:[(0,U.jsx)(L,{children:(0,U.jsxs)(b,{justify:`space-between`,align:`center`,children:[(0,U.jsx)(D,{children:`Settings`}),(0,U.jsx)(B,{children:`3 items configured`})]})}),(0,U.jsx)(H,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`The description appears next to the title.`})})]})},Z={argTypes:{open:{control:!1}},args:{...G.args,defaultOpen:!0},render:({open:e,defaultOpen:t,onOpenChange:n,disabled:r,...i})=>(0,U.jsxs)(b,{direction:`column`,gap:`lg`,children:[(0,U.jsxs)(j,{open:e,defaultOpen:t,onOpenChange:n,disabled:r,...i,children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:`CollapsibleCard (open)`})}),(0,U.jsx)(H,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`Content should align with the regular card below.`})})]}),(0,U.jsxs)(C,{...i,children:[(0,U.jsx)(E,{children:(0,U.jsx)(D,{children:`Regular Card`})}),(0,U.jsx)(x,{children:(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`Content should align with the collapsible card above.`})})]})]})},Q={argTypes:{open:{control:!1}},args:{defaultOpen:!0,children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:`Card title`})},`header`),(0,U.jsx)(H,{children:(0,U.jsx)(T,{children:(0,U.jsx)(`div`,{style:{height:180,background:`linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`}})})},`content`)]}},$={argTypes:{open:{control:!1}},args:{defaultOpen:!0,children:[(0,U.jsx)(L,{children:(0,U.jsx)(D,{children:`Featured image`})},`header`),(0,U.jsxs)(H,{render:(0,U.jsx)(b,{direction:`column`,gap:`lg`}),children:[(0,U.jsx)(T,{children:(0,U.jsx)(`div`,{style:{height:160,background:`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`}})}),(0,U.jsx)(v,{render:(0,U.jsx)(`p`,{}),children:`Content below the full-bleed area.`})]},`content`)]}};try{G.__docgenInfo={description:`A collapsible card that is open by default.`,displayName:`Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{K.__docgenInfo={description:`A collapsible card that starts collapsed.`,displayName:`InitiallyOpened`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{q.__docgenInfo={description:`A disabled collapsible card cannot be toggled by the user.`,displayName:`Disabled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{J.__docgenInfo={description:`Multiple collapsible cards stacked vertically, simulating a typical
settings-panel or FAQ-style layout.`,displayName:`Stacked`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:"`CollapsibleCard.Header` renders a `<div>` wrapper by default. Pass an\n`<h1>`–`<h6>` React element to the `render` prop to wrap the trigger in\na heading and contribute to the document outline. The right level\ndepends on the surrounding outline, so the consumer is expected to opt\nin.",displayName:`WithHeadingElement`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:"A collapsible card with a `HeaderDescription` that provides\nsupplementary information (e.g. status, summary) as an `aria-describedby`\nrelationship.",displayName:`WithHeaderDescription`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Visual comparison: a `CollapsibleCard` (open) next to a regular `Card`\nto verify identical spacing and layout.",displayName:`ComparedToCard`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:"When `Card.FullBleed` is the sole child of `CollapsibleCard.Content` and a\nheader sits above it, the media bumps against the card&apos;s side and\nbottom edges while the header retains its normal padding. (Unlike a plain\n`Card`, a header is always required here for the collapse trigger — see\n`Card` stories for a body-only `FullBleedCoverOnly` example.)",displayName:`FullBleedCoverWithHeader`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:`\`Card.FullBleed\` breaks out of the content padding to span edge-to-edge.
Useful for images, dividers, or embedded content inside the collapsible
region.`,displayName:`WithFullBleed`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible-card/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<CollapsibleCard.Header key="header">
                <Card.Title>Collapsible card (closed by default)</Card.Title>
            </CollapsibleCard.Header>, <CollapsibleCard.Content key="content">
                <Text render={<p />}>
                    This is the collapsible content area. It can contain any
                    elements, just like a regular Card.Content.
                </Text>
                <Text render={<p />}>
                    When collapsed, only the header and chevron are visible.
                </Text>
            </CollapsibleCard.Content>]
  }
}`,...G.parameters?.docs?.source},description:{story:`A collapsible card that is open by default.`,...G.parameters?.docs?.description}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  // \`defaultOpen\` (uncontrolled) and \`open\` (controlled) should not be
  // used together — disable the \`open\` control to avoid confusion.
  argTypes: {
    open: {
      control: false
    }
  },
  args: {
    ...Default.args,
    defaultOpen: true,
    children: [<CollapsibleCard.Header key="header">
                <Card.Title>Collapsed by default</Card.Title>
            </CollapsibleCard.Header>, <CollapsibleCard.Content key="content">
                <Text render={<p />}>
                    This content was hidden until you expanded it.
                </Text>
            </CollapsibleCard.Content>]
  }
}`,...K.parameters?.docs?.source},description:{story:`A collapsible card that starts collapsed.`,...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    disabled: true,
    children: [<CollapsibleCard.Header key="header">
                <Card.Title>Disabled card</Card.Title>
            </CollapsibleCard.Header>, <CollapsibleCard.Content key="content">
                <Text render={<p />}>
                    The header is not interactive when disabled.
                </Text>
            </CollapsibleCard.Content>]
  }
}`,...q.parameters?.docs?.source},description:{story:`A disabled collapsible card cannot be toggled by the user.`,...q.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: () => <Stack direction="column" gap="lg">
            {['General', 'Advanced', 'Accessibility', 'Performance', 'Privacy', 'Notifications'].map(title => <CollapsibleCard.Root key={title}>
                    <CollapsibleCard.Header>
                        <Card.Title>{title}</Card.Title>
                    </CollapsibleCard.Header>
                    <CollapsibleCard.Content>
                        <Text render={<p />}>
                            Configure all {title.toLowerCase()} settings for
                            your site. Changes here affect how your site behaves
                            across all pages and posts.
                        </Text>
                        <Text render={<p />}>
                            Review each option carefully before saving. Some
                            changes may require a page reload to take effect.
                            Hover over individual options for more details about
                            what they control.
                        </Text>
                        <Text render={<p />}>
                            If you&apos;re unsure about a setting, you can
                            always reset to defaults using the button at the
                            bottom of this section. Your previous configuration
                            will be saved as a backup.
                        </Text>
                    </CollapsibleCard.Content>
                </CollapsibleCard.Root>)}
        </Stack>
}`,...J.parameters?.docs?.source},description:{story:`Multiple collapsible cards stacked vertically, simulating a typical
settings-panel or FAQ-style layout.`,...J.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: () => <Stack direction="column" gap="lg">
            <CollapsibleCard.Root>
                <CollapsibleCard.Header render={<h2 />}>
                    <Card.Title>Heading level 2</Card.Title>
                </CollapsibleCard.Header>
                <CollapsibleCard.Content>
                    <Text render={<p />}>
                        The wrapper renders as an h2 element when the consumer
                        passes an h2 React element to the render prop.
                    </Text>
                </CollapsibleCard.Content>
            </CollapsibleCard.Root>
            <CollapsibleCard.Root>
                <CollapsibleCard.Header render={<h3 />}>
                    <Card.Title>Heading level 3</Card.Title>
                </CollapsibleCard.Header>
                <CollapsibleCard.Content>
                    <Text render={<p />}>
                        Pass any of h1–h6 to choose the level that fits the
                        surrounding document outline.
                    </Text>
                </CollapsibleCard.Content>
            </CollapsibleCard.Root>
            <CollapsibleCard.Root>
                <CollapsibleCard.Header>
                    <Card.Title>No heading (default)</Card.Title>
                </CollapsibleCard.Header>
                <CollapsibleCard.Content>
                    <Text render={<p />}>
                        Without a render prop, the header wraps the trigger in a
                        plain div and does not contribute to the document
                        outline.
                    </Text>
                </CollapsibleCard.Content>
            </CollapsibleCard.Root>
        </Stack>
}`,...Y.parameters?.docs?.source},description:{story:"`CollapsibleCard.Header` renders a `<div>` wrapper by default. Pass an\n`<h1>`–`<h6>` React element to the `render` prop to wrap the trigger in\na heading and contribute to the document outline. The right level\ndepends on the surrounding outline, so the consumer is expected to opt\nin.",...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  argTypes: {
    open: {
      control: false
    },
    defaultOpen: {
      control: false
    },
    onOpenChange: {
      control: false
    }
  },
  render: ({
    open: _open,
    defaultOpen: _defaultOpen,
    onOpenChange: _onOpenChange,
    ...restArgs
  }) => <CollapsibleCard.Root {...restArgs}>
            <CollapsibleCard.Header>
                <Stack justify="space-between" align="center">
                    <Card.Title>Settings</Card.Title>
                    <CollapsibleCard.HeaderDescription>
                        3 items configured
                    </CollapsibleCard.HeaderDescription>
                </Stack>
            </CollapsibleCard.Header>
            <CollapsibleCard.Content>
                <Text render={<p />}>
                    The description appears next to the title.
                </Text>
            </CollapsibleCard.Content>
        </CollapsibleCard.Root>
}`,...X.parameters?.docs?.source},description:{story:"A collapsible card with a `HeaderDescription` that provides\nsupplementary information (e.g. status, summary) as an `aria-describedby`\nrelationship.",...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  // \`defaultOpen\` (uncontrolled) and \`open\` (controlled) should not be
  // used together — disable the \`open\` control to avoid confusion.
  argTypes: {
    open: {
      control: false
    }
  },
  args: {
    ...Default.args,
    defaultOpen: true
  },
  render: ({
    open,
    defaultOpen,
    onOpenChange,
    disabled,
    ...restArgs
  }) => <Stack direction="column" gap="lg">
            <CollapsibleCard.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} disabled={disabled} {...restArgs}>
                <CollapsibleCard.Header>
                    <Card.Title>CollapsibleCard (open)</Card.Title>
                </CollapsibleCard.Header>
                <CollapsibleCard.Content>
                    <Text render={<p />}>
                        Content should align with the regular card below.
                    </Text>
                </CollapsibleCard.Content>
            </CollapsibleCard.Root>
            <Card.Root {...restArgs}>
                <Card.Header>
                    <Card.Title>Regular Card</Card.Title>
                </Card.Header>
                <Card.Content>
                    <Text render={<p />}>
                        Content should align with the collapsible card above.
                    </Text>
                </Card.Content>
            </Card.Root>
        </Stack>
}`,...Z.parameters?.docs?.source},description:{story:"Visual comparison: a `CollapsibleCard` (open) next to a regular `Card`\nto verify identical spacing and layout.",...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  argTypes: {
    open: {
      control: false
    }
  },
  args: {
    defaultOpen: true,
    children: [<CollapsibleCard.Header key="header">
                <Card.Title>Card title</Card.Title>
            </CollapsibleCard.Header>, <CollapsibleCard.Content key="content">
                <Card.FullBleed>
                    <div style={{
          height: 180,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        }} />
                </Card.FullBleed>
            </CollapsibleCard.Content>]
  }
}`,...Q.parameters?.docs?.source},description:{story:"When `Card.FullBleed` is the sole child of `CollapsibleCard.Content` and a\nheader sits above it, the media bumps against the card&apos;s side and\nbottom edges while the header retains its normal padding. (Unlike a plain\n`Card`, a header is always required here for the collapse trigger — see\n`Card` stories for a body-only `FullBleedCoverOnly` example.)",...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  argTypes: {
    open: {
      control: false
    }
  },
  args: {
    defaultOpen: true,
    children: [<CollapsibleCard.Header key="header">
                <Card.Title>Featured image</Card.Title>
            </CollapsibleCard.Header>, <CollapsibleCard.Content render={<Stack direction="column" gap="lg" />} key="content">
                <Card.FullBleed>
                    <div style={{
          height: 160,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }} />
                </Card.FullBleed>
                <Text render={<p />}>Content below the full-bleed area.</Text>
            </CollapsibleCard.Content>]
  }
}`,...$.parameters?.docs?.source},description:{story:`\`Card.FullBleed\` breaks out of the content padding to span edge-to-edge.
Useful for images, dividers, or embedded content inside the collapsible
region.`,...$.parameters?.docs?.description}}}})))()}init_index_story();export{Z as ComparedToCard,G as Default,q as Disabled,Q as FullBleedCoverWithHeader,K as InitiallyOpened,J as Stacked,$ as WithFullBleed,X as WithHeaderDescription,Y as WithHeadingElement,W as default};