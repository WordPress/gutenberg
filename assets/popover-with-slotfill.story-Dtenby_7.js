import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./react-platform-CdCCcmsi.js";import{i as o,n as s,r as c,t as l}from"./description-rC-YTBHU.js";import{a as u,c as d,d as f,f as p,i as m,l as h,n as g,o as _,r as v,s as y,t as b,u as x}from"./trigger-4byMO5kv.js";import{i as S,n as C,t as w}from"./slot-fill-CTuXjfUg.js";function IframePortal({children:e,iframeRef:t,...n}){let[i,o]=(0,r.useState)(null);return(0,T.jsx)(`iframe`,{title:`Iframe`,...n,ref:t,srcDoc:`<!doctype html><html><body></body></html>`,onLoad:e=>{o(e.currentTarget.contentDocument?.body??null)},children:i&&a(e,i)})}var T,E,D;function init_popover_with_slotfill_story(){return(init_popover_with_slotfill_story=e((()=>{i(),n(),S(),_(),g(),d(),p(),x(),o(),m(),s(),T=t(),E={title:`Playground/Debug fixtures/Popover with SlotFill`,component:u},D={args:{defaultOpen:!0},argTypes:{defaultOpen:{control:!1}},render:function Render({children:e,...t}){let[n,i]=(0,r.useState)(null),[a,o]=(0,r.useState)(null);return(0,T.jsxs)(w,{children:[(0,T.jsx)(C,{name:`popover-container`,bubblesVirtually:!0,ref:i}),(0,T.jsx)(IframePortal,{iframeRef:o,style:{width:`100%`,height:400,border:0,outline:`1px solid purple`},children:(0,T.jsx)(`div`,{style:{height:`200vh`,paddingTop:`10vh`},children:(0,T.jsx)(`div`,{style:{maxWidth:200,marginTop:100,marginInline:`auto`},children:(0,T.jsxs)(u,{...t,children:[(0,T.jsx)(b,{style:{padding:8,background:`salmon`},children:`Popover's anchor (inside iframe)`}),(0,T.jsxs)(y,{portal:(0,T.jsx)(f,{container:n??void 0}),positioner:(0,T.jsx)(h,{collisionBoundary:a??void 0}),children:[(0,T.jsx)(c,{}),(0,T.jsx)(v,{style:{marginBottom:`var(--wpds-dimension-gap-xs, 4px)`},children:`Cross-Iframe (SlotFill)`}),(0,T.jsx)(l,{children:"This popup renders in the parent document via a `Slot` from `@wordpress/components`."})]})]})})})})]})}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
    const [slotNode, setSlotNode] = useState(null);
    const [iframeBoundary, setIframeBoundary] = useState(null);
    return <SlotFillProvider>
                <Slot name="popover-container" bubblesVirtually ref={setSlotNode} />
                <IframePortal iframeRef={setIframeBoundary} style={{
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
                                <Popover.Popup portal={<Popover.Portal container={slotNode ?? undefined} />} positioner={<Popover.Positioner collisionBoundary={iframeBoundary ?? undefined} />}>
                                    <Popover.Arrow />
                                    <Popover.Title style={{
                  marginBottom: 'var(--wpds-dimension-gap-xs)'
                }}>
                                        Cross-Iframe (SlotFill)
                                    </Popover.Title>
                                    <Popover.Description>
                                        This popup renders in the parent
                                        document via a \`Slot\` from
                                        \`@wordpress/components\`.
                                    </Popover.Description>
                                </Popover.Popup>
                            </Popover.Root>
                        </div>
                    </div>
                </IframePortal>
            </SlotFillProvider>;
  }
}`,...D.parameters?.docs?.source}}}})))()}init_popover_with_slotfill_story();export{D as CrossIframeWithSlotFill,E as default};