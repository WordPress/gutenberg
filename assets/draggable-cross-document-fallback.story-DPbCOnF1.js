import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./react-platform-CdCCcmsi.js";import{n as o,t as s}from"./wp-compat-overlay-slot-DJ8ZmJOK.js";import{n as c,t as l}from"./style-provider-DOC7eRYB.js";import{n as u,t as d}from"./draggable-LTeOBbsF.js";import{n as f,t as p}from"./with-wp-compat-overlay-slot-ClxUNTlm.js";var m,h,InsideIframeWithCompatSlot;function init_draggable_cross_document_fallback_story(){return(init_draggable_cross_document_fallback_story=e((()=>{u(),c(),i(),n(),o(),f(),m=t(),h={title:`Playground/Debug fixtures/Draggable cross-document fallback`,component:d,decorators:[p]},InsideIframeWithCompatSlot=()=>{let e=(0,r.useRef)(null),[t,n]=(0,r.useState)(null),updateIframeDoc=()=>{n(e.current?.contentDocument??null)};return(0,r.useEffect)(updateIframeDoc,[]),(0,m.jsxs)(`div`,{children:[(0,m.jsx)(`p`,{children:`Drag the blue handle inside the iframe. The orange clone should appear under the cursor. If it appears offset toward the top-left of the Storybook canvas, the compat-slot cross-document fallback has regressed.`}),(0,m.jsx)(`p`,{children:(0,m.jsxs)(`small`,{children:[`Compat slot present in this document:`,` `,(0,m.jsx)(`code`,{children:String(typeof window<`u`&&s()!==void 0)})]})}),(0,m.jsx)(`iframe`,{ref:e,title:`Draggable iframe coordinate test`,onLoad:updateIframeDoc,srcDoc:`<!doctype html><html><head></head><body style="margin:0;"></body></html>`,style:{border:`2px dashed #757575`,height:240,marginBlockStart:80,marginInlineStart:120,width:360}}),t?.body&&a((0,m.jsx)(l,{document:t,children:(0,m.jsx)(`div`,{style:{background:`#f6f7f7`,boxSizing:`border-box`,fontFamily:`sans-serif`,height:`240px`,padding:32},children:(0,m.jsx)(d,{elementId:`iframe-draggable-source`,transferData:{},__experimentalDragComponent:(0,m.jsx)(`div`,{style:{background:`#f0b849`,borderRadius:4,color:`#1e1e1e`,fontWeight:`var(--wpds-typography-font-weight-emphasis, 600)`,padding:`8px 12px`},children:`Drag clone`}),children:({onDraggableStart:e,onDraggableEnd:t})=>(0,m.jsx)(`div`,{draggable:!0,onDragStart:e,onDragEnd:t,style:{alignItems:`center`,background:`#3858e9`,borderRadius:4,color:`white`,cursor:`grab`,display:`inline-flex`,fontWeight:`var(--wpds-typography-font-weight-emphasis, 600)`,height:56,justifyContent:`center`,padding:`0 16px`},children:`Drag from iframe`})})})}),t.body)]})},InsideIframeWithCompatSlot.__docgenInfo={description:``,methods:[],displayName:`InsideIframeWithCompatSlot`},InsideIframeWithCompatSlot.parameters={...InsideIframeWithCompatSlot.parameters,docs:{...InsideIframeWithCompatSlot.parameters?.docs,source:{originalSource:`() => {
  const iframeRef = useRef(null);
  const [iframeDoc, setIframeDoc] = useState(null);
  const updateIframeDoc = () => {
    setIframeDoc(iframeRef.current?.contentDocument ?? null);
  };
  useEffect(updateIframeDoc, []);
  return <div>
            <p>
                Drag the blue handle inside the iframe. The orange clone should
                appear under the cursor. If it appears offset toward the
                top-left of the Storybook canvas, the compat-slot cross-document
                fallback has regressed.
            </p>
            <p>
                <small>
                    Compat slot present in this document:{' '}
                    <code>
                        {String(typeof window !== 'undefined' && getWpCompatOverlaySlot() !== undefined)}
                    </code>
                </small>
            </p>
            <iframe ref={iframeRef} title="Draggable iframe coordinate test" onLoad={updateIframeDoc} srcDoc='<!doctype html><html><head></head><body style="margin:0;"></body></html>' style={{
      border: '2px dashed #757575',
      height: 240,
      marginBlockStart: 80,
      marginInlineStart: 120,
      width: 360
    }} />
            {iframeDoc?.body && createPortal(<StyleProvider document={iframeDoc}>
                        <div style={{
        background: '#f6f7f7',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        height: '240px',
        padding: 32
      }}>
                            <Draggable elementId="iframe-draggable-source" transferData={{}} __experimentalDragComponent={<div style={{
          background: '#f0b849',
          borderRadius: 4,
          color: '#1e1e1e',
          fontWeight: 'var(--wpds-typography-font-weight-emphasis)',
          padding: '8px 12px'
        }}>
                                        Drag clone
                                    </div>}>
                                {({
            onDraggableStart,
            onDraggableEnd
          }) => <div draggable onDragStart={onDraggableStart} onDragEnd={onDraggableEnd} style={{
            alignItems: 'center',
            background: '#3858e9',
            borderRadius: 4,
            color: 'white',
            cursor: 'grab',
            display: 'inline-flex',
            fontWeight: 'var(--wpds-typography-font-weight-emphasis)',
            height: 56,
            justifyContent: 'center',
            padding: '0 16px'
          }}>
                                        Drag from iframe
                                    </div>}
                            </Draggable>
                        </div>
                    </StyleProvider>, iframeDoc.body)}
        </div>;
}`,...InsideIframeWithCompatSlot.parameters?.docs?.source}}}})))()}init_draggable_cross_document_fallback_story();export{InsideIframeWithCompatSlot,h as default};