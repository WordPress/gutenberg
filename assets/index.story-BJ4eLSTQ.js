import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./button-8ccnOjTA.js";import{n as o,t as s}from"./scroll-lock-PaqxWJus.js";function StripedBackground(e){return(0,c.jsx)(`div`,{style:{backgroundColor:`#fff`,backgroundImage:`linear-gradient(transparent 50%, rgba(0, 0, 0, 0.05) 50%)`,backgroundSize:`50px 50px`,height:3e3,position:`relative`},...e})}function ToggleContainer(e){let{children:t}=e;return(0,c.jsx)(`div`,{style:{position:`sticky`,top:0,padding:40,display:`flex`,justifyContent:`center`,textAlign:`center`},children:(0,c.jsx)(`div`,{children:t})})}var c,l,Default;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o(),c=t(),l={tags:[`manifest`],component:s,title:`Components/@wordpress-components/Utilities/ScrollLock`,id:`components-scrolllock`,parameters:{controls:{hideNoControlsWarning:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},Default=()=>{let[e,t]=(0,r.useState)(!1),toggleLock=()=>t(!e);return(0,c.jsx)(`div`,{style:{height:1e3},children:(0,c.jsx)(`div`,{style:{overflow:`auto`,height:240,border:`1px solid lightgray`},children:(0,c.jsxs)(StripedBackground,{children:[(0,c.jsxs)(`div`,{children:[`Start scrolling down. Once you scroll to the end of this container with the stripes, the rest of the page will continue scrolling. `,(0,c.jsx)(`code`,{children:`ScrollLock`}),` prevents this "scroll bleed" from happening.`]}),(0,c.jsxs)(ToggleContainer,{children:[(0,c.jsx)(a,{__next40pxDefaultSize:!0,variant:`primary`,onClick:toggleLock,children:`Toggle Scroll Lock`}),e&&(0,c.jsx)(s,{}),(0,c.jsxs)(`p`,{children:[`Scroll locked:`,` `,(0,c.jsx)(`strong`,{children:e?`Yes`:`No`})]})]})]})})})},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`() => {
  const [isScrollLocked, setScrollLocked] = useState(false);
  const toggleLock = () => setScrollLocked(!isScrollLocked);
  return <div style={{
    height: 1000
  }}>
            <div style={{
      overflow: 'auto',
      height: 240,
      border: '1px solid lightgray'
    }}>
                <StripedBackground>
                    <div>
                        Start scrolling down. Once you scroll to the end of this
                        container with the stripes, the rest of the page will
                        continue scrolling. <code>ScrollLock</code> prevents
                        this &quot;scroll bleed&quot; from happening.
                    </div>
                    <ToggleContainer>
                        <Button __next40pxDefaultSize variant="primary" onClick={toggleLock}>
                            Toggle Scroll Lock
                        </Button>
                        {isScrollLocked && <ScrollLock />}
                        <p>
                            Scroll locked:{' '}
                            <strong>{isScrollLocked ? 'Yes' : 'No'}</strong>
                        </p>
                    </ToggleContainer>
                </StripedBackground>
            </div>
        </div>;
}`,...Default.parameters?.docs?.source}}}})))()}init_index_story();export{Default,l as default};