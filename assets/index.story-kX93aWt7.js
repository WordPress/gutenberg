import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{r as a,t as o}from"./react-platform-CdCCcmsi.js";import{n as s,t as c}from"./use-ref-effect-CLpda56c.js";import{n as ee,t as l}from"./use-merge-refs-BNmiIksj.js";import{n as te,t as u}from"./use-event-Cr6_a9Gc.js";import{n as d,t as f}from"./build-module-CqL0UdL5.js";import{a as p,i as m}from"./iframe-tpt13bDd.js";import{A as ne,hc as re,m as ie,n as h}from"./build-module-D7uZ1UZL.js";import{n as ae,t as g}from"./button-CNY-hyal.js";import{n as _,t as oe}from"./visually-hidden-BD0tKS3_.js";import{n as se,t as ce}from"./icon-button-DGWQ3nE8.js";import{n as v,t as y}from"./stack-ieiW-ao9.js";import{n as b,t as le}from"./link-BeMvEHOC.js";import{a as x,c as S,i as ue,l as C,n as de,o as fe,r as w,s as T,t as E,u as D}from"./action-button-DOd8bTtM.js";import{i as pe,n as me,r as O,t as k}from"./action-link-B7BpA2bg.js";function getComposedParent(e){let t=e.ownerDocument.defaultView?.ShadowRoot;return e.assignedSlot??e.parentElement??(t&&e.parentNode instanceof t?e.parentNode.host:null)}function isHidden(e,t){for(let n=e;n;n=n.parentElement){if(n.matches(N))return!0;if(n===t)break}return!1}function readMessage(e){function readText(t){return Array.from(e.querySelectorAll(`.${D[t]}`)).filter(t=>t.closest(M)===e&&!isHidden(t,e)).map(t=>{let n=t.ownerDocument.createTreeWalker(t,NodeFilter.SHOW_TEXT,{acceptNode(t){return t.parentElement&&isHidden(t.parentElement,e)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),r=``;for(;n.nextNode();)r+=n.currentNode.textContent;return r.trim()}).filter(Boolean).join(` `)}let t=readText(`title`);return[t,readText(`description`)].filter(Boolean).join(/\p{Sentence_Terminal}$/u.test(t)?` `:`. `)}var A,j,M,N,P;function init_list(){return(init_list=e((()=>{u(),l(),c(),a(),r(),v(),_(),C(),A=n(),j=`[data-wp-ui-notice-list]`,M=`.${D.notice}, .${D.actions}, ${j}`,N=`[hidden], [aria-hidden="true"]`,P=(0,i.forwardRef)(function NoticeList({children:e,liveRegionContainer:t,...n},r){let[a,c]=(0,i.useState)(new Map),l=(0,i.useRef)(void 0),u=te((e,n)=>{if(!t)return isHidden(e,n)?`hidden`:`visible`;let r=e.dataset.wpUiNoticeSpokenMessage===void 0?N:`[hidden]`;for(let t=e;t;t=getComposedParent(t))if(t.matches(r))return t!==n&&n.contains(t)?`hidden`:`list-hidden`;return`visible`}),d=s(e=>{let t=0,n=new Map,readNotices=()=>{let r=new Map;for(let i of e.querySelectorAll(`.${D.notice}`)){if(i.closest(j)!==e)continue;let a=u(i,e);a!==`hidden`&&r.set(i,{id:n.get(i)?.id??t++,message:i.dataset.wpUiNoticeSpokenMessage??readMessage(i),politeness:i.dataset.wpUiNoticePoliteness,listHidden:a===`list-hidden`})}return r};n=readNotices(),c(e=>e.size?new Map:e);let refresh=()=>{let e=readNotices(),t=new Map;for(let[r,i]of e){let e=n.get(r);i.message&&!i.listHidden&&i.politeness!==`off`&&(i.message!==e?.message||i.politeness!==e?.politeness)&&t.set(r,i)}n=e,c(n=>{let r=new Map(n);for(let t of n.keys()){let n=e.get(t);(!n?.message||n.listHidden||n.politeness===`off`)&&r.delete(t)}for(let[e,n]of t)r.set(e,n);return t.size||r.size!==n.size?r:n})};l.current=refresh;let r=new MutationObserver(refresh);return r.observe(e,{childList:!0,characterData:!0,subtree:!0,attributeFilter:[`hidden`,`aria-hidden`,`data-wp-ui-notice-politeness`,`data-wp-ui-notice-spoken-message`]}),()=>{r.disconnect(),l.current=void 0}},[u]),f=s(e=>{let t=new MutationObserver(()=>l.current?.());for(let n=getComposedParent(e);n;n=getComposedParent(n))t.observe(n,{attributeFilter:[`hidden`,`aria-hidden`]});return()=>t.disconnect()},[]),p=ee([r,d,t?f:null]),m=(0,A.jsx)(oe,{"aria-live":t?`off`:void 0,children:[`polite`,`assertive`].map(e=>(0,A.jsx)(`div`,{role:e===`polite`?`status`:`alert`,"aria-atomic":!1,"aria-relevant":`additions text`,children:Array.from(a.values(),t=>t.politeness===e?(0,A.jsx)(`div`,{"aria-atomic":`true`,children:t.message},t.id):null)},e))});return(0,A.jsxs)(y,{ref:p,direction:`column`,gap:`sm`,...n,"data-wp-ui-notice-list":``,children:[(0,A.jsx)(A.Fragment,{children:e}),t?o(m,t):m]})});try{P.__docgenInfo={description:`Stacks notices and announces their added or changed messages. Mount the list
before adding notices. Initial notices are silent. Removing a notice does not
announce it. Set \`politeness="off"\` on notices that receive focus to avoid
duplicate announcements.`,displayName:`List`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/list.tsx`,methods:[],props:{liveRegionContainer:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`ListProps`}],description:`Where to render the live regions. Defaults to the list itself. Use a
container outside the app, such as its document body, for notifications
that should still be announced when a modal hides the app. An explicit
spokenMessage can announce through aria-hidden ancestors. Notices inside
an HTML hidden subtree and notices with politeness="off" stay silent.`,name:`liveRegionContainer`,parent:{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`ListProps`},required:!1,tags:{},type:{name:`HTMLElement | null`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`ListProps`}],description:`Notices to display. Keep the list mounted when there are no notices.`,name:`children`,parent:{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`ListProps`},required:!1,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var F,I;function init_close_icon_button(){return(init_close_icon_button=e((()=>{r(),f(),h(),p(),se(),C(),F=n(),I=(0,i.forwardRef)(function NoticeCloseIconButton({className:e,icon:t=re,label:n=d(`Dismiss`),...r},i){return(0,F.jsx)(ce,{...r,ref:i,className:m(D[`close-icon`],e),variant:`minimal`,size:`small`,tone:`neutral`,icon:t,label:n})});try{I.__docgenInfo={description:`The close button for a notice. Renders an icon button with a close icon.`,displayName:`CloseIconButton`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/close-icon-button.tsx`,methods:[],props:{label:{defaultValue:{value:`__( 'Dismiss' )`},declarations:[{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`}],description:`A label describing the button's action, shown as a tooltip and to
assistive technology.`,name:`label`,parent:{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`},required:!1,tags:{},type:{name:`string`}},icon:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`}],description:`The icon to display in the button.`,name:`icon`,parent:{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`},required:!1,tags:{},type:{name:`ReactElement<SVGProps<SVGSVGElement>, string | JSXElementConstructor<any>>`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},"aria-pressed":{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`}],description:`Indicates the current "pressed" state of toggle buttons. This should only
be used with neutral minimal buttons.`,name:`aria-pressed`,parent:{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`},required:!1,tags:{},type:{name:`boolean | "false" | "true" | "mixed"`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`}],description:`Whether the button is disabled.`,name:`disabled`,parent:{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`},required:!1,tags:{},type:{name:`boolean`}},shortcut:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/icon-button/types.ts`,name:`TypeLiteral`}],description:`The keyboard shortcut associated with this button. When provided, the
shortcut is displayed in the tooltip and announced to assistive technology.

**Note**: This prop is for display and accessibility purposes only — the
consumer is responsible for registering the keyboard shortcut and keeping
its handler synchronized with the button's disabled state.`,name:`shortcut`,required:!1,tags:{},type:{name:`KeyboardShortcut`}},focusableWhenDisabled:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`}],description:`Whether the element should be focusable even when it is disabled.`,name:`focusableWhenDisabled`,parent:{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`},required:!1,tags:{},type:{name:`boolean`}},nativeButton:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NativeButtonProps`}],description:"Whether the component renders a native `<button>` element when replacing it\nvia the `render` prop.\nSet to `false` if the rendered element is not a button (for example, `<div>`).",name:`nativeButton`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NativeButtonProps`},required:!1,tags:{},type:{name:`boolean`}},positioner:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/icon-button/types.ts`,name:`TypeLiteral`}],description:"Customize how the tooltip is positioned relative to the button. Accepts\na `<Tooltip.Positioner />` element with custom positioning props\n(`side`, `align`, `sideOffset`, collision settings, etc.). When omitted,\nthe tooltip uses the default placement.",name:`positioner`,required:!1,tags:{},type:{name:`ReactElement<Omit<PositionerProps, "children">, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var L=t({CustomIcon:()=>Z,Default:()=>B,DescriptionOnly:()=>X,DynamicNotices:()=>$,Error:()=>W,Info:()=>V,NonDismissible:()=>G,Success:()=>U,Tip:()=>Q,TitleOnly:()=>Y,Warning:()=>H,WithLinkInDescription:()=>J,WithoutActions:()=>q,WithoutIcon:()=>K,default:()=>z}),R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{h(),r(),ae(),b(),v(),S(),init_list(),pe(),fe(),ue(),init_close_icon_button(),de(),me(),R=n(),z={title:`Components/@wordpress-ui/Notice`,id:`design-system-components-notice`,component:T,tags:[`manifest`],subcomponents:{"Notice.List":P,"Notice.Title":O,"Notice.Description":x,"Notice.Actions":w,"Notice.CloseIconButton":I,"Notice.ActionButton":E,"Notice.ActionLink":k},parameters:{docs:{description:{component:`Use Notice.List for announcements of dynamic notices. Standalone notices stay silent. See [Notice announcements](?path=/docs/design-system-components-notice-announcements--docs) for examples and migration guidance. See [Notice with disclosed details](?path=/docs/design-system-components-notice-disclosure--docs) for a composition with native details and a copy button.`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},B={args:{children:[(0,R.jsx)(O,{children:`Notice Title`},`title`),(0,R.jsx)(x,{children:`Description text with details about this notification.`},`description`),(0,R.jsxs)(w,{children:[(0,R.jsx)(E,{children:`Primary button`}),(0,R.jsx)(E,{variant:`outline`,children:`Secondary button`}),(0,R.jsx)(k,{href:`#`,children:`Link`})]},`actions`),(0,R.jsx)(I,{},`closeIconButton`)]}},V={...B,args:{...B.args,intent:`info`}},H={...B,args:{...B.args,intent:`warning`}},U={...B,args:{...B.args,intent:`success`}},W={...B,args:{...B.args,intent:`error`}},G={args:{intent:`warning`,children:[(0,R.jsx)(O,{children:`Action Required`},`title`),(0,R.jsx)(x,{children:`This notice cannot be dismissed by the user.`},`description`),(0,R.jsxs)(w,{children:[(0,R.jsx)(E,{children:`Take Action`}),(0,R.jsx)(k,{href:`#`,children:`Visit link`})]},`actions`)]}},K={args:{intent:`info`,icon:null,children:[(0,R.jsx)(O,{children:`No Icon`},`title`),(0,R.jsx)(x,{children:`This notice has no decorative icon displayed.`},`description`),(0,R.jsx)(I,{},`closeIconButton`)]}},q={args:{intent:`info`,children:[(0,R.jsx)(O,{children:`Simple Notice`},`title`),(0,R.jsx)(x,{children:`A dismissable notice without any action buttons or links.`},`description`),(0,R.jsx)(I,{},`closeIconButton`)]}},J={args:{intent:`info`,children:[(0,R.jsx)(O,{children:`Notice Title`},`title`),(0,R.jsxs)(x,{children:[`Description text with a`,` `,(0,R.jsx)(le,{href:`#`,tone:`neutral`,children:`link`}),` `,`and details about this notification.`]},`description`),(0,R.jsx)(I,{},`closeIconButton`)]}},Y={args:{children:[(0,R.jsx)(O,{children:`Just a title`},`title`),(0,R.jsx)(I,{},`closeIconButton`)]}},X={args:{intent:`info`,children:[(0,R.jsx)(x,{children:`Just a description without title or actions.`},`description`),(0,R.jsx)(I,{},`closeIconButton`)]}},Z={args:{intent:`info`,icon:ie,children:[(0,R.jsx)(x,{children:`Parent block is hidden on Desktop`},`description`)]}},Q={args:{intent:`info`,icon:ne,children:[(0,R.jsxs)(x,{children:[`While writing, you can press `,(0,R.jsx)(`kbd`,{children:`/`}),` to quickly insert new blocks.`]},`description`)]}},$={args:{className:``,style:{}},argTypes:{className:{control:`text`},style:{control:`object`}},parameters:{controls:{include:[`className`,`style`]}},render:function DynamicNoticesExample(e){let[t,n]=(0,i.useState)([{id:0,intent:`success`,description:`This notice was present when the list mounted.`}]),[r,a]=(0,i.useState)(1);function addNotice(e){n(t=>[...t,{id:r,intent:e?`error`:`success`,description:e?`The connection was lost. Check your connection and try again.`:`Your draft has been saved.`,politeness:e?`assertive`:`polite`}]),a(e=>e+1)}return(0,R.jsxs)(y,{direction:`column`,gap:`md`,children:[(0,R.jsxs)(y,{gap:`sm`,wrap:`wrap`,children:[(0,R.jsx)(g,{onClick:()=>addNotice(!1),children:`Save draft`}),(0,R.jsx)(g,{onClick:()=>addNotice(!0),children:`Simulate failed save`}),(0,R.jsx)(g,{disabled:!t.length,onClick:()=>n(e=>e.map((t,n)=>n===e.length-1?{...t,spokenMessage:`The latest notice has been updated.`,description:`The latest notice has been updated.`}:t)),children:`Update latest notice`})]}),(0,R.jsx)(P,{...e,children:t.map(e=>(0,R.jsxs)(T,{intent:e.intent,politeness:e.politeness,spokenMessage:e.spokenMessage,children:[(0,R.jsx)(O,{children:e.intent===`error`?`Changes not saved`:`Draft saved`}),(0,R.jsx)(x,{children:e.description}),(0,R.jsx)(w,{children:(0,R.jsx)(E,{onClick:()=>addNotice(!1),children:`Save again`})}),(0,R.jsx)(I,{onClick:()=>n(t=>t.filter(t=>t.id!==e.id))})]},e.id))})]})}};try{G.__docgenInfo={description:`Omit Notice.CloseIconButton to make the notice non-dismissable.`,displayName:`NonDismissible`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{K.__docgenInfo={description:"Pass `icon={ null }` to hide the default decorative icon.",displayName:`WithoutIcon`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{J.__docgenInfo={description:'Use the `Link` component for inline links within the description. Set `tone="neutral"` so links match the styles used for actions and blend with the notice colors.\n\nIt is usually clearer to use the dedicated `Notice.Actions` instead, with `Notice.ActionLink` or `Notice.ActionButton`.',displayName:`WithLinkInDescription`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:`Title only, no description or actions.`,displayName:`TitleOnly`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:`Description only, no title or actions.`,displayName:`DescriptionOnly`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Pass a custom icon via the `icon` prop to override the default intent icon.",displayName:`CustomIcon`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:`Use an info notice with the tip icon for contextual guidance.`,displayName:`Tip`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Notice.Title key="title">Notice Title</Notice.Title>, <Notice.Description key="description">
                Description text with details about this notification.
            </Notice.Description>, <Notice.Actions key="actions">
                <Notice.ActionButton>Primary button</Notice.ActionButton>
                <Notice.ActionButton variant="outline">
                    Secondary button
                </Notice.ActionButton>
                <Notice.ActionLink href="#">Link</Notice.ActionLink>
            </Notice.Actions>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'info'
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'warning'
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'success'
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'error'
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'warning',
    children: [<Notice.Title key="title">Action Required</Notice.Title>, <Notice.Description key="description">
                This notice cannot be dismissed by the user.
            </Notice.Description>, <Notice.Actions key="actions">
                <Notice.ActionButton>Take Action</Notice.ActionButton>
                <Notice.ActionLink href="#">Visit link</Notice.ActionLink>
            </Notice.Actions>]
  }
}`,...G.parameters?.docs?.source},description:{story:`Omit Notice.CloseIconButton to make the notice non-dismissable.`,...G.parameters?.docs?.description}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    icon: null,
    children: [<Notice.Title key="title">No Icon</Notice.Title>, <Notice.Description key="description">
                This notice has no decorative icon displayed.
            </Notice.Description>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...K.parameters?.docs?.source},description:{story:"Pass `icon={ null }` to hide the default decorative icon.",...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    children: [<Notice.Title key="title">Simple Notice</Notice.Title>, <Notice.Description key="description">
                A dismissable notice without any action buttons or links.
            </Notice.Description>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    children: [<Notice.Title key="title">Notice Title</Notice.Title>, <Notice.Description key="description">
                Description text with a{' '}
                <Link href="#" tone="neutral">
                    link
                </Link>{' '}
                and details about this notification.
            </Notice.Description>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...J.parameters?.docs?.source},description:{story:'Use the `Link` component for inline links within the description. Set `tone="neutral"` so links match the styles used for actions and blend with the notice colors.\n\nIt is usually clearer to use the dedicated `Notice.Actions` instead, with `Notice.ActionLink` or `Notice.ActionButton`.',...J.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Notice.Title key="title">Just a title</Notice.Title>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...Y.parameters?.docs?.source},description:{story:`Title only, no description or actions.`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    children: [<Notice.Description key="description">
                Just a description without title or actions.
            </Notice.Description>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...X.parameters?.docs?.source},description:{story:`Description only, no title or actions.`,...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    icon: unseen,
    children: [<Notice.Description key="description">
                Parent block is hidden on Desktop
            </Notice.Description>]
  }
}`,...Z.parameters?.docs?.source},description:{story:"Pass a custom icon via the `icon` prop to override the default intent icon.",...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    icon: tip,
    children: [<Notice.Description key="description">
                While writing, you can press <kbd>/</kbd> to quickly insert new
                blocks.
            </Notice.Description>]
  }
}`,...Q.parameters?.docs?.source},description:{story:`Use an info notice with the tip icon for contextual guidance.`,...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  args: {
    className: '',
    style: {}
  },
  argTypes: {
    className: {
      control: 'text'
    },
    style: {
      control: 'object'
    }
  },
  parameters: {
    controls: {
      include: ['className', 'style']
    }
  },
  render: function DynamicNoticesExample(args) {
    const [messages, setMessages] = useState<Message[]>([{
      id: 0,
      intent: 'success',
      description: 'This notice was present when the list mounted.'
    }]);
    const [nextId, setNextId] = useState(1);
    function addNotice(isUrgent: boolean) {
      setMessages(previous => [...previous, {
        id: nextId,
        intent: isUrgent ? 'error' : 'success',
        description: isUrgent ? 'The connection was lost. Check your connection and try again.' : 'Your draft has been saved.',
        politeness: isUrgent ? 'assertive' : 'polite'
      }]);
      setNextId(previous => previous + 1);
    }
    return <Stack direction="column" gap="md">
                <Stack gap="sm" wrap="wrap">
                    <Button onClick={() => addNotice(false)}>
                        Save draft
                    </Button>
                    <Button onClick={() => addNotice(true)}>
                        Simulate failed save
                    </Button>
                    <Button disabled={!messages.length} onClick={() => setMessages(previous => previous.map((message, index) => index === previous.length - 1 ? {
          ...message,
          spokenMessage: 'The latest notice has been updated.',
          description: 'The latest notice has been updated.'
        } : message))}>
                        Update latest notice
                    </Button>
                </Stack>
                <Notice.List {...args}>
                    {messages.map(message => <Notice.Root key={message.id} intent={message.intent} politeness={message.politeness} spokenMessage={message.spokenMessage}>
                            <Notice.Title>
                                {message.intent === 'error' ? 'Changes not saved' : 'Draft saved'}
                            </Notice.Title>
                            <Notice.Description>
                                {message.description}
                            </Notice.Description>
                            <Notice.Actions>
                                <Notice.ActionButton onClick={() => addNotice(false)}>
                                    Save again
                                </Notice.ActionButton>
                            </Notice.Actions>
                            <Notice.CloseIconButton onClick={() => setMessages(previous => previous.filter(item => item.id !== message.id))} />
                        </Notice.Root>)}
                </Notice.List>
            </Stack>;
  }
}`,...$.parameters?.docs?.source}}}})))()}export{L as n,init_index_story as r,$ as t};