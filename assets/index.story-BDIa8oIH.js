import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./react-platform-CdCCcmsi.js";import{n as o,t as s}from"./use-instance-id-DuzD68j8.js";import{n as c,t as l}from"./throttle-CGyK_qxB.js";import{Ll as u,n as d,vi as f}from"./build-module-CPA2Y5FH.js";import{n as p,t as m}from"./wp-compat-overlay-slot-DJ8ZmJOK.js";var h,g;function init_style_module(){return(init_style_module=e((()=>{h=`_clone_ykx1n_9`,g={"invisible-drag-image":`_invisible-drag-image_ykx1n_1`,clone:h,"is-in-compat-slot":`_is-in-compat-slot_ykx1n_16`}})))()}function Draggable({children:e,onDragStart:t,onDragOver:n,onDragEnd:i,appendToOwnerDocument:o=!1,cloneClassname:s,elementId:l,transferData:u,__experimentalTransferDataType:d=`text`,__experimentalDragComponent:f}){let p=(0,r.useRef)(()=>{}),[h,S]=(0,r.useState)(null);function end(e){e.preventDefault(),p.current(),i?.(e)}function start(e){let{ownerDocument:r}=e.target,i=m(),a=i?.ownerDocument===r?i:null;e.dataTransfer.setData(d,JSON.stringify(u));let h=r.createElement(`div`);h.style.top=`0`,h.style.left=`0`;let _=r.createElement(`div`);typeof e.dataTransfer.setDragImage==`function`&&(_.classList.add(...v),r.body.appendChild(_),e.dataTransfer.setDragImage(_,0,0)),h.classList.add(...y);let C=g[`is-in-compat-slot`];a&&C&&h.classList.add(C),s&&h.classList.add(s);let w=0,T=0;if(f)w=e.clientX,T=e.clientY,h.style.transform=`translate( ${w}px, ${T}px )`,(a??r.body).appendChild(h),S(h);else{let e=r.getElementById(l),t=e.getBoundingClientRect(),n=e.parentNode,i=t.top,s=t.left;h.style.width=`${t.width+0}px`;let c=e.cloneNode(!0);c.id=`clone-${l}`,w=s-x,T=i-x,h.style.transform=`translate( ${w}px, ${T}px )`,Array.from(c.querySelectorAll(`iframe`)).forEach(e=>e.parentNode?.removeChild(e)),h.appendChild(c),a?a.appendChild(h):o?r.body.appendChild(h):n?.appendChild(h)}let E=e.clientX,D=e.clientY;function over(e){if(E===e.clientX&&D===e.clientY)return;let t=w+e.clientX-E,r=T+e.clientY-D;h.style.transform=`translate( ${t}px, ${r}px )`,E=e.clientX,D=e.clientY,w=t,T=r,n?.(e)}let O=c(over,16);r.addEventListener(`dragover`,O),r.body.classList.add(b),t?.(e),p.current=()=>{h.remove(),_.remove(),S(null),r.body.classList.remove(b),r.removeEventListener(`dragover`,O),p.current=()=>{}}}return(0,r.useEffect)(()=>()=>p.current(),[]),(0,_.jsxs)(_.Fragment,{children:[e({onDraggableStart:start,onDraggableEnd:end}),h&&a(f,h)]})}var _,v,y,b,x;function init_draggable(){return(init_draggable=e((()=>{l(),i(),n(),p(),init_style_module(),_=t(),v=[g[`invisible-drag-image`],`components-draggable__invisible-drag-image`].filter(Boolean),y=[g.clone,`components-draggable__clone`].filter(Boolean),b=`is-dragging-components-draggable`,x=0;try{Draggable.__docgenInfo={description:`\`Draggable\` is a Component that provides a way to set up a cross-browser
(including IE) customizable drag image and the transfer data for the drag
event. It decouples the drag handle and the element to drag: use it by
wrapping the component that will become the drag handle and providing the DOM
ID of the element to drag.

