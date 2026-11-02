import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./react-platform-CdCCcmsi.js";import{n as o,t as s}from"./use-merge-refs-BNmiIksj.js";import{n as c,t as l}from"./use-isomorphic-layout-effect-CgrzDkxH.js";import{La as u,_c as d,n as f}from"./build-module-CPA2Y5FH.js";import{n as p,t as m}from"./icon-CuFTK1Qw.js";import{n as h,t as g}from"./visually-hidden-BD0tKS3_.js";import{n as _,t as v}from"./icon-button-zoK6WFAm.js";import{n as y,t as ee}from"./link-C3WALUlf.js";import{_ as b,a as x,d as S,h as C,l as w,p as T,r as E,s as D,t as te,y as O}from"./popover-GN7FCN7C.js";function useMeasure(){let[e,t]=(0,r.useState)(null),[n,i]=(0,r.useState)({width:0,height:0});return c(()=>{if(!e)return;let t=new ResizeObserver(()=>{let t=e.getBoundingClientRect();i({width:t.width,height:t.height})});return t.observe(e),()=>{t.disconnect()}},[e]),[(0,r.useCallback)(e=>{if(e){let t=e.getBoundingClientRect();i({width:t.width,height:t.height})}t(e)},[]),n]}var k,A;function init_utils(){return(init_utils=e((()=>{i(),n(),l(),s(),k=t(),A=(0,r.forwardRef)(function UnforwardedGenericIframe({children:e,...t},n){let[i,s]=(0,r.useState)(null),c=(0,r.useRef)(null),l=o([n,c]);return(0,k.jsx)(`iframe`,{title:`Iframe`,...t,ref:l,srcDoc:`<!doctype html><html><body></body></html>`,onLoad:e=>{let t=e.currentTarget.contentDocument;t&&s(t.body)},children:i&&a(e,i)})});try{useMeasure.__docgenInfo={description:`Tracks the dimensions of a DOM element via ResizeObserver.
Returns a ref callback to attach to the element and its current size.

