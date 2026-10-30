import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./use-ref-effect-CLpda56c.js";import{n as ee,t as s}from"./use-merge-refs-BNmiIksj.js";import{n as c,t as l}from"./build-module-CqL0UdL5.js";import{a as u,i as d}from"./iframe-BbJPeSVw.js";import{A as f,m as p,n as m,yc as te}from"./build-module-DttIWYbV.js";import{n as ne,t as h}from"./button-lq-dgQsp.js";import{n as re,t as ie}from"./visually-hidden-BD0tKS3_.js";import{n as ae,t as oe}from"./icon-button-DGP9SuUN.js";import{n as g,t as _}from"./stack-CzK5c0hq.js";import{a as v,c as y,i as se,l as b,n as x,o as S,r as C,s as w,t as T,u as E}from"./action-button-BU8d6N9s.js";import{i as D,n as O,r as k,t as A}from"./action-link-jsToDzbR.js";function isHidden(e,t){for(let n=e;n;n=n.parentElement){if(n.matches(P))return!0;if(n===t)break}return!1}function readMessage(e){function readText(t){return Array.from(e.querySelectorAll(`.${E[t]}`)).filter(t=>t.closest(N)===e&&!isHidden(t,e)).map(t=>{let n=t.ownerDocument.createTreeWalker(t,NodeFilter.SHOW_TEXT,{acceptNode(t){return t.parentElement&&isHidden(t.parentElement,e)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),r=``;for(;n.nextNode();)r+=n.currentNode.textContent;return r.trim()}).filter(Boolean).join(` `)}let t=readText(`title`);return[t,readText(`description`)].filter(Boolean).join(/\p{Sentence_Terminal}$/u.test(t)?` `:`. `)}var j,M,N,P,F;function init_list(){return(init_list=e((()=>{s(),o(),r(),g(),re(),b(),j=n(),M=`[data-wp-ui-notice-list]`,N=`.${E.notice}, .${E.actions}, ${M}`,P=`[hidden], [aria-hidden="true"]`,F=(0,i.forwardRef)(function NoticeList({children:e,...t},n){let[r,o]=(0,i.useState)(new Map),s=a(e=>{let t=0,n=new Map,readNotices=()=>new Map(Array.from(e.querySelectorAll(`.${E.notice}`)).filter(t=>t.closest(M)===e&&!isHidden(t,e)).map(e=>[e,{id:n.get(e)?.id??t++,message:e.dataset.wpUiNoticeSpokenMessage??readMessage(e),politeness:e.dataset.wpUiNoticePoliteness}]));n=readNotices(),o(e=>e.size?new Map:e);let r=new MutationObserver(()=>{let e=readNotices(),t=new Map;for(let[r,i]of e){let e=n.get(r);i.message&&i.politeness!==`off`&&(i.message!==e?.message||i.politeness!==e?.politeness)&&t.set(r,i)}n=e,o(n=>{let r=new Map(n);for(let t of n.keys()){let n=e.get(t);n?.message&&n.politeness!==`off`||r.delete(t)}for(let[e,n]of t)r.set(e,n);return t.size||r.size!==n.size?r:n})});return r.observe(e,{childList:!0,characterData:!0,subtree:!0,attributeFilter:[`hidden`,`aria-hidden`,`data-wp-ui-notice-politeness`,`data-wp-ui-notice-spoken-message`]}),()=>r.disconnect()},[]),c=ee([n,s]);return(0,j.jsxs)(_,{ref:c,direction:`column`,gap:`sm`,...t,"data-wp-ui-notice-list":``,children:[(0,j.jsx)(j.Fragment,{children:e}),[`polite`,`assertive`].map(e=>(0,j.jsx)(ie,{role:e===`polite`?`status`:`alert`,"aria-atomic":!1,"aria-relevant":`additions text`,children:Array.from(r.values(),t=>t.politeness===e?(0,j.jsx)(`div`,{"aria-atomic":`true`,children:t.message},t.id):null)},e))]})});try{F.__docgenInfo={description:`Stacks notices and announces their added or changed messages. Mount the list
before adding notices. Initial notices are silent. Removing a notice does not
announce it. Set \`politeness="off"\` on notices that receive focus to avoid
duplicate announcements.`,displayName:`List`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/list.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`ListProps`}],description:`Notices to display. Keep the list mounted when there are no notices.`,name:`children`,parent:{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`ListProps`},required:!1,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var I,L;function init_close_icon_button(){return(init_close_icon_button=e((()=>{r(),l(),m(),u(),ae(),b(),I=n(),L=(0,i.forwardRef)(function NoticeCloseIconButton({className:e,icon:t=te,label:n=c(`Dismiss`),...r},i){return(0,I.jsx)(oe,{...r,ref:i,className:d(E[`close-icon`],e),variant:`minimal`,size:`small`,tone:`neutral`,icon:t,label:n})});try{L.__docgenInfo={description:`The close button for a notice. Renders an icon button with a close icon.`,displayName:`CloseIconButton`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/close-icon-button.tsx`,methods:[],props:{label:{defaultValue:{value:`__( 'Dismiss' )`},declarations:[{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`}],description:`A label describing the button's action, shown as a tooltip and to
assistive technology.`,name:`label`,parent:{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`},required:!1,tags:{},type:{name:`string`}},icon:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`}],description:`The icon to display in the button.`,name:`icon`,parent:{fileName:`gutenberg/packages/ui/src/notice/types.ts`,name:`CloseIconButtonProps`},required:!1,tags:{},type:{name:`ReactElement<SVGProps<SVGSVGElement>, string | JSXElementConstructor<any>>`}},disabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`}],description:`Whether the button is disabled.`,name:`disabled`,parent:{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`},required:!1,tags:{},type:{name:`boolean`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},"aria-pressed":{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`}],description:`Indicates the current "pressed" state of toggle buttons. This should only
be used with neutral minimal buttons.`,name:`aria-pressed`,parent:{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`},required:!1,tags:{},type:{name:`boolean | "true" | "false" | "mixed"`}},nativeButton:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NativeButtonProps`}],description:"Whether the component renders a native `<button>` element when replacing it\nvia the `render` prop.\nSet to `false` if the rendered element is not a button (for example, `<div>`).",name:`nativeButton`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NativeButtonProps`},required:!1,tags:{},type:{name:`boolean`}},shortcut:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/icon-button/types.ts`,name:`TypeLiteral`}],description:`The keyboard shortcut associated with this button. When provided, the
shortcut is displayed in the tooltip and announced to assistive technology.

