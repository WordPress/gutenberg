import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i}from"./build-module-Kv-R0C4j.js";import{t as a}from"./data-transfer-CiZJWtMb.js";import{n as o,t as s}from"./build-module-CqL0UdL5.js";import{n as c,t as l}from"./use-drop-zone-DMpyKOH_.js";import{a as u,i as d}from"./iframe-y9psNcyg.js";import{Ei as f,Ll as p,f as m,n as h}from"./build-module-CPA2Y5FH.js";function DropZoneComponent({className:e,icon:t=m,label:n,onFilesDrop:i,onHTMLDrop:s,onDrop:l,isEligible:u=()=>!0,...f}){let[h,_]=(0,r.useState)(),[v,y]=(0,r.useState)(),[b,x]=(0,r.useState)(),S=c({onDrop(e){if(!e.dataTransfer)return;let t=a(e.dataTransfer),n=e.dataTransfer.getData(`text/html`);n&&s?s(n):t.length&&i?i(t):l&&l(e)},onDragStart(e){_(!0),e.dataTransfer&&(e.dataTransfer.types.includes(`text/html`)?x(!!s):e.dataTransfer.types.includes(`Files`)||a(e.dataTransfer).length>0?x(!!i):x(!!l&&u(e.dataTransfer)))},onDragEnd(){y(!1),_(!1),x(void 0)},onDragEnter(){y(!0)},onDragLeave(){y(!1)}}),C=d(`components-drop-zone`,e,{"is-active":b,"is-dragging-over-document":h,"is-dragging-over-element":v});return(0,g.jsx)(`div`,{...f,ref:S,className:C,children:(0,g.jsx)(`div`,{className:`components-drop-zone__content`,children:(0,g.jsxs)(`div`,{className:`components-drop-zone__content-inner`,children:[(0,g.jsx)(p,{icon:t,className:`components-drop-zone__content-icon`}),(0,g.jsx)(`span`,{className:`components-drop-zone__content-text`,children:n||o(`Drop files to upload`)})]})})})}var g;function init_drop_zone(){return(init_drop_zone=e((()=>{u(),s(),n(),h(),i(),l(),g=t();try{DropZoneComponent.__docgenInfo={description:`\`DropZone\` is a component creating a drop zone area taking the full size of its parent element. It supports dropping files, HTML content or any other HTML drop event.

\`\`\`jsx
import { DropZone } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyDropZone = () => {
  const [ hasDropped, setHasDropped ] = useState( false );

  return (
    <div>
      { hasDropped ? 'Dropped!' : 'Drop something here' }
      <DropZone
        onFilesDrop={ () => setHasDropped( true ) }
        onHTMLDrop={ () => setHasDropped( true ) }
        onDrop={ () => setHasDropped( true ) }
      />
    </div>
  );
}
\`\`\``,displayName:`DropZoneComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/drop-zone/index.tsx`,methods:[],props:{className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/drop-zone/types.ts`,name:`TypeLiteral`}],description:"A CSS `class` to give to the wrapper element.",name:`className`,required:!1,tags:{},type:{name:`string`}},icon:{defaultValue:{value:`"upload"`},declarations:[{fileName:`gutenberg/packages/components/src/drop-zone/types.ts`,name:`TypeLiteral`}],description:`An icon to be shown within the drop zone area.`,name:`icon`,required:!1,tags:{},type:{name:`Element`}},label:{defaultValue:{value:"`__( 'Drop files to upload' )`"},declarations:[{fileName:`gutenberg/packages/components/src/drop-zone/types.ts`,name:`TypeLiteral`}],description:`A string to be shown within the drop zone area.`,name:`label`,required:!1,tags:{},type:{name:`string`}},onDrop:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/drop-zone/types.ts`,name:`TypeLiteral`}],description:"The function is generic drop handler called if the `onFilesDrop` or `onHTMLDrop` are not called.\nIt receives the drop `event` object as an argument.",name:`onDrop`,required:!1,tags:{},type:{name:`((event: DragEvent) => void)`}},onFilesDrop:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/drop-zone/types.ts`,name:`TypeLiteral`}],description:"The function is called when dropping a file into the `DropZone`.\nIt receives an array of dropped files as an argument.",name:`onFilesDrop`,required:!1,tags:{},type:{name:`((files: File[]) => void)`}},onHTMLDrop:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/drop-zone/types.ts`,name:`TypeLiteral`}],description:"The function is called when dropping HTML into the `DropZone`.\nIt receives the HTML being dropped as an argument.",name:`onHTMLDrop`,required:!1,tags:{},type:{name:`((html: string) => void)`}},isEligible:{defaultValue:{value:`() => true`},declarations:[{fileName:`gutenberg/packages/components/src/drop-zone/types.ts`,name:`TypeLiteral`}],description:`A function to determine if the drop zone is eligible to handle the drop
data transfer items.`,name:`isEligible`,required:!1,tags:{},type:{name:`((dataTransfer: DataTransfer) => boolean)`}}},tags:{}}}catch{}})))()}var _,v,y,b,Template,x;function init_index_story(){return(init_index_story=e((()=>{h(),init_drop_zone(),_=t(),{fn:v}=__STORYBOOK_MODULE_TEST__,y={upload:m,media:f},b={tags:[`manifest`],component:DropZoneComponent,id:`components-dropzone`,title:`Components/@wordpress-components/Selection & Input/File Upload/DropZone`,argTypes:{icon:{control:{type:`select`},options:Object.keys(y),mapping:y}},args:{onFilesDrop:v(),onHTMLDrop:v(),onDrop:v()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},Template=e=>(0,_.jsxs)(`div`,{style:{background:`lightgray`,padding:32,position:`relative`},children:[`Drop something here`,(0,_.jsx)(DropZoneComponent,{...e})]}),x=Template.bind({}),x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`props => {
  return <div style={{
    background: 'lightgray',
    padding: 32,
    position: 'relative'
  }}>
            Drop something here
            <DropZone {...props} />
        </div>;
}`,...x.parameters?.docs?.source}}}})))()}init_index_story();export{x as Default,b as default};