The ref callback performs a synchronous \`getBoundingClientRect\` read so
the first render already has accurate dimensions (avoids a 0×0 flash).`,displayName:`useMeasure`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/utils.tsx`,methods:[],props:{},tags:{}}}catch{}try{A.__docgenInfo={description:"Renders an iframe and portals its `children` into the iframe's body.\nForwards a ref to the underlying `<iframe>` element.\n\nWaits for the iframe's `load` event before portaling to ensure\ncompatibility with Firefox.\nSee https://github.com/facebook/react/issues/22847#issuecomment-991394558",displayName:`GenericIframe`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/utils.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{n(),f(),te(),h(),p(),_(),y(),init_utils(),j=t(),M={title:`Components/@wordpress-ui/Popover`,id:`design-system-components-popover`,component:D,subcomponents:{"Popover.Trigger":E,"Popover.Portal":T,"Popover.Positioner":S,"Popover.Popup":w,"Popover.Arrow":O,"Popover.Title":x,"Popover.Description":C,"Popover.Close":b},argTypes:{children:{control:!1}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},N={argTypes:{children:{control:{type:`text`}}},args:{children:[(0,j.jsx)(E,{children:`Open Popover`},`trigger`),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Popover title`}),(0,j.jsx)(C,{children:`Popover description`})]},`popup`)]}},P={args:{children:[(0,j.jsx)(E,{children:`Open Popover`},`trigger`),(0,j.jsxs)(w,{children:[(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Popover title`}),(0,j.jsx)(C,{children:`Popover description`})]},`popup`)]}},F={parameters:{controls:{disable:!0}},render:function Render(){let e=[`top`,`right`,`bottom`,`left`],t=[`start`,`center`,`end`];return(0,j.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(3, 1fr)`,gap:`6rem`,padding:`6rem 4rem`,justifyItems:`center`},children:e.flatMap(e=>t.map(t=>(0,j.jsxs)(D,{open:!0,children:[(0,j.jsxs)(E,{children:[e,` / `,t]}),(0,j.jsxs)(w,{positioner:(0,j.jsx)(S,{side:e,align:t,collisionAvoidance:{side:`none`,align:`none`}}),children:[(0,j.jsxs)(g,{render:(0,j.jsx)(x,{}),children:[e,` / `,t]}),(0,j.jsx)(O,{}),(0,j.jsxs)(C,{children:[e,` side / `,t,` align`]})]})]},`${e}-${t}`)))})}},I={args:{children:[(0,j.jsx)(E,{children:`Settings`},`trigger`),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`var(--wpds-dimension-gap-sm, 8px)`},children:[(0,j.jsx)(x,{children:`Settings`}),(0,j.jsx)(b,{render:(0,j.jsx)(v,{variant:`minimal`,size:`compact`,tone:`neutral`,icon:d,label:`Close`})})]}),(0,j.jsx)(C,{children:`Configure your notification preferences and display settings.`})]},`popup`)]}},L={argTypes:{open:{control:!1},onOpenChange:{control:!1},defaultOpen:{control:!1}},args:{children:[(0,j.jsx)(E,{children:`Toggle Popover`},`trigger`),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Controlled Popover`}),(0,j.jsx)(C,{children:`This popover is controlled by external state.`})]},`popup`)]},render:function Render(e){let[t,n]=(0,r.useState)(!1),i=(0,r.useId)(),a=(0,r.useRef)(null),o=(0,r.useRef)(null);return(0,j.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`,alignItems:`center`},children:[(0,j.jsx)(D,{...e,open:t,onOpenChange:(e,t)=>{[`outside-press`,`focus-out`].includes(t.reason)&&t.event.target&&[a.current,o.current].filter(Boolean).includes(t.event.target)||n(e)}}),(0,j.jsxs)(`label`,{htmlFor:i,ref:o,children:[(0,j.jsx)(`input`,{ref:a,id:i,type:`checkbox`,checked:t,onChange:e=>n(e.target.checked)}),`Open`]})]})}},R={argTypes:{modal:{control:!1}},args:{modal:!0,children:[(0,j.jsx)(E,{children:`Edit Settings`},`trigger`),(0,j.jsxs)(w,{backdrop:!0,children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Settings`}),(0,j.jsxs)(`form`,{style:{display:`flex`,flexDirection:`column`,gap:`var(--wpds-dimension-gap-sm, 8px)`,marginTop:`var(--wpds-dimension-gap-sm, 8px)`},onSubmit:e=>e.preventDefault(),children:[(0,j.jsxs)(`label`,{htmlFor:`popover-test-name-id`,style:{display:`flex`,flexDirection:`column`,gap:`var(--wpds-dimension-gap-xs, 4px)`,fontSize:`inherit`},children:[`Name`,(0,j.jsx)(`input`,{id:`popover-test-name-id`,type:`text`,placeholder:`Enter your name`})]}),(0,j.jsxs)(`label`,{htmlFor:`popover-test-email-id`,style:{display:`flex`,flexDirection:`column`,gap:`var(--wpds-dimension-gap-xs, 4px)`,fontSize:`inherit`},children:[`Email`,(0,j.jsx)(`input`,{id:`popover-test-email-id`,type:`email`,placeholder:`Enter your email`})]}),(0,j.jsxs)(`div`,{style:{display:`flex`,justifyContent:`flex-end`,gap:`var(--wpds-dimension-gap-sm, 8px)`,marginTop:`var(--wpds-dimension-gap-xs, 4px)`},children:[(0,j.jsx)(b,{style:{all:`unset`,cursor:`pointer`},children:`Cancel`}),(0,j.jsx)(`button`,{type:`submit`,children:`Save`})]})]})]},`popup`)]}},z={args:{children:[(0,j.jsx)(E,{children:`Open Unstyled`},`trigger`),(0,j.jsxs)(w,{variant:`unstyled`,children:[(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Custom Styled`}),(0,j.jsx)(C,{children:`This popup has no default styling — the consumer controls all visual appearance.`})]},`popup`)]}},B={args:{defaultOpen:!0},argTypes:{defaultOpen:{control:!1}},render:function Render({children:e,...t}){let[n,r]=useMeasure(),[i,a]=useMeasure();return(0,j.jsx)(`div`,{style:{padding:`4rem`,textAlign:`center`},children:(0,j.jsxs)(D,{...t,children:[(0,j.jsx)(E,{ref:i,children:`Trigger (covered by popover)`}),(0,j.jsxs)(w,{ref:n,positioner:(0,j.jsx)(S,{side:`bottom`,align:`center`,sideOffset:-1*(r.height/2+a.height/2),collisionAvoidance:{side:`none`,align:`none`}}),children:[(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Overlay`}),(0,j.jsxs)(C,{children:[`This popover is centered over its trigger using a negative sideOffset.`,(0,j.jsx)(`br`,{}),`The trigger is currently hidden under the popover.`,(0,j.jsx)(`br`,{}),`Try resizing the browser — collision avoidance is disabled so the popover stays overlaid.`]})]})]})})}},V={parameters:{controls:{disable:!0}},render:function Render(){let e=(0,r.useRef)(null);return(0,j.jsx)(`div`,{"data-testid":`inline-wrapper`,children:(0,j.jsxs)(D,{children:[(0,j.jsx)(E,{children:`Open Inline`}),(0,j.jsx)(`span`,{ref:e,style:{display:`contents`}}),(0,j.jsxs)(w,{portal:(0,j.jsx)(T,{container:e}),children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Inline Popover`}),(0,j.jsx)(C,{children:"This example still uses `Popover.Portal`, but the portal `container` is the in-tree span above, so the portal node mounts inside the wrapper instead of `document.body`."})]})]})})}},H={parameters:{controls:{disable:!0}},render:function Render(){let[e,t]=(0,r.useState)(null);return(0,j.jsxs)(`div`,{ref:t,style:{height:300,overflow:`auto`,border:`1px solid #ccc`,padding:`200px 2rem`},children:[(0,j.jsxs)(`div`,{style:{display:`flex`,gap:`2rem`,justifyContent:`center`},children:[(0,j.jsxs)(D,{defaultOpen:!0,children:[(0,j.jsx)(E,{children:`Flip (default)`}),(0,j.jsxs)(w,{positioner:(0,j.jsx)(S,{side:`top`,collisionBoundary:e??void 0}),children:[(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Flip`}),(0,j.jsx)(C,{children:`Flips to bottom when clipped`})]})]}),(0,j.jsxs)(D,{defaultOpen:!0,children:[(0,j.jsx)(E,{children:`No collision`}),(0,j.jsxs)(w,{positioner:(0,j.jsx)(S,{side:`top`,collisionBoundary:e??void 0,collisionAvoidance:{side:`none`,align:`none`}}),children:[(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`None`}),(0,j.jsx)(C,{children:`Stays on top even when clipped`})]})]})]}),(0,j.jsx)(`div`,{style:{height:600}})]})}},U={args:{defaultOpen:!0},argTypes:{defaultOpen:{control:!1}},render:function Render({children:e,...t}){let n=(0,r.useRef)(null),[i,a]=(0,r.useState)(null);return(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`div`,{ref:n}),(0,j.jsx)(A,{ref:a,style:{width:`100%`,height:400,border:0,outline:`1px solid purple`},children:(0,j.jsx)(`div`,{style:{height:`200vh`,paddingTop:`10vh`},children:(0,j.jsx)(`div`,{style:{maxWidth:200,marginTop:100,marginInline:`auto`},children:(0,j.jsxs)(D,{...t,children:[(0,j.jsx)(E,{style:{padding:8,background:`salmon`},children:`Popover's anchor (inside iframe)`}),(0,j.jsxs)(w,{portal:(0,j.jsx)(T,{container:n}),positioner:(0,j.jsx)(S,{collisionBoundary:i??void 0}),children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Cross-Iframe Popover`}),(0,j.jsx)(C,{children:`This popup is rendered in the parent document, not inside the iframe. Scroll the iframe to see the popover track the trigger.`})]})]})})})})]})}},W={name:`With Custom z-index`,args:{children:[(0,j.jsx)(E,{children:`Open Popover`},`trigger`),(0,j.jsxs)(w,{portal:(0,j.jsx)(T,{style:{"--wp-ui-popover-z-index":`9999`}}),children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Custom z-index`}),(0,j.jsx)(C,{children:"This popover renders at `z-index: 9999` via the `--wp-ui-popover-z-index` CSS custom property, set on `Popover.Portal` through the `portal` prop."})]},`popup`)]}},G={parameters:{controls:{disable:!0}},render:function Render(){let[e,t]=(0,r.useState)(null),n=(0,r.useRef)(null),i=(0,r.useRef)(null),a=(0,r.useRef)(null),o={getBoundingClientRect:()=>i.current?.getBoundingClientRect()??new DOMRect},s={padding:`8px 12px`,border:`2px dashed currentcolor`,borderRadius:4,fontSize:12,textAlign:`center`},c={collisionAvoidance:{side:`none`,align:`none`}};return(0,j.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`4rem`,padding:`4rem 2rem`},children:[(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`div`,{ref:t,style:s,children:`Element anchor`}),(0,j.jsx)(D,{open:!0,children:(0,j.jsxs)(w,{positioner:(0,j.jsx)(S,{anchor:e??void 0,...c}),children:[(0,j.jsx)(g,{render:(0,j.jsx)(x,{}),children:`Element anchor`}),(0,j.jsx)(O,{}),(0,j.jsx)(C,{children:`Anchored to a DOM element`})]})})]}),(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`div`,{ref:i,style:s,children:`VirtualElement anchor`}),(0,j.jsx)(D,{open:!0,children:(0,j.jsxs)(w,{positioner:(0,j.jsx)(S,{anchor:o,...c}),children:[(0,j.jsx)(g,{render:(0,j.jsx)(x,{}),children:`Virtual anchor`}),(0,j.jsx)(O,{}),(0,j.jsx)(C,{children:`Anchored to a virtual element`})]})})]}),(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`div`,{ref:n,style:s,children:`RefObject anchor`}),(0,j.jsx)(D,{open:!0,children:(0,j.jsxs)(w,{positioner:(0,j.jsx)(S,{anchor:n,...c}),children:[(0,j.jsx)(g,{render:(0,j.jsx)(x,{}),children:`Ref anchor`}),(0,j.jsx)(O,{}),(0,j.jsx)(C,{children:`Anchored via useRef`})]})})]}),(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`div`,{ref:a,style:s,children:`Callback anchor`}),(0,j.jsx)(D,{open:!0,children:(0,j.jsxs)(w,{positioner:(0,j.jsx)(S,{anchor:()=>a.current,...c}),children:[(0,j.jsx)(g,{render:(0,j.jsx)(x,{}),children:`Callback anchor`}),(0,j.jsx)(O,{}),(0,j.jsx)(C,{children:`Anchored via callback function`})]})})]})]})}},K={args:{children:[(0,j.jsx)(E,{children:`Open Toolbar`},`trigger`),(0,j.jsxs)(w,{variant:`unstyled`,style:{display:`flex`,gap:`var(--wpds-dimension-gap-xs, 4px)`,padding:`4px 8px`,border:`1px solid #1e1e1e`,borderRadius:2,background:`#fff`,fontSize:13},children:[(0,j.jsx)(g,{render:(0,j.jsx)(x,{}),children:`Formatting`}),(0,j.jsx)(`button`,{type:`button`,children:`B`}),(0,j.jsx)(`button`,{type:`button`,children:`I`}),(0,j.jsx)(`button`,{type:`button`,children:`U`}),(0,j.jsx)(`button`,{type:`button`,children:`Link`})]},`popup`)]}},q={name:`Viewport-Constrained Size`,args:{defaultOpen:!0},argTypes:{defaultOpen:{control:!1}},render:function Render({children:e,...t}){return(0,j.jsxs)(`div`,{style:{height:250,overflow:`auto`,border:`1px solid #ccc`,padding:`60px 2rem`},children:[(0,j.jsxs)(D,{...t,children:[(0,j.jsx)(E,{children:`Show Content`}),(0,j.jsx)(w,{positioner:(0,j.jsx)(S,{side:`bottom`}),style:{maxHeight:`var(--available-height, 300px)`,maxWidth:`var(--available-width, 300px)`},children:(0,j.jsxs)(`div`,{style:{overflow:`auto`,height:`100%`},children:[(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Constrained`}),(0,j.jsx)(C,{children:"This popup constrains its size using the `--available-height` and `--available-width` CSS variables exposed by the positioner."}),(0,j.jsx)(`div`,{style:{height:400},children:(0,j.jsx)(`p`,{children:`Scroll inside this popup — its max-height is capped to the available viewport space.`})})]})})]}),(0,j.jsx)(`div`,{style:{height:600}})]})}},J={name:`onOpenChange Details`,parameters:{controls:{disable:!0}},render:function Render(){let[e,t]=(0,r.useState)([]);return(0,j.jsxs)(`div`,{style:{display:`flex`,gap:`2rem`},children:[(0,j.jsxs)(D,{onOpenChange:(e,n)=>{t(t=>[...t.slice(-9),`open=${e} reason=${n.reason}`])},children:[(0,j.jsx)(E,{children:`Toggle`}),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Event Log`}),(0,j.jsx)(C,{children:`Dismiss this popover via Escape, click-outside, or moving focus away.`})]})]}),(0,j.jsx)(`pre`,{style:{flex:1,padding:8,fontSize:12,lineHeight:1.5,background:`#f5f5f5`,borderRadius:4,minHeight:100,margin:0},children:e.length?e.join(`
`):`Interact with the popover to see events…`})]})}},Y={parameters:{controls:{disable:!0}},render:function Render(){let e=(0,r.useRef)(null),t=(0,r.useId)(),n=(0,r.useId)();return(0,j.jsxs)(D,{children:[(0,j.jsx)(E,{children:`Open Form`}),(0,j.jsxs)(w,{initialFocus:e,children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Contact`}),(0,j.jsxs)(`form`,{style:{display:`flex`,flexDirection:`column`,gap:`var(--wpds-dimension-gap-sm, 8px)`},onSubmit:e=>e.preventDefault(),children:[(0,j.jsx)(`label`,{htmlFor:t,style:{display:`flex`,flexDirection:`column`,gap:`var(--wpds-dimension-gap-xs, 4px)`,fontSize:`inherit`},children:`Name`}),(0,j.jsx)(`input`,{id:t,type:`text`,placeholder:`Enter name`}),(0,j.jsx)(`label`,{htmlFor:n,style:{display:`flex`,flexDirection:`column`,gap:`var(--wpds-dimension-gap-xs, 4px)`,fontSize:`inherit`},children:`Email (auto-focused)`}),(0,j.jsx)(`input`,{id:n,ref:e,type:`email`,placeholder:`Enter email`})]})]})]})}},X={argTypes:{modal:{control:!1}},args:{modal:`trap-focus`},render:function Render(e){return(0,j.jsxs)(`div`,{style:{display:`flex`,gap:`2rem`},children:[(0,j.jsxs)(D,{...e,children:[(0,j.jsx)(E,{children:`Open`}),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Trap Focus`}),(0,j.jsx)(C,{children:`Tab cycles within this popover, but clicking outside still works.`}),(0,j.jsxs)(`div`,{style:{display:`flex`,gap:`var(--wpds-dimension-gap-sm, 8px)`,marginTop:`var(--wpds-dimension-gap-sm, 8px)`},children:[(0,j.jsx)(`input`,{placeholder:`Field A`}),(0,j.jsx)(`input`,{placeholder:`Field B`}),(0,j.jsx)(b,{children:`Close`})]})]})]}),(0,j.jsx)(`button`,{type:`button`,onClick:()=>window.alert(`Outside button clicked!`),children:`Outside button`})]})}},Z={parameters:{controls:{disable:!0}},render:function Render(e){return(0,j.jsxs)(D,{...e,children:[(0,j.jsx)(E,{openOnHover:!0,delay:200,closeDelay:150,children:`Hover me`}),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsx)(x,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Hover Popover`}),(0,j.jsx)(C,{children:`This popover opens on hover with a 200ms delay and closes 150ms after the pointer leaves.`})]})]})}},Q={parameters:{controls:{disable:!0}},render:function Render(e){return(0,j.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`var(--wpds-dimension-gap-xs, 4px)`},children:[(0,j.jsx)(`span`,{children:`Label`}),(0,j.jsxs)(D,{...e,children:[(0,j.jsx)(E,{openOnHover:!0,delay:200,closeDelay:200,"aria-label":`More information`,style:{background:`none`,border:`none`,padding:0,cursor:`var(--wpds-cursor-control, pointer)`,display:`inline-flex`,alignItems:`center`,borderRadius:`var(--wpds-border-radius-sm, 2px)`},children:(0,j.jsx)(m,{icon:u,size:20})}),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsx)(g,{render:(0,j.jsx)(x,{}),children:`More information`}),(0,j.jsx)(C,{children:`This is additional context about the label. Unlike tooltips, this content is accessible to touch and screen reader users.`})]})]})]})}},$={parameters:{controls:{disable:!0}},render:function Render(e){return(0,j.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`var(--wpds-dimension-gap-xs, 4px)`},children:[(0,j.jsx)(`span`,{children:`Label`}),(0,j.jsxs)(D,{...e,children:[(0,j.jsx)(E,{openOnHover:!0,delay:200,closeDelay:200,"aria-label":`More information`,style:{background:`none`,border:`none`,padding:0,cursor:`var(--wpds-cursor-control, pointer)`,display:`inline-flex`,alignItems:`center`,borderRadius:`var(--wpds-border-radius-sm, 2px)`},children:(0,j.jsx)(m,{icon:u,size:20})}),(0,j.jsxs)(w,{children:[(0,j.jsx)(O,{}),(0,j.jsx)(g,{render:(0,j.jsx)(x,{}),children:`More information`}),(0,j.jsxs)(C,{children:[`This is additional context about the label.`,` `,(0,j.jsx)(ee,{href:`https://wordpress.org`,openInNewTab:!0,children:`Read more`})]})]})]})]})}};try{P.__docgenInfo={description:"A popover without the arrow sub-component. Omit `Popover.Arrow`\nfrom the popup content when an arrow indicator is not desired.",displayName:`NoArrow`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{F.__docgenInfo={description:"All combinations of `side` and `align` props on `Popover.Positioner`.\n\nEach row shows a side (`top`, `right`, `bottom`, `left`), and each column\nshows an alignment (`start`, `center`, `end`).",displayName:`Positioning`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{I.__docgenInfo={description:"A popover with a close icon button, title, and description. The\n`Popover.Close` component renders a button that closes the popover when\nclicked. Here it wraps an `IconButton` for a properly sized, accessible\nclose action — matching the Dialog close-icon pattern.",displayName:`WithCloseButton`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{L.__docgenInfo={description:"Use the `open` and `onOpenChange` props on `Popover.Root` to control the\npopover's visibility programmatically.\n\nThe checkbox drives the popover state externally. The popover's trigger\nand click-outside dismiss both sync back to the same state via\n`onOpenChange`, keeping everything in sync.",displayName:`Controlled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{R.__docgenInfo={description:`Set \`modal\` to \`true\` to trap focus inside the popover when it is open.
This is useful for complex popover content that requires user interaction,
such as forms. Try tabbing through the fields — focus stays inside the
popover until it is dismissed.

**Note:** focus trapping requires a \`Popover.Close\` part inside the popup
so that screen readers always have an escape route. It can be visually
hidden if needed.

Pass \`backdrop\` to \`Popover.Popup\` to display a semi-transparent overlay
beneath the popover, signalling that the page is blocked.`,displayName:`Modal`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:'The `variant="unstyled"` option strips all visual styling from the popup,\nmaking it a blank positioning container for fully custom content.',displayName:`Unstyled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{B.__docgenInfo={description:`Overlay placement positions the popover centered on top of its trigger,
effectively covering it. This is achieved by computing a negative
\`sideOffset\` based on the measured sizes of the trigger and popup.

This technique is useful when you want the popover to visually replace
the trigger element in place.`,displayName:`OverlayPlacement`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{V.__docgenInfo={description:"To keep the floating layer **in page flow** next to surrounding layout,\ncreate a local ref to a `<span>` with `display: contents` and pass\n`portal={ <Popover.Portal container={ ref } /> }`. The popup still uses a\nportal, but the portal **mounts** into that subtree instead of\n`document.body`, while retaining positioning behavior.\n\n**Note:** `backdrop` will not cover the full viewport in this mode.",displayName:`Inline`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{H.__docgenInfo={description:`Use the \`collisionAvoidance\` prop to control how the popover behaves when
it collides with the edges of its collision boundary.

Because the popup renders via a portal (outside the scrollable container),
the container must be passed as \`collisionBoundary\` so Floating UI treats
it as the clipping edge.

- \`side: 'flip'\` flips to the opposite side (default).
- \`side: 'none'\` disables collision handling.

Scroll the container to see collision avoidance in action.`,displayName:`CollisionAvoidance`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{U.__docgenInfo={description:`When the popover's trigger lives inside an iframe but the popover should
render in the parent document, pass a parent-document element through
\`portal={ <Popover.Portal container={ ... } /> }\` on \`Popover.Popup\`.

This technique is used in Gutenberg where the block editor canvas is an
iframe but toolbars and menus must appear outside it.

Scroll inside the iframe to verify that the popover tracks the trigger
position across document boundaries.`,displayName:`CrossIframe`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{W.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a popover renders below another popover when you\nwant it above.\n\nThe `--wp-ui-popover-z-index` CSS variable controls the z-index of the\npopover's positioner (and its optional backdrop). Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  popover in the page), or\n- **Per instance**, by passing a `Popover.Portal` with a `style` (or\n  `className`) to `Popover.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{G.__docgenInfo={description:"Pass an `anchor` to `Popover.Positioner` (via `Popover.Popup`'s `positioner`\nslot) to position the popover against an arbitrary element instead of the\nbuilt-in trigger. `anchor` accepts four types:\n\n1. **Element** — a direct DOM element reference.\n2. **VirtualElement** — an object with a `getBoundingClientRect()` method.\n3. **RefObject** — a `React.RefObject` pointing to an element.\n4. **Callback** — a function returning an Element or VirtualElement.\n\nThis is the most-used pattern in Gutenberg: block popovers anchor to\nselected block elements, the link popover anchors to the text selection, and\ndata views anchor to right-click positions.",displayName:`Anchor`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{K.__docgenInfo={description:`Use \`variant="unstyled"\` and custom inline styles to replicate a toolbar-like
appearance: high-contrast border, no shadow, and a smaller border radius.

A first-class \`variant="toolbar"\` may be added in the future if this pattern
becomes widespread.`,displayName:`ToolbarVariant`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{q.__docgenInfo={description:"`Popover.Positioner` exposes `--available-height` and `--available-width`\nCSS variables representing the space between the anchor and the viewport\nedge. These cascade down to `Popover.Popup`, where applying them as\n`max-height` / `max-width` via the `style` prop constrains the popup size.\nThen add `overflow: auto` on an inner wrapper so scrolling happens inside\nthe popup content area — this replaces the legacy Popover's `resize` prop.\n\nOpen the popover and resize or scroll the container to see the popup shrink\nto fit.",displayName:`ViewportConstrainedSize`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{J.__docgenInfo={description:"The `onOpenChange` callback on `Popover.Root` receives an `eventDetails`\nobject with a `reason` field that describes why the popover is\nopening/closing. This replaces the legacy Popover's separate `onClose` and\n`onFocusOutside` callbacks:\n\n- `reason === 'escape-key'` — user pressed Escape (was `onClose`)\n- `reason === 'outside-press'` — user clicked outside (was `onClose`)\n- `reason === 'focus-out'` — focus moved outside (was `onFocusOutside`)\n\nOpen the popover, then dismiss it in different ways to see the logged reason.",displayName:`OnOpenChangeDetails`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:"Pass a ref to `initialFocus` on `Popover.Popup` to focus a specific element\nwhen the popover opens. This replaces the legacy Popover's `focusOnMount`\nprop.\n\nIn this example, the Email field receives focus instead of the first\nfocusable element (Name).",displayName:`InitialFocus`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:`Set \`modal="trap-focus"\` on \`Popover.Root\` to trap keyboard focus inside the
popover without making it fully modal. Unlike \`modal={true}\`, this mode:

- Traps Tab/Shift+Tab cycling within the popover
- Does **not** lock page scroll
- Does **not** block pointer interaction outside

A \`Popover.Close\` part must be rendered inside the popup so that screen
readers can escape. It can be visually hidden if not needed visually.

This replaces the legacy Popover's \`constrainTabbing\` prop. Try tabbing
through the fields — focus stays inside — then click the button outside
to verify that pointer interaction still works.`,displayName:`TrapFocus`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Set `openOnHover` on `Popover.Trigger` to open the popover when the trigger\nis hovered. The `delay` and `closeDelay` props control the timing (in ms).\n\nThis is a capability the legacy Popover does not have natively — consumers\nwould need to wire up `mouseenter`/`mouseleave` handlers manually.",displayName:`HoverTrigger`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:`Popups that open when hovering a help icon should use Popover with the
\`openOnHover\` prop on the trigger instead of a
[tooltip](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-tooltip--docs).
This way, touch users and screen reader users can access the content.

To know when to reach for a popover instead of a tooltip, consider the
purpose of the trigger element: If the trigger's purpose is to open the
popup itself, it's a popover. If the trigger's purpose is unrelated to
opening the popup, it's a tooltip.`,displayName:`Infotip`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:`An infotip popup can contain interactive content, such as a \`Link\`. The
popup stays open while the pointer moves from the trigger onto the popup
itself, so the link stays reachable — satisfying the "hoverable"
requirement of
[WCAG 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html).
The link is also reachable by tabbing to it, since the trigger opens on
focus as well as hover.`,displayName:`InfotipWithLink`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/popover/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  argTypes: {
    children: {
      control: {
        type: 'text'
      }
    }
  },
  args: {
    children: [<Popover.Trigger key="trigger">Open Popover</Popover.Trigger>, <Popover.Popup key="popup">
                <Popover.Arrow />
                <Popover.Title style={{
        marginBottom: 'var(--wpds-dimension-gap-xs)'
      }}>
                    Popover title
                </Popover.Title>
                <Popover.Description>Popover description</Popover.Description>
            </Popover.Popup>]
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Popover.Trigger key="trigger">Open Popover</Popover.Trigger>, <Popover.Popup key="popup">
                <Popover.Title style={{
        marginBottom: 'var(--wpds-dimension-gap-xs)'
      }}>
                    Popover title
                </Popover.Title>
                <Popover.Description>Popover description</Popover.Description>
            </Popover.Popup>]
  }
}`,...P.parameters?.docs?.source},description:{story:"A popover without the arrow sub-component. Omit `Popover.Arrow`\nfrom the popup content when an arrow indicator is not desired.",...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render() {
    const sides = ['top', 'right', 'bottom', 'left'] as const;
    const aligns = ['start', 'center', 'end'] as const;
    return <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '6rem',
      padding: '6rem 4rem',
      justifyItems: 'center'
    }}>
                {sides.flatMap(side => aligns.map(align => <Popover.Root key={\`\${side}-\${align}\`} open>
                            <Popover.Trigger>
                                {side} / {align}
                            </Popover.Trigger>
                            <Popover.Popup positioner={<Popover.Positioner side={side} align={align} collisionAvoidance={{
          side: 'none',
          align: 'none'
        }} />}>
                                <VisuallyHidden render={<Popover.Title />}>
                                    {side} / {align}
                                </VisuallyHidden>
                                <Popover.Arrow />
                                <Popover.Description>
                                    {side} side / {align} align
                                </Popover.Description>
                            </Popover.Popup>
                        </Popover.Root>))}
            </div>;
  }
}`,...F.parameters?.docs?.source},description:{story:"All combinations of `side` and `align` props on `Popover.Positioner`.\n\nEach row shows a side (`top`, `right`, `bottom`, `left`), and each column\nshows an alignment (`start`, `center`, `end`).",...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Popover.Trigger key="trigger">Settings</Popover.Trigger>, <Popover.Popup key="popup">
                <Popover.Arrow />
                <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--wpds-dimension-gap-sm)'
      }}>
                    <Popover.Title>Settings</Popover.Title>
                    <Popover.Close render={<IconButton variant="minimal" size="compact" tone="neutral" icon={close} label="Close" />} />
                </div>
                <Popover.Description>
                    Configure your notification preferences and display
                    settings.
                </Popover.Description>
            </Popover.Popup>]
  }
}`,...I.parameters?.docs?.source},description:{story:"A popover with a close icon button, title, and description. The\n`Popover.Close` component renders a button that closes the popover when\nclicked. Here it wraps an `IconButton` for a properly sized, accessible\nclose action — matching the Dialog close-icon pattern.",...I.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  argTypes: {
    open: {
      control: false
    },
    onOpenChange: {
      control: false
    },
    defaultOpen: {
      control: false
    }
  },
  args: {
    children: [<Popover.Trigger key="trigger">Toggle Popover</Popover.Trigger>, <Popover.Popup key="popup">
                <Popover.Arrow />
                <Popover.Title style={{
        marginBottom: 'var(--wpds-dimension-gap-xs)'
      }}>
                    Controlled Popover
                </Popover.Title>
                <Popover.Description>
                    This popover is controlled by external state.
                </Popover.Description>
            </Popover.Popup>]
  },
  render: function Render(args) {
    const [isOpen, setIsOpen] = useState(false);
    const checkboxId = useId();
    const checkboxRef = useRef<HTMLInputElement>(null);
    const labelRef = useRef<HTMLLabelElement>(null);
    return <div style={{
      display: 'flex',
      gap: '1rem',
      alignItems: 'center'
    }}>
                <Popover.Root {...args} open={isOpen} onOpenChange={(nextOpen, eventDetails) => {
        if (['outside-press', 'focus-out'].includes(eventDetails.reason) && !!eventDetails.event.target && ([checkboxRef.current, labelRef.current].filter(Boolean) as EventTarget[]).includes(eventDetails.event.target)) {
          return;
        }
        setIsOpen(nextOpen);
      }} />

                <label htmlFor={checkboxId} ref={labelRef}>
                    <input ref={checkboxRef} id={checkboxId} type="checkbox" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} />
                    Open
                </label>
            </div>;
  }
}`,...L.parameters?.docs?.source},description:{story:"Use the `open` and `onOpenChange` props on `Popover.Root` to control the\npopover's visibility programmatically.\n\nThe checkbox drives the popover state externally. The popover's trigger\nand click-outside dismiss both sync back to the same state via\n`onOpenChange`, keeping everything in sync.",...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  argTypes: {
    modal: {
      control: false
    }
  },
  args: {
    modal: true,
    children: [<Popover.Trigger key="trigger">Edit Settings</Popover.Trigger>, <Popover.Popup backdrop key="popup">
                <Popover.Arrow />
                <Popover.Title style={{
        marginBottom: 'var(--wpds-dimension-gap-xs)'
      }}>
                    Settings
                </Popover.Title>
                <form style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--wpds-dimension-gap-sm)',
        marginTop: 'var(--wpds-dimension-gap-sm)'
      }} onSubmit={e => e.preventDefault()}>
                    <label htmlFor="popover-test-name-id" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--wpds-dimension-gap-xs)',
          fontSize: 'inherit'
        }}>
                        Name
                        <input id="popover-test-name-id" type="text" placeholder="Enter your name" />
                    </label>
                    <label htmlFor="popover-test-email-id" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--wpds-dimension-gap-xs)',
          fontSize: 'inherit'
        }}>
                        Email
                        <input id="popover-test-email-id" type="email" placeholder="Enter your email" />
                    </label>
                    <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--wpds-dimension-gap-sm)',
          marginTop: 'var(--wpds-dimension-gap-xs)'
        }}>
                        <Popover.Close style={{
            all: 'unset',
            cursor: 'pointer'
          }}>
                            Cancel
                        </Popover.Close>
                        <button type="submit">Save</button>
                    </div>
                </form>
            </Popover.Popup>]
  }
}`,...R.parameters?.docs?.source},description:{story:`Set \`modal\` to \`true\` to trap focus inside the popover when it is open.
This is useful for complex popover content that requires user interaction,
such as forms. Try tabbing through the fields — focus stays inside the
popover until it is dismissed.

**Note:** focus trapping requires a \`Popover.Close\` part inside the popup
so that screen readers always have an escape route. It can be visually
hidden if needed.

Pass \`backdrop\` to \`Popover.Popup\` to display a semi-transparent overlay
beneath the popover, signalling that the page is blocked.`,...R.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Popover.Trigger key="trigger">Open Unstyled</Popover.Trigger>, <Popover.Popup variant="unstyled" key="popup">
                <Popover.Title style={{
        marginBottom: 'var(--wpds-dimension-gap-xs)'
      }}>
                    Custom Styled
                </Popover.Title>
                <Popover.Description>
                    This popup has no default styling — the consumer controls
                    all visual appearance.
                </Popover.Description>
            </Popover.Popup>]
  }
}`,...z.parameters?.docs?.source},description:{story:'The `variant="unstyled"` option strips all visual styling from the popup,\nmaking it a blank positioning container for fully custom content.',...z.parameters?.docs?.description}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    defaultOpen: true
  },
  argTypes: {
    defaultOpen: {
      control: false
    }
  },
  render: function Render({
    children: _children,
    ...args
  }) {
    const [popupRef, popupSize] = useMeasure<HTMLDivElement>();
    const [triggerRef, triggerSize] = useMeasure<HTMLButtonElement>();
    return <div style={{
      padding: '4rem',
      textAlign: 'center'
    }}>
                <Popover.Root {...args}>
                    <Popover.Trigger ref={triggerRef}>
                        Trigger (covered by popover)
                    </Popover.Trigger>
                    <Popover.Popup ref={popupRef} positioner={<Popover.Positioner side="bottom" align="center" sideOffset={-1 * (popupSize.height / 2 + triggerSize.height / 2)} collisionAvoidance={{
          side: 'none',
          align: 'none'
        }} />}>
                        <Popover.Title style={{
            marginBottom: 'var(--wpds-dimension-gap-xs)'
          }}>
                            Overlay
                        </Popover.Title>
                        <Popover.Description>
                            This popover is centered over its trigger using a
                            negative sideOffset.
                            <br />
                            The trigger is currently hidden under the popover.
                            <br />
                            Try resizing the browser — collision avoidance is
                            disabled so the popover stays overlaid.
                        </Popover.Description>
                    </Popover.Popup>
                </Popover.Root>
            </div>;
  }
}`,...B.parameters?.docs?.source},description:{story:`Overlay placement positions the popover centered on top of its trigger,
effectively covering it. This is achieved by computing a negative
\`sideOffset\` based on the measured sizes of the trigger and popup.

This technique is useful when you want the popover to visually replace
the trigger element in place.`,...B.parameters?.docs?.description}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render() {
    const inlineContainerRef = useRef<HTMLSpanElement>(null);
    return <div data-testid="inline-wrapper">
                <Popover.Root>
                    <Popover.Trigger>Open Inline</Popover.Trigger>
                    <span ref={inlineContainerRef} style={{
          display: 'contents'
        }} />

                    <Popover.Popup portal={<Popover.Portal container={inlineContainerRef} />}>
                        <Popover.Arrow />
                        <Popover.Title style={{
            marginBottom: 'var(--wpds-dimension-gap-xs)'
          }}>
                            Inline Popover
                        </Popover.Title>
                        <Popover.Description>
                            This example still uses \`Popover.Portal\`, but the
                            portal \`container\` is the in-tree span above, so the
                            portal node mounts inside the wrapper instead of
                            \`document.body\`.
                        </Popover.Description>
                    </Popover.Popup>
                </Popover.Root>
            </div>;
  }
}`,...V.parameters?.docs?.source},description:{story:"To keep the floating layer **in page flow** next to surrounding layout,\ncreate a local ref to a `<span>` with `display: contents` and pass\n`portal={ <Popover.Portal container={ ref } /> }`. The popup still uses a\nportal, but the portal **mounts** into that subtree instead of\n`document.body`, while retaining positioning behavior.\n\n**Note:** `backdrop` will not cover the full viewport in this mode.",...V.parameters?.docs?.description}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render() {
    const [boundary, setBoundary] = useState<HTMLElement | null>(null);
    return <div ref={setBoundary} style={{
      height: 300,
      overflow: 'auto',
      border: '1px solid #ccc',
      padding: '200px 2rem'
    }}>
                <div style={{
        display: 'flex',
        gap: '2rem',
        justifyContent: 'center'
      }}>
                    <Popover.Root defaultOpen>
                        <Popover.Trigger>Flip (default)</Popover.Trigger>
                        <Popover.Popup positioner={<Popover.Positioner side="top" collisionBoundary={boundary ?? undefined} />}>
                            <Popover.Title style={{
              marginBottom: 'var(--wpds-dimension-gap-xs)'
            }}>
                                Flip
                            </Popover.Title>
                            <Popover.Description>
                                Flips to bottom when clipped
                            </Popover.Description>
                        </Popover.Popup>
                    </Popover.Root>

                    <Popover.Root defaultOpen>
                        <Popover.Trigger>No collision</Popover.Trigger>
                        <Popover.Popup positioner={<Popover.Positioner side="top" collisionBoundary={boundary ?? undefined} collisionAvoidance={{
            side: 'none',
            align: 'none'
          }} />}>
                            <Popover.Title style={{
              marginBottom: 'var(--wpds-dimension-gap-xs)'
            }}>
                                None
                            </Popover.Title>
                            <Popover.Description>
                                Stays on top even when clipped
                            </Popover.Description>
                        </Popover.Popup>
                    </Popover.Root>
                </div>
                <div style={{
        height: 600
      }} />
            </div>;
  }
}`,...H.parameters?.docs?.source},description:{story:`Use the \`collisionAvoidance\` prop to control how the popover behaves when
it collides with the edges of its collision boundary.

Because the popup renders via a portal (outside the scrollable container),
the container must be passed as \`collisionBoundary\` so Floating UI treats
it as the clipping edge.

- \`side: 'flip'\` flips to the opposite side (default).
- \`side: 'none'\` disables collision handling.

Scroll the container to see collision avoidance in action.`,...H.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    defaultOpen: true
  },
  argTypes: {
    defaultOpen: {
      control: false
    }
  },
  render: function Render({
    children: _children,
    ...args
  }) {
    const portalContainerRef = useRef<HTMLDivElement>(null);
    const [iframeBoundary, setIframeBoundary] = useState<HTMLIFrameElement | null>(null);
    return <div>
                <div ref={portalContainerRef} />
                <GenericIframe ref={setIframeBoundary} style={{
        width: '100%',
        height: 400,
        border: 0,
        outline: '1px solid purple'
      }}>
                    <div style={{
          height: '200vh',
          paddingTop: '10vh'
        }}>
                        <div style={{
            maxWidth: 200,
            marginTop: 100,
            marginInline: 'auto'
          }}>
                            <Popover.Root {...args}>
                                <Popover.Trigger style={{
                padding: 8,
                background: 'salmon'
              }}>
                                    Popover&apos;s anchor (inside iframe)
                                </Popover.Trigger>
                                <Popover.Popup portal={<Popover.Portal container={portalContainerRef as React.RefObject<HTMLElement>} />} positioner={<Popover.Positioner collisionBoundary={iframeBoundary ?? undefined} />}>
                                    <Popover.Arrow />
                                    <Popover.Title style={{
                  marginBottom: 'var(--wpds-dimension-gap-xs)'
                }}>
                                        Cross-Iframe Popover
                                    </Popover.Title>
                                    <Popover.Description>
                                        This popup is rendered in the parent
                                        document, not inside the iframe. Scroll
                                        the iframe to see the popover track the
                                        trigger.
                                    </Popover.Description>
                                </Popover.Popup>
                            </Popover.Root>
                        </div>
                    </div>
                </GenericIframe>
            </div>;
  }
}`,...U.parameters?.docs?.source},description:{story:`When the popover's trigger lives inside an iframe but the popover should
render in the parent document, pass a parent-document element through
\`portal={ <Popover.Portal container={ ... } /> }\` on \`Popover.Popup\`.

This technique is used in Gutenberg where the block editor canvas is an
iframe but toolbars and menus must appear outside it.

Scroll inside the iframe to verify that the popover tracks the trigger
position across document boundaries.`,...U.parameters?.docs?.description}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    children: [<Popover.Trigger key="trigger">Open Popover</Popover.Trigger>, <Popover.Popup portal={<Popover.Portal style={{
      '--wp-ui-popover-z-index': '9999'
    }} />} key="popup">
                <Popover.Arrow />
                <Popover.Title style={{
        marginBottom: 'var(--wpds-dimension-gap-xs)'
      }}>
                    Custom z-index
                </Popover.Title>
                <Popover.Description>
                    This popover renders at \`z-index: 9999\` via the
                    \`--wp-ui-popover-z-index\` CSS custom property, set on
                    \`Popover.Portal\` through the \`portal\` prop.
                </Popover.Description>
            </Popover.Popup>]
  }
}`,...W.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a popover renders below another popover when you\nwant it above.\n\nThe `--wp-ui-popover-z-index` CSS variable controls the z-index of the\npopover's positioner (and its optional backdrop). Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  popover in the page), or\n- **Per instance**, by passing a `Popover.Portal` with a `style` (or\n  `className`) to `Popover.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",...W.parameters?.docs?.description}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render() {
    const [elementAnchor, setElementAnchor] = useState<HTMLElement | null>(null);
    const refAnchor = useRef<HTMLDivElement>(null);
    const virtualAnchorLabel = useRef<HTMLDivElement>(null);
    const callbackTarget = useRef<HTMLDivElement>(null);
    const virtualAnchor = {
      getBoundingClientRect: () => virtualAnchorLabel.current?.getBoundingClientRect() ?? new DOMRect()
    };
    const anchorBoxStyle = {
      padding: '8px 12px',
      border: '2px dashed currentcolor',
      borderRadius: 4,
      fontSize: 12,
      textAlign: 'center' as const
    };
    const sharedPositionerProps = {
      collisionAvoidance: {
        side: 'none' as const,
        align: 'none' as const
      }
    };
    return <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '4rem',
      padding: '4rem 2rem'
    }}>
                {/* 1. Element anchor */}
                <div>
                    <div ref={setElementAnchor} style={anchorBoxStyle}>
                        Element anchor
                    </div>
                    <Popover.Root open>
                        <Popover.Popup positioner={<Popover.Positioner anchor={elementAnchor ?? undefined} {...sharedPositionerProps} />}>
                            <VisuallyHidden render={<Popover.Title />}>
                                Element anchor
                            </VisuallyHidden>
                            <Popover.Arrow />
                            <Popover.Description>
                                Anchored to a DOM element
                            </Popover.Description>
                        </Popover.Popup>
                    </Popover.Root>
                </div>

                {/* 2. VirtualElement anchor */}
                <div>
                    <div ref={virtualAnchorLabel} style={anchorBoxStyle}>
                        VirtualElement anchor
                    </div>
                    <Popover.Root open>
                        <Popover.Popup positioner={<Popover.Positioner anchor={virtualAnchor} {...sharedPositionerProps} />}>
                            <VisuallyHidden render={<Popover.Title />}>
                                Virtual anchor
                            </VisuallyHidden>
                            <Popover.Arrow />
                            <Popover.Description>
                                Anchored to a virtual element
                            </Popover.Description>
                        </Popover.Popup>
                    </Popover.Root>
                </div>

                {/* 3. RefObject anchor */}
                <div>
                    <div ref={refAnchor} style={anchorBoxStyle}>
                        RefObject anchor
                    </div>
                    <Popover.Root open>
                        <Popover.Popup positioner={<Popover.Positioner anchor={refAnchor} {...sharedPositionerProps} />}>
                            <VisuallyHidden render={<Popover.Title />}>
                                Ref anchor
                            </VisuallyHidden>
                            <Popover.Arrow />
                            <Popover.Description>
                                Anchored via useRef
                            </Popover.Description>
                        </Popover.Popup>
                    </Popover.Root>
                </div>

                {/* 4. Callback anchor */}
                <div>
                    <div ref={callbackTarget} style={anchorBoxStyle}>
                        Callback anchor
                    </div>
                    <Popover.Root open>
                        <Popover.Popup positioner={<Popover.Positioner anchor={() => callbackTarget.current} {...sharedPositionerProps} />}>
                            <VisuallyHidden render={<Popover.Title />}>
                                Callback anchor
                            </VisuallyHidden>
                            <Popover.Arrow />
                            <Popover.Description>
                                Anchored via callback function
                            </Popover.Description>
                        </Popover.Popup>
                    </Popover.Root>
                </div>
            </div>;
  }
}`,...G.parameters?.docs?.source},description:{story:"Pass an `anchor` to `Popover.Positioner` (via `Popover.Popup`'s `positioner`\nslot) to position the popover against an arbitrary element instead of the\nbuilt-in trigger. `anchor` accepts four types:\n\n1. **Element** — a direct DOM element reference.\n2. **VirtualElement** — an object with a `getBoundingClientRect()` method.\n3. **RefObject** — a `React.RefObject` pointing to an element.\n4. **Callback** — a function returning an Element or VirtualElement.\n\nThis is the most-used pattern in Gutenberg: block popovers anchor to\nselected block elements, the link popover anchors to the text selection, and\ndata views anchor to right-click positions.",...G.parameters?.docs?.description}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Popover.Trigger key="trigger">Open Toolbar</Popover.Trigger>, <Popover.Popup variant="unstyled" style={{
      display: 'flex',
      gap: 'var(--wpds-dimension-gap-xs)',
      padding: '4px 8px',
      border: '1px solid #1e1e1e',
      borderRadius: 2,
      background: '#fff',
      fontSize: 13
    }} key="popup">
                <VisuallyHidden render={<Popover.Title />}>
                    Formatting
                </VisuallyHidden>
                <button type="button">B</button>
                <button type="button">I</button>
                <button type="button">U</button>
                <button type="button">Link</button>
            </Popover.Popup>]
  }
}`,...K.parameters?.docs?.source},description:{story:`Use \`variant="unstyled"\` and custom inline styles to replicate a toolbar-like
appearance: high-contrast border, no shadow, and a smaller border radius.

A first-class \`variant="toolbar"\` may be added in the future if this pattern
becomes widespread.`,...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: 'Viewport-Constrained Size',
  args: {
    defaultOpen: true
  },
  argTypes: {
    defaultOpen: {
      control: false
    }
  },
  render: function Render({
    children: _children,
    ...args
  }) {
    return <div style={{
      height: 250,
      overflow: 'auto',
      border: '1px solid #ccc',
      padding: '60px 2rem'
    }}>
                <Popover.Root {...args}>
                    <Popover.Trigger>Show Content</Popover.Trigger>
                    <Popover.Popup positioner={<Popover.Positioner side="bottom" />} style={{
          maxHeight: 'var(--available-height, 300px)',
          maxWidth: 'var(--available-width, 300px)'
        }}>
                        <div style={{
            overflow: 'auto',
            height: '100%'
          }}>
                            <Popover.Title style={{
              marginBottom: 'var(--wpds-dimension-gap-xs)'
            }}>
                                Constrained
                            </Popover.Title>
                            <Popover.Description>
                                This popup constrains its size using the
                                \`--available-height\` and \`--available-width\` CSS
                                variables exposed by the positioner.
                            </Popover.Description>
                            <div style={{
              height: 400
            }}>
                                <p>
                                    Scroll inside this popup — its max-height is
                                    capped to the available viewport space.
                                </p>
                            </div>
                        </div>
                    </Popover.Popup>
                </Popover.Root>
                <div style={{
        height: 600
      }} />
            </div>;
  }
}`,...q.parameters?.docs?.source},description:{story:"`Popover.Positioner` exposes `--available-height` and `--available-width`\nCSS variables representing the space between the anchor and the viewport\nedge. These cascade down to `Popover.Popup`, where applying them as\n`max-height` / `max-width` via the `style` prop constrains the popup size.\nThen add `overflow: auto` on an inner wrapper so scrolling happens inside\nthe popup content area — this replaces the legacy Popover's `resize` prop.\n\nOpen the popover and resize or scroll the container to see the popup shrink\nto fit.",...q.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: 'onOpenChange Details',
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render() {
    const [log, setLog] = useState<string[]>([]);
    return <div style={{
      display: 'flex',
      gap: '2rem'
    }}>
                <Popover.Root onOpenChange={(nextOpen, eventDetails) => {
        setLog(prev => [...prev.slice(-9), \`open=\${nextOpen} reason=\${eventDetails.reason}\`]);
      }}>
                    <Popover.Trigger>Toggle</Popover.Trigger>
                    <Popover.Popup>
                        <Popover.Arrow />
                        <Popover.Title style={{
            marginBottom: 'var(--wpds-dimension-gap-xs)'
          }}>
                            Event Log
                        </Popover.Title>
                        <Popover.Description>
                            Dismiss this popover via Escape, click-outside, or
                            moving focus away.
                        </Popover.Description>
                    </Popover.Popup>
                </Popover.Root>

                <pre style={{
        flex: 1,
        padding: 8,
        fontSize: 12,
        lineHeight: 1.5,
        background: '#f5f5f5',
        borderRadius: 4,
        minHeight: 100,
        margin: 0
      }}>
                    {log.length ? log.join('\\n') : 'Interact with the popover to see events…'}
                </pre>
            </div>;
  }
}`,...J.parameters?.docs?.source},description:{story:"The `onOpenChange` callback on `Popover.Root` receives an `eventDetails`\nobject with a `reason` field that describes why the popover is\nopening/closing. This replaces the legacy Popover's separate `onClose` and\n`onFocusOutside` callbacks:\n\n- `reason === 'escape-key'` — user pressed Escape (was `onClose`)\n- `reason === 'outside-press'` — user clicked outside (was `onClose`)\n- `reason === 'focus-out'` — focus moved outside (was `onFocusOutside`)\n\nOpen the popover, then dismiss it in different ways to see the logged reason.",...J.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render() {
    const emailRef = useRef<HTMLInputElement>(null);
    const nameId = useId();
    const emailId = useId();
    return <Popover.Root>
                <Popover.Trigger>Open Form</Popover.Trigger>
                <Popover.Popup initialFocus={emailRef}>
                    <Popover.Arrow />
                    <Popover.Title style={{
          marginBottom: 'var(--wpds-dimension-gap-xs)'
        }}>
                        Contact
                    </Popover.Title>
                    <form style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--wpds-dimension-gap-sm)'
        }} onSubmit={e => e.preventDefault()}>
                        <label htmlFor={nameId} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--wpds-dimension-gap-xs)',
            fontSize: 'inherit'
          }}>
                            Name
                        </label>
                        <input id={nameId} type="text" placeholder="Enter name" />

                        <label htmlFor={emailId} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--wpds-dimension-gap-xs)',
            fontSize: 'inherit'
          }}>
                            Email (auto-focused)
                        </label>
                        <input id={emailId} ref={emailRef} type="email" placeholder="Enter email" />
                    </form>
                </Popover.Popup>
            </Popover.Root>;
  }
}`,...Y.parameters?.docs?.source},description:{story:"Pass a ref to `initialFocus` on `Popover.Popup` to focus a specific element\nwhen the popover opens. This replaces the legacy Popover's `focusOnMount`\nprop.\n\nIn this example, the Email field receives focus instead of the first\nfocusable element (Name).",...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  argTypes: {
    modal: {
      control: false
    }
  },
  args: {
    modal: 'trap-focus' as const
  },
  render: function Render(args) {
    return <div style={{
      display: 'flex',
      gap: '2rem'
    }}>
                <Popover.Root {...args}>
                    <Popover.Trigger>Open</Popover.Trigger>
                    <Popover.Popup>
                        <Popover.Arrow />
                        <Popover.Title style={{
            marginBottom: 'var(--wpds-dimension-gap-xs)'
          }}>
                            Trap Focus
                        </Popover.Title>
                        <Popover.Description>
                            Tab cycles within this popover, but clicking outside
                            still works.
                        </Popover.Description>
                        <div style={{
            display: 'flex',
            gap: 'var(--wpds-dimension-gap-sm)',
            marginTop: 'var(--wpds-dimension-gap-sm)'
          }}>
                            <input placeholder="Field A" />
                            <input placeholder="Field B" />
                            <Popover.Close>Close</Popover.Close>
                        </div>
                    </Popover.Popup>
                </Popover.Root>

                <button type="button" onClick={() =>
      // eslint-disable-next-line no-alert
      window.alert('Outside button clicked!')}>
                    Outside button
                </button>
            </div>;
  }
}`,...X.parameters?.docs?.source},description:{story:`Set \`modal="trap-focus"\` on \`Popover.Root\` to trap keyboard focus inside the
popover without making it fully modal. Unlike \`modal={true}\`, this mode:

- Traps Tab/Shift+Tab cycling within the popover
- Does **not** lock page scroll
- Does **not** block pointer interaction outside

A \`Popover.Close\` part must be rendered inside the popup so that screen
readers can escape. It can be visually hidden if not needed visually.

This replaces the legacy Popover's \`constrainTabbing\` prop. Try tabbing
through the fields — focus stays inside — then click the button outside
to verify that pointer interaction still works.`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render(args) {
    return <Popover.Root {...args}>
                <Popover.Trigger openOnHover delay={200} closeDelay={150}>
                    Hover me
                </Popover.Trigger>
                <Popover.Popup>
                    <Popover.Arrow />
                    <Popover.Title style={{
          marginBottom: 'var(--wpds-dimension-gap-xs)'
        }}>
                        Hover Popover
                    </Popover.Title>
                    <Popover.Description>
                        This popover opens on hover with a 200ms delay and
                        closes 150ms after the pointer leaves.
                    </Popover.Description>
                </Popover.Popup>
            </Popover.Root>;
  }
}`,...Z.parameters?.docs?.source},description:{story:"Set `openOnHover` on `Popover.Trigger` to open the popover when the trigger\nis hovered. The `delay` and `closeDelay` props control the timing (in ms).\n\nThis is a capability the legacy Popover does not have natively — consumers\nwould need to wire up `mouseenter`/`mouseleave` handlers manually.",...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render(args) {
    return <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--wpds-dimension-gap-xs)'
    }}>
                <span>Label</span>
                <Popover.Root {...args}>
                    <Popover.Trigger openOnHover delay={200} closeDelay={200} aria-label="More information" style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'var(--wpds-cursor-control)',
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 'var(--wpds-border-radius-sm)'
        }}>
                        <Icon icon={help} size={20} />
                    </Popover.Trigger>
                    <Popover.Popup>
                        <Popover.Arrow />
                        <VisuallyHidden render={<Popover.Title />}>
                            More information
                        </VisuallyHidden>
                        <Popover.Description>
                            This is additional context about the label. Unlike
                            tooltips, this content is accessible to touch and
                            screen reader users.
                        </Popover.Description>
                    </Popover.Popup>
                </Popover.Root>
            </div>;
  }
}`,...Q.parameters?.docs?.source},description:{story:`Popups that open when hovering a help icon should use Popover with the
\`openOnHover\` prop on the trigger instead of a
[tooltip](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-tooltip--docs).
This way, touch users and screen reader users can access the content.

To know when to reach for a popover instead of a tooltip, consider the
purpose of the trigger element: If the trigger's purpose is to open the
popup itself, it's a popover. If the trigger's purpose is unrelated to
opening the popup, it's a tooltip.`,...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  parameters: {
    controls: {
      disable: true
    }
  },
  render: function Render(args) {
    return <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--wpds-dimension-gap-xs)'
    }}>
                <span>Label</span>
                <Popover.Root {...args}>
                    <Popover.Trigger openOnHover delay={200} closeDelay={200} aria-label="More information" style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'var(--wpds-cursor-control)',
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 'var(--wpds-border-radius-sm)'
        }}>
                        <Icon icon={help} size={20} />
                    </Popover.Trigger>
                    <Popover.Popup>
                        <Popover.Arrow />
                        <VisuallyHidden render={<Popover.Title />}>
                            More information
                        </VisuallyHidden>
                        <Popover.Description>
                            This is additional context about the label.{' '}
                            <Link href="https://wordpress.org" openInNewTab>
                                Read more
                            </Link>
                        </Popover.Description>
                    </Popover.Popup>
                </Popover.Root>
            </div>;
  }
}`,...$.parameters?.docs?.source},description:{story:`An infotip popup can contain interactive content, such as a \`Link\`. The
popup stays open while the pointer moves from the trigger onto the popup
itself, so the link stays reachable — satisfying the "hoverable"
requirement of
[WCAG 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html).
The link is also reachable by tabbing to it, since the trigger opens on
focus as well as hover.`,...$.parameters?.docs?.description}}}})))()}init_index_story();export{G as Anchor,H as CollisionAvoidance,L as Controlled,U as CrossIframe,N as Default,Z as HoverTrigger,Q as Infotip,$ as InfotipWithLink,Y as InitialFocus,V as Inline,R as Modal,P as NoArrow,J as OnOpenChangeDetails,B as OverlayPlacement,F as Positioning,K as ToolbarVariant,X as TrapFocus,z as Unstyled,q as ViewportConstrainedSize,I as WithCloseButton,W as WithCustomZIndex,M as default};