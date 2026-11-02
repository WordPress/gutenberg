import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./DialogDescription-C1deJAtY.js";import{_ as o,a as s,b as c,c as l,d as u,f as d,g as f,h as p,i as m,l as h,m as g,n as _,o as v,p as y,r as b,s as x,t as S,u as C,v as w,y as T}from"./trigger-BTI1-NIA.js";import{n as E,t as D}from"./text-CMRHx_-b.js";import{n as O,t as k}from"./stack-BwmLRIE8.js";var A;function init_DrawerDescription(){return(init_DrawerDescription=e((()=>{i(),A=a})))()}var j,M;function init_description(){return(init_description=e((()=>{init_DrawerDescription(),n(),E(),j=t(),M=(0,r.forwardRef)(function DrawerDescription$1({children:e,...t},n){return(0,j.jsx)(D,{ref:n,variant:`body-md`,render:(0,j.jsx)(A,{...t}),children:e})});try{M.__docgenInfo={description:`Renders an optional paragraph that describes the drawer content.

The rendered element is linked to the popup via \`aria-describedby\`.`,displayName:`Description`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/description.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/drawer/types.ts`,name:`DescriptionProps`}],description:`The description content to be rendered inside the component.`,name:`children`,parent:{fileName:`gutenberg/packages/ui/src/drawer/types.ts`,name:`DescriptionProps`},required:!1,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}}},tags:{}}}catch{}})))()}function SizeSelector({value:e,onChange:t}){let n=(0,r.useId)();return(0,N.jsxs)(`div`,{style:{display:`flex`,gap:8,alignItems:`center`},children:[(0,N.jsx)(`label`,{htmlFor:n,children:`Size`}),(0,N.jsxs)(`select`,{id:n,value:e??``,onChange:e=>t(e.target.value||void 0),children:[(0,N.jsx)(`option`,{value:``,children:`default`}),B.map(e=>(0,N.jsx)(`option`,{value:e,children:e},e))]})]})}function DirectionSelector({value:e,onChange:t}){let n=(0,r.useId)();return(0,N.jsxs)(`div`,{style:{display:`flex`,gap:8,alignItems:`center`},children:[(0,N.jsx)(`label`,{htmlFor:n,children:`Direction`}),(0,N.jsx)(`select`,{id:n,value:e,onChange:e=>t(e.target.value),children:[`left`,`right`,`down`,`up`].map(e=>(0,N.jsx)(`option`,{value:e,children:e},e))})]})}function StickyToggle({stickyHeader:e,stickyFooter:t,setStickyHeader:n,setStickyFooter:i}){let a=(0,r.useId)(),o=(0,r.useId)();return(0,N.jsxs)(k,{direction:`row`,gap:`md`,align:`center`,children:[(0,N.jsxs)(k,{direction:`row`,gap:`xs`,align:`center`,children:[(0,N.jsx)(`input`,{id:a,type:`checkbox`,checked:e,onChange:e=>n(e.target.checked)}),(0,N.jsx)(`label`,{htmlFor:a,children:`Sticky header`})]}),(0,N.jsxs)(k,{direction:`row`,gap:`xs`,align:`center`,children:[(0,N.jsx)(`input`,{id:o,type:`checkbox`,checked:t,onChange:e=>i(e.target.checked)}),(0,N.jsx)(`label`,{htmlFor:o,children:`Sticky footer`})]})]})}function ScrollableControls({size:e,setSize:t,direction:n,setDirection:r,stickyHeader:i,setStickyHeader:a,stickyFooter:o,setStickyFooter:s}){return(0,N.jsxs)(k,{direction:`column`,gap:`sm`,align:`start`,children:[(0,N.jsxs)(k,{direction:`row`,gap:`lg`,align:`center`,children:[(0,N.jsx)(SizeSelector,{value:e,onChange:t}),(0,N.jsx)(DirectionSelector,{value:n,onChange:r})]}),(0,N.jsx)(StickyToggle,{stickyHeader:i,stickyFooter:o,setStickyHeader:a,setStickyFooter:s})]})}var N,P,F,I,L,R,z,B,V,H,U;function init_index_story(){return(init_index_story=e((()=>{n(),O(),v(),_(),C(),l(),d(),m(),init_description(),f(),w(),c(),g(),N=t(),P={title:`Components/@wordpress-ui/Drawer`,id:`design-system-components-drawer`,component:s,subcomponents:{"Drawer.Trigger":S,"Drawer.Portal":h,"Drawer.Popup":x,"Drawer.Header":u,"Drawer.Title":b,"Drawer.Description":M,"Drawer.Content":p,"Drawer.CloseIconButton":o,"Drawer.Action":T,"Drawer.Footer":y},argTypes:{modal:{control:`inline-radio`,options:[!0,!1,`trap-focus`]}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},F={args:{children:[(0,N.jsx)(S,{children:`Open Drawer`},`trigger`),(0,N.jsxs)(x,{children:[(0,N.jsxs)(u,{children:[(0,N.jsx)(b,{children:`Navigation`}),(0,N.jsx)(o,{})]}),(0,N.jsx)(p,{children:(0,N.jsx)(M,{children:`Browse through the available sections below.`})}),(0,N.jsx)(y,{children:(0,N.jsx)(T,{children:`Done`})})]},`popup`)]}},I=[{swipeDirection:`left`,label:`Left`,title:`Left Drawer`},{swipeDirection:`right`,label:`Right`,title:`Right Drawer`},{swipeDirection:`down`,label:`Bottom`,title:`Bottom Sheet`},{swipeDirection:`up`,label:`Top`,title:`Top Drawer`}],L={render:function AllSidesRender(e){return(0,N.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`8px`,maxWidth:`300px`},children:I.map(({swipeDirection:t,label:n,title:r})=>(0,N.jsxs)(s,{...e,swipeDirection:t,children:[(0,N.jsx)(S,{children:n}),(0,N.jsxs)(x,{children:[(0,N.jsxs)(u,{children:[(0,N.jsx)(b,{children:r}),(0,N.jsx)(o,{})]}),(0,N.jsx)(p,{children:(0,N.jsxs)(M,{children:[`Slides in from the `,n.toLowerCase(),` `,`edge. Swipe to dismiss.`]})}),(0,N.jsx)(y,{children:(0,N.jsx)(T,{children:`Close`})})]})]},t))})},argTypes:{children:{control:!1},swipeDirection:{control:!1}}},R={render:function ControlledRender(e){let[t,n]=(0,r.useState)(!1);return(0,N.jsx)(s,{...e,open:t,onOpenChange:n,children:e.children})},args:{children:[(0,N.jsx)(S,{children:`Open Controlled Drawer`},`trigger`),(0,N.jsxs)(x,{children:[(0,N.jsxs)(u,{children:[(0,N.jsx)(b,{children:`Controlled Drawer`}),(0,N.jsx)(o,{})]}),(0,N.jsx)(p,{children:(0,N.jsxs)(M,{children:[`The open state is managed externally via`,` `,(0,N.jsx)(`code`,{children:`open`}),` and `,(0,N.jsx)(`code`,{children:`onOpenChange`}),`.`]})}),(0,N.jsx)(y,{children:(0,N.jsx)(T,{children:`Close`})})]},`popup`)]},argTypes:{open:{control:!1},defaultOpen:{control:!1},onOpenChange:{control:!1},onOpenChangeComplete:{control:!1}}},z={args:{swipeDirection:`right`,modal:!1,children:[(0,N.jsx)(S,{children:`Open Non-Modal Drawer`},`trigger`),(0,N.jsxs)(x,{children:[(0,N.jsxs)(u,{children:[(0,N.jsx)(b,{children:`Non-Modal`}),(0,N.jsx)(o,{})]}),(0,N.jsx)(p,{children:(0,N.jsx)(M,{children:`This drawer does not trap focus and allows interaction with the rest of the page while open.`})}),(0,N.jsx)(y,{children:(0,N.jsx)(T,{children:`Close`})})]},`popup`)]},render:function NonModalRender(e){return(0,N.jsx)(s,{...e,children:e.children})}},B=[`small`,`medium`,`large`,`stretch`,`auto`],V={name:`With Custom z-index`,args:{children:[(0,N.jsx)(S,{children:`Open Drawer`},`trigger`),(0,N.jsxs)(x,{portal:(0,N.jsx)(h,{style:{"--wp-ui-drawer-z-index":`9999`}}),children:[(0,N.jsxs)(u,{children:[(0,N.jsx)(b,{children:`Custom z-index`}),(0,N.jsx)(o,{})]}),(0,N.jsx)(p,{children:(0,N.jsx)(M,{children:"The backdrop, viewport, and popup render at `z-index: 9999` via the `--wp-ui-drawer-z-index` CSS custom property, set on `Drawer.Portal` through the `portal` prop."})}),(0,N.jsx)(y,{children:(0,N.jsx)(T,{children:`Got it`})})]},`popup`)]}},H={render:function SizePlaygroundRender(e){let[t,n]=(0,r.useState)(),[i,a]=(0,r.useState)(e.swipeDirection??`left`);return(0,N.jsxs)(s,{...e,swipeDirection:i,children:[(0,N.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:16,alignItems:`start`},children:[(0,N.jsx)(DirectionSelector,{value:i,onChange:a}),(0,N.jsx)(SizeSelector,{value:t,onChange:n}),(0,N.jsx)(S,{children:`Open Drawer`})]}),(0,N.jsxs)(x,{size:t,children:[(0,N.jsxs)(u,{children:[(0,N.jsx)(b,{children:`Size Playground`}),(0,N.jsx)(o,{})]}),(0,N.jsx)(p,{children:(0,N.jsxs)(k,{direction:`column`,gap:`lg`,children:[(0,N.jsxs)(`div`,{style:{display:`grid`,gap:8},children:[(0,N.jsx)(SizeSelector,{value:t,onChange:n}),(0,N.jsx)(DirectionSelector,{value:i,onChange:a})]}),(0,N.jsx)(M,{children:`Use the dropdowns to change the size and direction. Both inside and outside controls stay in sync.`})]})}),(0,N.jsx)(y,{children:(0,N.jsx)(T,{children:`Got it`})})]})]})},argTypes:{swipeDirection:{control:!1}}},U={render:function ScrollableRender(e){let[t,n]=(0,r.useState)(),[i,a]=(0,r.useState)(e.swipeDirection??`left`),[c,l]=(0,r.useState)(!0),[d,f]=(0,r.useState)(!0),m={size:t,setSize:n,direction:i,setDirection:a,stickyHeader:c,setStickyHeader:l,stickyFooter:d,setStickyFooter:f},h=(0,N.jsxs)(u,{children:[(0,N.jsx)(b,{children:`Terms of service`}),(0,N.jsx)(o,{})]}),g=(0,N.jsxs)(y,{children:[(0,N.jsx)(T,{variant:`outline`,children:`Decline`}),(0,N.jsx)(T,{children:`Accept`})]});return(0,N.jsxs)(s,{...e,swipeDirection:i,children:[(0,N.jsxs)(k,{direction:`column`,gap:`lg`,align:`start`,children:[(0,N.jsx)(ScrollableControls,{...m}),(0,N.jsx)(S,{children:`Open Drawer`})]}),(0,N.jsxs)(x,{size:t,children:[c&&h,(0,N.jsxs)(p,{children:[!c&&h,(0,N.jsxs)(k,{direction:`column`,gap:`lg`,children:[(0,N.jsx)(ScrollableControls,{...m}),Array.from({length:20}).map((e,t)=>(0,N.jsxs)(`p`,{style:{margin:0},children:[`Paragraph `,t+1,`: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`]},t))]}),!d&&g]}),d&&g]})]})},argTypes:{swipeDirection:{control:!1}}};try{F.__docgenInfo={description:"A basic drawer sliding in from the left edge. Use the controls to\nexperiment with `swipeDirection` and `modal`.",displayName:`_Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{L.__docgenInfo={description:`Four drawers, one for each swipe direction. Each trigger opens a
drawer from the corresponding edge.`,displayName:`AllSides`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{R.__docgenInfo={description:`A controlled drawer where the open state is managed externally.`,displayName:`Controlled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:`A non-modal drawer that does not trap focus or lock page scroll.
Users can interact with content behind the drawer while it is open.`,displayName:`NonModal`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{V.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a drawer renders below another popover when you\nwant it above.\n\nThe `--wp-ui-drawer-z-index` CSS variable controls the z-index of the\ndrawer's backdrop, viewport, and popup. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  drawer in the page), or\n- **Per instance**, by passing a `Drawer.Portal` with a `style` (or\n  `className`) to `Drawer.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{H.__docgenInfo={description:"Interactive playground to test the `size` prop across all swipe\ndirections. Size controls the width (left/right) or height (up/down).",displayName:`SizePlayground`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{U.__docgenInfo={description:`When drawer content overflows the available space, \`Drawer.Content\`
scrolls while \`Drawer.Header\` and \`Drawer.Footer\` stay pinned to the
popup's edges. Separator lines appear only when there is off-screen
content above the header or below the footer.

To let the header or footer scroll with the body instead of staying
pinned, render it *inside* \`Drawer.Content\` rather than as a sibling.
The inline "Sticky header / Sticky footer" checkboxes toggle exactly
that placement at runtime.

Use the inline controls to change the popup \`size\`, \`swipeDirection\`,
and sticky placement. The same controls render both outside and inside
the drawer and stay in sync.`,displayName:`Scrollable`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/drawer/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Drawer.Trigger key="trigger">Open Drawer</Drawer.Trigger>, <Drawer.Popup key="popup">
                <Drawer.Header>
                    <Drawer.Title>Navigation</Drawer.Title>
                    <Drawer.CloseIconButton />
                </Drawer.Header>
                <Drawer.Content>
                    <Drawer.Description>
                        Browse through the available sections below.
                    </Drawer.Description>
                </Drawer.Content>
                <Drawer.Footer>
                    <Drawer.Action>Done</Drawer.Action>
                </Drawer.Footer>
            </Drawer.Popup>]
  }
}`,...F.parameters?.docs?.source},description:{story:"A basic drawer sliding in from the left edge. Use the controls to\nexperiment with `swipeDirection` and `modal`.",...F.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  render: function AllSidesRender(args) {
    return <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      maxWidth: '300px'
    }}>
                {directions.map(({
        swipeDirection,
        label,
        title
      }) => <Drawer.Root key={swipeDirection} {...args} swipeDirection={swipeDirection}>
                        <Drawer.Trigger>{label}</Drawer.Trigger>
                        <Drawer.Popup>
                            <Drawer.Header>
                                <Drawer.Title>{title}</Drawer.Title>
                                <Drawer.CloseIconButton />
                            </Drawer.Header>
                            <Drawer.Content>
                                <Drawer.Description>
                                    Slides in from the {label.toLowerCase()}{' '}
                                    edge. Swipe to dismiss.
                                </Drawer.Description>
                            </Drawer.Content>
                            <Drawer.Footer>
                                <Drawer.Action>Close</Drawer.Action>
                            </Drawer.Footer>
                        </Drawer.Popup>
                    </Drawer.Root>)}
            </div>;
  },
  argTypes: {
    children: {
      control: false
    },
    swipeDirection: {
      control: false
    }
  }
}`,...L.parameters?.docs?.source},description:{story:`Four drawers, one for each swipe direction. Each trigger opens a
drawer from the corresponding edge.`,...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  render: function ControlledRender(args) {
    const [open, setOpen] = useState(false);
    return <Drawer.Root {...args} open={open} onOpenChange={setOpen}>
                {args.children}
            </Drawer.Root>;
  },
  args: {
    children: [<Drawer.Trigger key="trigger">
                Open Controlled Drawer
            </Drawer.Trigger>, <Drawer.Popup key="popup">
                <Drawer.Header>
                    <Drawer.Title>Controlled Drawer</Drawer.Title>
                    <Drawer.CloseIconButton />
                </Drawer.Header>
                <Drawer.Content>
                    <Drawer.Description>
                        The open state is managed externally via{' '}
                        <code>open</code> and <code>onOpenChange</code>.
                    </Drawer.Description>
                </Drawer.Content>
                <Drawer.Footer>
                    <Drawer.Action>Close</Drawer.Action>
                </Drawer.Footer>
            </Drawer.Popup>]
  },
  argTypes: {
    open: {
      control: false
    },
    defaultOpen: {
      control: false
    },
    onOpenChange: {
      control: false
    },
    onOpenChangeComplete: {
      control: false
    }
  }
}`,...R.parameters?.docs?.source},description:{story:`A controlled drawer where the open state is managed externally.`,...R.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    swipeDirection: 'right',
    modal: false,
    children: [<Drawer.Trigger key="trigger">
                Open Non-Modal Drawer
            </Drawer.Trigger>, <Drawer.Popup key="popup">
                <Drawer.Header>
                    <Drawer.Title>Non-Modal</Drawer.Title>
                    <Drawer.CloseIconButton />
                </Drawer.Header>
                <Drawer.Content>
                    <Drawer.Description>
                        This drawer does not trap focus and allows interaction
                        with the rest of the page while open.
                    </Drawer.Description>
                </Drawer.Content>
                <Drawer.Footer>
                    <Drawer.Action>Close</Drawer.Action>
                </Drawer.Footer>
            </Drawer.Popup>]
  },
  render: function NonModalRender(args) {
    return <Drawer.Root {...args}>{args.children}</Drawer.Root>;
  }
}`,...z.parameters?.docs?.source},description:{story:`A non-modal drawer that does not trap focus or lock page scroll.
Users can interact with content behind the drawer while it is open.`,...z.parameters?.docs?.description}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    children: [<Drawer.Trigger key="trigger">Open Drawer</Drawer.Trigger>, <Drawer.Popup portal={<Drawer.Portal style={{
      '--wp-ui-drawer-z-index': '9999'
    }} />} key="popup">
                <Drawer.Header>
                    <Drawer.Title>Custom z-index</Drawer.Title>
                    <Drawer.CloseIconButton />
                </Drawer.Header>
                <Drawer.Content>
                    <Drawer.Description>
                        The backdrop, viewport, and popup render at \`z-index:
                        9999\` via the \`--wp-ui-drawer-z-index\` CSS custom
                        property, set on \`Drawer.Portal\` through the \`portal\`
                        prop.
                    </Drawer.Description>
                </Drawer.Content>
                <Drawer.Footer>
                    <Drawer.Action>Got it</Drawer.Action>
                </Drawer.Footer>
            </Drawer.Popup>]
  }
}`,...V.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a drawer renders below another popover when you\nwant it above.\n\nThe `--wp-ui-drawer-z-index` CSS variable controls the z-index of the\ndrawer's backdrop, viewport, and popup. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  drawer in the page), or\n- **Per instance**, by passing a `Drawer.Portal` with a `style` (or\n  `className`) to `Drawer.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",...V.parameters?.docs?.description}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  render: function SizePlaygroundRender(args) {
    const [size, setSize] = useState<ComponentProps<typeof Drawer.Popup>['size']>();
    const [direction, setDirection] = useState<ComponentProps<typeof Drawer.Root>['swipeDirection']>(args.swipeDirection ?? 'left');
    return <Drawer.Root {...args} swipeDirection={direction}>
                <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'start'
      }}>
                    <DirectionSelector value={direction} onChange={setDirection} />

                    <SizeSelector value={size} onChange={setSize} />
                    <Drawer.Trigger>Open Drawer</Drawer.Trigger>
                </div>
                <Drawer.Popup size={size}>
                    <Drawer.Header>
                        <Drawer.Title>Size Playground</Drawer.Title>
                        <Drawer.CloseIconButton />
                    </Drawer.Header>
                    <Drawer.Content>
                        <Stack direction="column" gap="lg">
                            <div style={{
              display: 'grid',
              gap: 8
            }}>
                                <SizeSelector value={size} onChange={setSize} />

                                <DirectionSelector value={direction} onChange={setDirection} />
                            </div>
                            <Drawer.Description>
                                Use the dropdowns to change the size and
                                direction. Both inside and outside controls stay
                                in sync.
                            </Drawer.Description>
                        </Stack>
                    </Drawer.Content>
                    <Drawer.Footer>
                        <Drawer.Action>Got it</Drawer.Action>
                    </Drawer.Footer>
                </Drawer.Popup>
            </Drawer.Root>;
  },
  argTypes: {
    swipeDirection: {
      control: false
    }
  }
}`,...H.parameters?.docs?.source},description:{story:"Interactive playground to test the `size` prop across all swipe\ndirections. Size controls the width (left/right) or height (up/down).",...H.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  render: function ScrollableRender(args) {
    const [size, setSize] = useState<ComponentProps<typeof Drawer.Popup>['size']>();
    const [direction, setDirection] = useState<ComponentProps<typeof Drawer.Root>['swipeDirection']>(args.swipeDirection ?? 'left');
    const [stickyHeader, setStickyHeader] = useState(true);
    const [stickyFooter, setStickyFooter] = useState(true);
    const controlProps: ScrollableControlProps = {
      size,
      setSize,
      direction,
      setDirection,
      stickyHeader,
      setStickyHeader,
      stickyFooter,
      setStickyFooter
    };
    const header = <Drawer.Header>
                <Drawer.Title>Terms of service</Drawer.Title>
                <Drawer.CloseIconButton />
            </Drawer.Header>;
    const footer = <Drawer.Footer>
                <Drawer.Action variant="outline">Decline</Drawer.Action>
                <Drawer.Action>Accept</Drawer.Action>
            </Drawer.Footer>;
    return <Drawer.Root {...args} swipeDirection={direction}>
                <Stack direction="column" gap="lg" align="start">
                    <ScrollableControls {...controlProps} />
                    <Drawer.Trigger>Open Drawer</Drawer.Trigger>
                </Stack>
                <Drawer.Popup size={size}>
                    {stickyHeader && header}
                    <Drawer.Content>
                        {!stickyHeader && header}
                        <Stack direction="column" gap="lg">
                            <ScrollableControls {...controlProps} />
                            {Array.from({
              length: 20
            }).map((_, index) => <p key={index} style={{
              margin: 0
            }}>
                                        Paragraph {index + 1}: Lorem ipsum
                                        dolor sit amet, consectetur adipiscing
                                        elit. Sed do eiusmod tempor incididunt
                                        ut labore et dolore magna aliqua. Ut
                                        enim ad minim veniam, quis nostrud
                                        exercitation ullamco laboris nisi ut
                                        aliquip ex ea commodo consequat.
                                    </p>)}
                        </Stack>
                        {!stickyFooter && footer}
                    </Drawer.Content>
                    {stickyFooter && footer}
                </Drawer.Popup>
            </Drawer.Root>;
  },
  argTypes: {
    swipeDirection: {
      control: false
    }
  }
}`,...U.parameters?.docs?.source},description:{story:`When drawer content overflows the available space, \`Drawer.Content\`
scrolls while \`Drawer.Header\` and \`Drawer.Footer\` stay pinned to the
popup's edges. Separator lines appear only when there is off-screen
content above the header or below the footer.

To let the header or footer scroll with the body instead of staying
pinned, render it *inside* \`Drawer.Content\` rather than as a sibling.
The inline "Sticky header / Sticky footer" checkboxes toggle exactly
that placement at runtime.

Use the inline controls to change the popup \`size\`, \`swipeDirection\`,
and sticky placement. The same controls render both outside and inside
the drawer and stay in sync.`,...U.parameters?.docs?.description}}}})))()}init_index_story();export{L as AllSides,R as Controlled,z as NonModal,U as Scrollable,H as SizePlayground,V as WithCustomZIndex,F as _Default,P as default};