**Note**: This prop is for display and accessibility purposes only — the
consumer is responsible for registering the keyboard shortcut and keeping
its handler synchronized with the button's disabled state.`,name:`shortcut`,required:!1,tags:{},type:{name:`KeyboardShortcut`}},focusableWhenDisabled:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`}],description:`Whether the element should be focusable even when it is disabled.`,name:`focusableWhenDisabled`,parent:{fileName:`gutenberg/packages/ui/src/button/types.ts`,name:`ButtonProps`},required:!1,tags:{},type:{name:`boolean`}},positioner:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/icon-button/types.ts`,name:`TypeLiteral`}],description:"Customize how the tooltip is positioned relative to the button. Accepts\na `<Tooltip.Positioner />` element with custom positioning props\n(`side`, `align`, `sideOffset`, collision settings, etc.). When omitted,\nthe tooltip uses the default placement.",name:`positioner`,required:!1,tags:{},type:{name:`ReactElement<Omit<PositionerProps, "children">, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}var R=t({CustomIcon:()=>Z,Default:()=>V,DescriptionOnly:()=>X,DynamicNotices:()=>$,Error:()=>G,Info:()=>H,NonDismissible:()=>K,Success:()=>W,Tip:()=>Q,TitleOnly:()=>Y,Warning:()=>U,WithoutActions:()=>J,WithoutIcon:()=>q,default:()=>B}),z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{m(),r(),ne(),g(),y(),init_list(),D(),S(),se(),init_close_icon_button(),x(),O(),z=n(),B={title:`Components/@wordpress-ui/Notice`,id:`design-system-components-notice`,component:w,tags:[`manifest`],subcomponents:{"Notice.List":F,"Notice.Title":k,"Notice.Description":v,"Notice.Actions":C,"Notice.CloseIconButton":L,"Notice.ActionButton":T,"Notice.ActionLink":A},parameters:{docs:{description:{component:`Use Notice.List for announcements of dynamic notices. Standalone notices stay silent. See [Notice announcements](?path=/docs/design-system-components-notice-announcements--docs) for examples and migration guidance. See [Notice with disclosed details](?path=/docs/design-system-components-notice-disclosure--docs) for a composition with native details and a copy button.`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},V={args:{children:[(0,z.jsx)(k,{children:`Notice Title`},`title`),(0,z.jsx)(v,{children:`Description text with details about this notification.`},`description`),(0,z.jsxs)(C,{children:[(0,z.jsx)(T,{children:`Primary button`}),(0,z.jsx)(T,{variant:`outline`,children:`Secondary button`}),(0,z.jsx)(A,{href:`#`,children:`Link`})]},`actions`),(0,z.jsx)(L,{},`closeIconButton`)]}},H={...V,args:{...V.args,intent:`info`}},U={...V,args:{...V.args,intent:`warning`}},W={...V,args:{...V.args,intent:`success`}},G={...V,args:{...V.args,intent:`error`}},K={args:{intent:`warning`,children:[(0,z.jsx)(k,{children:`Action Required`},`title`),(0,z.jsx)(v,{children:`This notice cannot be dismissed by the user.`},`description`),(0,z.jsxs)(C,{children:[(0,z.jsx)(T,{children:`Take Action`}),(0,z.jsx)(A,{href:`#`,children:`Visit link`})]},`actions`)]}},q={args:{intent:`info`,icon:null,children:[(0,z.jsx)(k,{children:`No Icon`},`title`),(0,z.jsx)(v,{children:`This notice has no decorative icon displayed.`},`description`),(0,z.jsx)(L,{},`closeIconButton`)]}},J={args:{intent:`info`,children:[(0,z.jsx)(k,{children:`Simple Notice`},`title`),(0,z.jsx)(v,{children:`A dismissable notice without any action buttons or links.`},`description`),(0,z.jsx)(L,{},`closeIconButton`)]}},Y={args:{children:[(0,z.jsx)(k,{children:`Just a title`},`title`),(0,z.jsx)(L,{},`closeIconButton`)]}},X={args:{intent:`info`,children:[(0,z.jsx)(v,{children:`Just a description without title or actions.`},`description`),(0,z.jsx)(L,{},`closeIconButton`)]}},Z={args:{intent:`info`,icon:p,children:[(0,z.jsx)(v,{children:`Parent block is hidden on Desktop`},`description`)]}},Q={args:{intent:`info`,icon:f,children:[(0,z.jsxs)(v,{children:[`While writing, you can press `,(0,z.jsx)(`kbd`,{children:`/`}),` to quickly insert new blocks.`]},`description`)]}},$={args:{className:``,style:{}},argTypes:{className:{control:`text`},style:{control:`object`}},parameters:{controls:{include:[`className`,`style`]}},render:function DynamicNoticesExample(e){let[t,n]=(0,i.useState)([{id:0,intent:`success`,description:`This notice was present when the list mounted.`}]),[r,a]=(0,i.useState)(1);function addNotice(e){n(t=>[...t,{id:r,intent:e?`error`:`success`,description:e?`The connection was lost. Check your connection and try again.`:`Your draft has been saved.`,politeness:e?`assertive`:`polite`}]),a(e=>e+1)}return(0,z.jsxs)(_,{direction:`column`,gap:`md`,children:[(0,z.jsxs)(_,{gap:`sm`,wrap:`wrap`,children:[(0,z.jsx)(h,{onClick:()=>addNotice(!1),children:`Save draft`}),(0,z.jsx)(h,{onClick:()=>addNotice(!0),children:`Simulate failed save`}),(0,z.jsx)(h,{disabled:!t.length,onClick:()=>n(e=>e.map((t,n)=>n===e.length-1?{...t,spokenMessage:`The latest notice has been updated.`,description:`The latest notice has been updated.`}:t)),children:`Update latest notice`})]}),(0,z.jsx)(F,{...e,children:t.map(e=>(0,z.jsxs)(w,{intent:e.intent,politeness:e.politeness,spokenMessage:e.spokenMessage,children:[(0,z.jsx)(k,{children:e.intent===`error`?`Changes not saved`:`Draft saved`}),(0,z.jsx)(v,{children:e.description}),(0,z.jsx)(C,{children:(0,z.jsx)(T,{onClick:()=>addNotice(!1),children:`Save again`})}),(0,z.jsx)(L,{onClick:()=>n(t=>t.filter(t=>t.id!==e.id))})]},e.id))})]})}};try{K.__docgenInfo={description:`Omit Notice.CloseIconButton to make the notice non-dismissable.`,displayName:`NonDismissible`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{q.__docgenInfo={description:"Pass `icon={ null }` to hide the default decorative icon.",displayName:`WithoutIcon`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:`Title only, no description or actions.`,displayName:`TitleOnly`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:`Description only, no title or actions.`,displayName:`DescriptionOnly`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Pass a custom icon via the `icon` prop to override the default intent icon.",displayName:`CustomIcon`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:`Use an info notice with the tip icon for contextual guidance.`,displayName:`Tip`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'info'
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'warning'
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'success'
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    intent: 'error'
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'warning',
    children: [<Notice.Title key="title">Action Required</Notice.Title>, <Notice.Description key="description">
                This notice cannot be dismissed by the user.
            </Notice.Description>, <Notice.Actions key="actions">
                <Notice.ActionButton>Take Action</Notice.ActionButton>
                <Notice.ActionLink href="#">Visit link</Notice.ActionLink>
            </Notice.Actions>]
  }
}`,...K.parameters?.docs?.source},description:{story:`Omit Notice.CloseIconButton to make the notice non-dismissable.`,...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    icon: null,
    children: [<Notice.Title key="title">No Icon</Notice.Title>, <Notice.Description key="description">
                This notice has no decorative icon displayed.
            </Notice.Description>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...q.parameters?.docs?.source},description:{story:"Pass `icon={ null }` to hide the default decorative icon.",...q.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    intent: 'info',
    children: [<Notice.Title key="title">Simple Notice</Notice.Title>, <Notice.Description key="description">
                A dismissable notice without any action buttons or links.
            </Notice.Description>, <Notice.CloseIconButton key="closeIconButton" />]
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...$.parameters?.docs?.source}}}})))()}export{R as n,init_index_story as r,$ as t};