Note that the drag handle needs to declare the \`draggable="true"\` property
and bind the \`Draggable\`s \`onDraggableStart\` and \`onDraggableEnd\` event
handlers to its own \`onDragStart\` and \`onDragEnd\` respectively. \`Draggable\`
takes care of the logic to setup the drag image and the transfer data, but is
not concerned with creating an actual DOM element that is draggable.

\`\`\`jsx
import { Draggable, Panel, PanelBody } from '@wordpress/components';
import { Icon, more } from '@wordpress/icons';

const MyDraggable = () => (
  <div id="draggable-panel">
    <Panel header="Draggable panel">
      <PanelBody>
        <Draggable elementId="draggable-panel" transferData={ {} }>
          { ( { onDraggableStart, onDraggableEnd } ) => (
            <div
              className="example-drag-handle"
              draggable
              onDragStart={ onDraggableStart }
              onDragEnd={ onDraggableEnd }
            >
              <Icon icon={ more } />
            </div>
          ) }
        </Draggable>
      </PanelBody>
    </Panel>
  </div>
);
\`\`\``,displayName:`Draggable`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/draggable/index.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:`Children.`,name:`children`,required:!0,tags:{},type:{name:`(props: { onDraggableStart: (event: DragEvent<Element>) => void; onDraggableEnd: (event: DragEvent<Element>) => void; }) => Element | null`}},appendToOwnerDocument:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:`Whether to append the cloned element to the \`ownerDocument\` body.
By default, elements sourced by id are appended to the element's wrapper.

Has no effect when the \`@wordpress/ui\` compat overlay slot is in use in
the same document — the clone goes into the slot instead. Cross-document
drags fall back to this prop's regular semantics.`,name:`appendToOwnerDocument`,required:!1,tags:{},type:{name:`boolean`}},cloneClassname:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:`Classname for the cloned element.`,name:`cloneClassname`,required:!1,tags:{},type:{name:`string`}},elementId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:`The HTML id of the element to clone on drag`,name:`elementId`,required:!0,tags:{},type:{name:`string`}},onDragEnd:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:"A function called when dragging ends. This callback receives the `event`\nobject from the `dragend` event as its first parameter.",name:`onDragEnd`,required:!1,tags:{},type:{name:`((event: DragEvent<Element>) => void)`}},onDragOver:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:"A function called when the element being dragged is dragged over a valid\ndrop target. This callback receives the `event` object from the\n`dragover` event as its first parameter.",name:`onDragOver`,required:!1,tags:{},type:{name:`((event: DragEvent<Element>) => void)`}},onDragStart:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:"A function called when dragging starts. This callback receives the\n`event` object from the `dragstart` event as its first parameter.",name:`onDragStart`,required:!1,tags:{},type:{name:`((event: DragEvent<Element>) => void)`}},transferData:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:`Arbitrary data object attached to the drag and drop event.`,name:`transferData`,required:!0,tags:{},type:{name:`unknown`}},__experimentalTransferDataType:{defaultValue:{value:`text`},declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:`The transfer data type to set.`,name:`__experimentalTransferDataType`,required:!1,tags:{},type:{name:`string`}},__experimentalDragComponent:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/draggable/types.ts`,name:`TypeLiteral`}],description:`Component to show when dragging.`,name:`__experimentalDragComponent`,required:!1,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var S,C,w,DefaultTemplate,T,E;function init_index_story(){return(init_index_story=e((()=>{s(),n(),d(),init_draggable(),S=t(),{fn:C}=__STORYBOOK_MODULE_TEST__,w={component:Draggable,title:`Components/@wordpress-components/Utilities/Draggable`,id:`components-draggable`,argTypes:{elementId:{control:!1},__experimentalDragComponent:{control:!1}},args:{onDragStart:C(),onDragEnd:C(),onDragOver:C()},parameters:{controls:{expanded:!0},docs:{source:{code:``},story:{inline:!1,height:`250px`}},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:`May be deprecated.`}}},DefaultTemplate=e=>{let[t,n]=(0,r.useState)(!1),i=o(DefaultTemplate);return(0,S.jsxs)(`div`,{children:[(0,S.jsxs)(`p`,{style:{padding:`1em`,position:`relative`,zIndex:1e3,backgroundColor:`whitesmoke`},children:[`Is Dragging? `,t?`Yes`:`No!`]}),(0,S.jsx)(`div`,{style:{zIndex:100,position:`relative`},children:(0,S.jsx)(`div`,{id:`draggable-example-box-${i}`,style:{display:`inline-flex`,position:`relative`},children:(0,S.jsx)(Draggable,{...e,elementId:`draggable-example-box-${i}`,children:({onDraggableStart:e,onDraggableEnd:t})=>{let handleOnDragStart=t=>{n(!0),e(t)},handleOnDragEnd=e=>{n(!1),t(e)};return(0,S.jsx)(`div`,{onDragStart:handleOnDragStart,onDragEnd:handleOnDragEnd,draggable:!0,style:{alignItems:`center`,display:`flex`,justifyContent:`center`,width:100,height:100,background:`#ddd`},children:(0,S.jsx)(u,{icon:f})})}})})})]})},T=DefaultTemplate.bind({}),T.args={},E=DefaultTemplate.bind({}),E.args={appendToOwnerDocument:!0};try{E.__docgenInfo={description:"`appendToOwnerDocument` appends the dragged element's clone to the owner\ndocument's body instead of the element's parent, which is useful when an\nancestor's stacking context (e.g. its `z-index`) would otherwise place the\nclone behind other content.",displayName:`AppendElementToOwnerDocument`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/draggable/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`args => {
  const [isDragging, setDragging] = useState(false);
  const instanceId = useInstanceId(DefaultTemplate);

  // Allow for the use of ID in the example.
  return <div>
            <p style={{
      padding: '1em',
      position: 'relative',
      zIndex: 1000,
      backgroundColor: 'whitesmoke'
    }}>
                Is Dragging? {isDragging ? 'Yes' : 'No!'}
            </p>
            <div style={{
      zIndex: 100,
      position: 'relative'
    }}>
                <div id={\`draggable-example-box-\${instanceId}\`} style={{
        display: 'inline-flex',
        position: 'relative'
      }}>
                    <Draggable {...args} elementId={\`draggable-example-box-\${instanceId}\`}>
                        {({
            onDraggableStart,
            onDraggableEnd
          }) => {
            const handleOnDragStart = (event: DragEvent) => {
              setDragging(true);
              onDraggableStart(event);
            };
            const handleOnDragEnd = (event: DragEvent) => {
              setDragging(false);
              onDraggableEnd(event);
            };
            return <div onDragStart={handleOnDragStart} onDragEnd={handleOnDragEnd} draggable style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              width: 100,
              height: 100,
              background: '#ddd'
            }}>
                                    <Icon icon={more} />
                                </div>;
          }}
                    </Draggable>
                </div>
            </div>
        </div>;
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`args => {
  const [isDragging, setDragging] = useState(false);
  const instanceId = useInstanceId(DefaultTemplate);

  // Allow for the use of ID in the example.
  return <div>
            <p style={{
      padding: '1em',
      position: 'relative',
      zIndex: 1000,
      backgroundColor: 'whitesmoke'
    }}>
                Is Dragging? {isDragging ? 'Yes' : 'No!'}
            </p>
            <div style={{
      zIndex: 100,
      position: 'relative'
    }}>
                <div id={\`draggable-example-box-\${instanceId}\`} style={{
        display: 'inline-flex',
        position: 'relative'
      }}>
                    <Draggable {...args} elementId={\`draggable-example-box-\${instanceId}\`}>
                        {({
            onDraggableStart,
            onDraggableEnd
          }) => {
            const handleOnDragStart = (event: DragEvent) => {
              setDragging(true);
              onDraggableStart(event);
            };
            const handleOnDragEnd = (event: DragEvent) => {
              setDragging(false);
              onDraggableEnd(event);
            };
            return <div onDragStart={handleOnDragStart} onDragEnd={handleOnDragEnd} draggable style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              width: 100,
              height: 100,
              background: '#ddd'
            }}>
                                    <Icon icon={more} />
                                </div>;
          }}
                    </Draggable>
                </div>
            </div>
        </div>;
}`,...E.parameters?.docs?.source},description:{story:"`appendToOwnerDocument` appends the dragged element's clone to the owner\ndocument's body instead of the element's parent, which is useful when an\nancestor's stacking context (e.g. its `z-index`) would otherwise place the\nclone behind other content.",...E.parameters?.docs?.description}}}})))()}init_index_story();export{E as AppendElementToOwnerDocument,T as Default,w as default};