import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./react-platform-CdCCcmsi.js";import{n as o,t as s}from"./button-8ccnOjTA.js";import{i as c,t as l}from"./slot-fill-B6H7Z4Zw.js";import{n as u,t as d}from"./popover-BMC4T2rt.js";var f,GenericIframe,PopoverInsideIframeRenderedInExternalSlot;function init_utils(){return(init_utils=e((()=>{i(),n(),u(),c(),f=t(),GenericIframe=({children:e,...t})=>{let[n,i]=(0,r.useState)();return(0,f.jsx)(`iframe`,{...t,title:`My Iframe`,srcDoc:`<!doctype html><html><body></body></html>`,onLoad:e=>{e.currentTarget.contentDocument&&i(e.currentTarget.contentDocument.body)},children:n&&a(e,n)})},PopoverInsideIframeRenderedInExternalSlot=e=>{let t=`my-slot`,[n,i]=(0,r.useState)(null);return(0,f.jsxs)(l,{children:[(0,f.jsx)(d.Slot,{name:t}),(0,f.jsx)(GenericIframe,{style:{width:`100%`,height:`400px`,border:`0`,outline:`1px solid purple`},children:(0,f.jsxs)(`div`,{style:{height:`200vh`,paddingTop:`10vh`},children:[(0,f.jsx)(`p`,{style:{padding:`8px`,background:`salmon`,maxWidth:`200px`,marginTop:`100px`,marginLeft:`auto`,marginRight:`auto`},ref:i,children:`Popover's anchor`}),(0,f.jsx)(d,{...e,__unstableSlotName:t,anchor:n})]})})]})}})))()}var p,m,h,PopoverWithAnchor,g,_,v,y,b,x;function init_index_story(){return(init_index_story=e((()=>{n(),o(),u(),init_utils(),p=t(),m=[`top`,`top-start`,`top-end`,`right`,`right-start`,`right-end`,`bottom`,`bottom-start`,`bottom-end`,`left`,`left-start`,`left-end`,`overlay`],h={tags:[`manifest`],title:`Components/@wordpress-components/Overlays/Popover`,id:`components-popover`,component:d,subcomponents:{"Popover.Slot":d.Slot},argTypes:{anchor:{control:!1},anchorRef:{control:!1},anchorRect:{control:!1},children:{control:!1},focusOnMount:{control:{type:`select`},options:[`firstElement`,!0,!1]},getAnchorRect:{control:!1},onClose:{action:`onClose`},onFocusOutside:{action:`onFocusOutside`},__unstableSlotName:{control:!1}},parameters:{controls:{expanded:!0},componentStatus:{status:`recommended`,whereUsed:`global`}}},PopoverWithAnchor=e=>{let[t,n]=(0,r.useState)(null);return(0,p.jsxs)(`div`,{style:{height:`200px`,display:`flex`,justifyContent:`center`,alignItems:`center`},children:[(0,p.jsx)(`p`,{style:{padding:`8px`,background:`salmon`},ref:n,children:`Popover's anchor`}),(0,p.jsx)(d,{...e,anchor:t})]})},g={decorators:[e=>{let[t,n]=(0,r.useState)(!1),i=(0,r.useRef)(void 0),toggleVisible=e=>{i.current&&e.target!==i.current||n(e=>!e)};return(0,r.useEffect)(()=>{i.current?.scrollIntoView?.({block:`center`,inline:`center`})},[]),(0,p.jsx)(`div`,{style:{width:`300vw`,height:`300vh`,display:`flex`,alignItems:`center`,justifyContent:`center`},children:(0,p.jsxs)(s,{__next40pxDefaultSize:!0,variant:`secondary`,onClick:toggleVisible,ref:i,children:[`Toggle Popover`,t&&(0,p.jsx)(e,{})]})})}],args:{children:(0,p.jsx)(`div`,{style:{width:`280px`,whiteSpace:`normal`},children:`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`})}},_={...g,args:{...g.args,variant:`unstyled`}},v={render:({children:e,...t})=>(0,p.jsxs)(`div`,{style:{minWidth:`600px`,marginLeft:`auto`,marginRight:`auto`},children:[(0,p.jsx)(`h2`,{children:`Resize / scroll the viewport to test the behavior of the popovers when they reach the viewport boundaries.`}),(0,p.jsx)(`div`,{children:m.map(n=>(0,p.jsxs)(PopoverWithAnchor,{placement:n,...t,resize:n===`overlay`||t.resize,children:[e,(0,p.jsx)(`div`,{children:(0,p.jsxs)(`small`,{children:[`(placement: `,n,`)`]})})]},n))})]}),parameters:{a11y:{test:`todo`},controls:{exclude:[`placement`,`position`]}},args:{...g.args,children:(0,p.jsx)(`div`,{style:{width:`280px`,whiteSpace:`normal`},children:`Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`}),noArrow:!1,offset:10,resize:!1,flip:!1}},y={decorators:[e=>{let[t,n]=(0,r.useState)(200),increase=()=>n(t+100),decrease=()=>n(t-100);return(0,p.jsxs)(`div`,{style:{padding:`20px`},children:[(0,p.jsxs)(`div`,{children:[(0,p.jsx)(s,{__next40pxDefaultSize:!0,variant:`primary`,onClick:increase,style:{marginRight:`20px`},children:`Increase Size`}),(0,p.jsx)(s,{__next40pxDefaultSize:!0,variant:`primary`,onClick:decrease,children:`Decrease Size`})]}),(0,p.jsx)(`p`,{children:`When the height of the popover exceeds the available space in the canvas, a scrollbar inside the popover should appear.`}),(0,p.jsxs)(`div`,{children:[(0,p.jsx)(`style`,{children:`.components-popover { --dynamic-height: ${t}px; }`}),(0,p.jsx)(e,{})]})]})}],args:{...g.args,animate:!1,children:(0,p.jsx)(`div`,{style:{height:`var(--dynamic-height)`,background:`#eee`,padding:`20px`},children:`Content with dynamic height`})}},b={render:e=>(0,p.jsx)(PopoverInsideIframeRenderedInExternalSlot,{...e}),args:{...g.args}},x={render:function WithCloseHandlersStory(e){let[t,n]=(0,r.useState)(!1),i=(0,r.useRef)(null),toggleVisible=e=>{i.current&&e.target!==i.current||n(e=>!e)},handleClose=()=>{e.onClose?.(),n(!1)},handleFocusOutside=t=>{e.onFocusOutside?.(t),n(!1)};return(0,r.useEffect)(()=>{i.current?.scrollIntoView({block:`center`,inline:`center`})},[]),(0,p.jsx)(`div`,{style:{width:`300vw`,height:`300vh`,display:`flex`,alignItems:`center`,justifyContent:`center`},children:(0,p.jsxs)(s,{__next40pxDefaultSize:!0,variant:`secondary`,onClick:toggleVisible,ref:i,children:[`Toggle Popover`,t&&(0,p.jsx)(d,{...e,onClose:handleClose,onFocusOutside:handleFocusOutside,children:e.children})]})})},args:{...g.args,focusOnMount:!0,children:(0,p.jsxs)(`div`,{style:{width:`280px`,whiteSpace:`normal`},children:[(0,p.jsx)(`p`,{children:`Clicking outside triggers the onFocusOutside callback prop.`}),(0,p.jsx)(`p`,{children:`Pressing the Escape key triggers the onClose callback prop.`})]})}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    const [isVisible, setIsVisible] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(undefined);
    const toggleVisible = (event: React.MouseEvent) => {
      if (buttonRef.current && event.target !== buttonRef.current) {
        return;
      }
      setIsVisible(state => !state);
    };
    useEffect(() => {
      buttonRef.current?.scrollIntoView?.({
        block: 'center',
        inline: 'center'
      });
    }, []);
    return <div style={{
      width: '300vw',
      height: '300vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
                    <Button __next40pxDefaultSize variant="secondary" onClick={toggleVisible} ref={buttonRef}>
                        Toggle Popover
                        {isVisible && <Story />}
                    </Button>
                </div>;
  }],
  args: {
    children: <div style={{
      width: '280px',
      whiteSpace: 'normal'
    }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
            </div>
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    variant: 'unstyled'
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: ({
    children,
    ...args
  }) => <div style={{
    minWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  }}>
            <h2>
                Resize / scroll the viewport to test the behavior of the
                popovers when they reach the viewport boundaries.
            </h2>
            <div>
                {AVAILABLE_PLACEMENTS.map(p => <PopoverWithAnchor key={p} placement={p} {...args} resize={p === 'overlay' ? true : args.resize}>
                        {children}
                        <div>
                            <small>(placement: {p})</small>
                        </div>
                    </PopoverWithAnchor>)}
            </div>
        </div>,
  // Excluding placement and position since they all possible values
  // are passed directly in code.
  parameters: {
    // FIXME: All Placements: scrollable demo region is not keyboard-accessible (scrollable-region-focusable).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    },
    controls: {
      exclude: ['placement', 'position']
    }
  },
  args: {
    ...Default.args,
    children: <div style={{
      width: '280px',
      whiteSpace: 'normal'
    }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div>,
    noArrow: false,
    offset: 10,
    resize: false,
    flip: false
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    const [height, setHeight] = useState(200);
    const increase = () => setHeight(height + 100);
    const decrease = () => setHeight(height - 100);
    return <div style={{
      padding: '20px'
    }}>
                    <div>
                        <Button __next40pxDefaultSize variant="primary" onClick={increase} style={{
          marginRight: '20px'
        }}>
                            Increase Size
                        </Button>

                        <Button __next40pxDefaultSize variant="primary" onClick={decrease}>
                            Decrease Size
                        </Button>
                    </div>

                    <p>
                        When the height of the popover exceeds the available
                        space in the canvas, a scrollbar inside the popover
                        should appear.
                    </p>

                    <div>
                        <style>{\`.components-popover { --dynamic-height: \${height}px; }\`}</style>
                        <Story />
                    </div>
                </div>;
  }],
  args: {
    ...Default.args,
    animate: false,
    children: <div style={{
      height: 'var(--dynamic-height)',
      background: '#eee',
      padding: '20px'
    }}>
                Content with dynamic height
            </div>
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: args => <PopoverInsideIframeRenderedInExternalSlot {...args} />,
  args: {
    ...Default.args
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: function WithCloseHandlersStory(args) {
    const [isVisible, setIsVisible] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const toggleVisible = (event: React.MouseEvent) => {
      if (buttonRef.current && event.target !== buttonRef.current) {
        return;
      }
      setIsVisible(prev => !prev);
    };
    const handleClose = () => {
      args.onClose?.();
      setIsVisible(false);
    };
    const handleFocusOutside = (e: React.SyntheticEvent) => {
      args.onFocusOutside?.(e);
      setIsVisible(false);
    };
    useEffect(() => {
      buttonRef.current?.scrollIntoView({
        block: 'center',
        inline: 'center'
      });
    }, []);
    return <div style={{
      width: '300vw',
      height: '300vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
                <Button __next40pxDefaultSize variant="secondary" onClick={toggleVisible} ref={buttonRef}>
                    Toggle Popover
                    {isVisible && <Popover {...args} onClose={handleClose} onFocusOutside={handleFocusOutside}>
                            {args.children}
                        </Popover>}
                </Button>
            </div>;
  },
  args: {
    ...Default.args,
    focusOnMount: true,
    children: <div style={{
      width: '280px',
      whiteSpace: 'normal'
    }}>
                <p>
                    Clicking outside triggers the onFocusOutside callback prop.
                </p>
                <p>
                    Pressing the Escape key triggers the onClose callback prop.
                </p>
            </div>
  }
}`,...x.parameters?.docs?.source}}}})))()}init_index_story();export{v as AllPlacements,g as Default,y as DynamicHeight,_ as Unstyled,x as WithCloseHandlers,b as WithSlotOutsideIframe,h as default};