import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{f as i,n as a}from"./build-module-CPA2Y5FH.js";import{n as o,t as s}from"./button-8ccnOjTA.js";function FormFileUpload({accept:e,children:t,multiple:n=!1,onChange:i,onClick:a,render:o,__next40pxDefaultSize:l,...u}){let d=(0,r.useRef)(null),openFileDialog=()=>{d.current?.click()},f=o?o({openFileDialog}):(0,c.jsx)(s,{onClick:openFileDialog,__next40pxDefaultSize:!0,...u,children:t}),p=e?.includes(`audio/*`)?`${e}, audio/mp3, audio/x-m4a, audio/x-m4b, audio/x-m4p, audio/x-wav, audio/webm`:e;return(0,c.jsxs)(`div`,{className:`components-form-file-upload`,children:[f,(0,c.jsx)(`input`,{type:`file`,ref:d,multiple:n,style:{display:`none`},accept:p,onChange:i,onClick:a,"data-testid":`form-file-upload-input`})]})}var c;function init_form_file_upload(){return(init_form_file_upload=e((()=>{n(),o(),c=t();try{FormFileUpload.__docgenInfo={description:`FormFileUpload allows users to select files from their local device.

\`\`\`jsx
import { FormFileUpload } from '@wordpress/components';

const MyFormFileUpload = () => (
  <FormFileUpload
    accept="image/*"
    onChange={ ( event ) => console.log( event.currentTarget.files ) }
  >
    Upload
  </FormFileUpload>
);
\`\`\``,displayName:`FormFileUpload`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/form-file-upload/index.tsx`,methods:[],props:{__next40pxDefaultSize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:`Start opting into the larger default height that will become the default size in a future version.
@deprecated Default behavior since WordPress 7.1. Prop can be safely removed.
@ignore`,name:`__next40pxDefaultSize`,required:!1,tags:{},type:{name:`boolean`}},accept:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:"A string passed to the `input` element that tells the browser which\n[file types](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Unique_file_type_specifiers)\ncan be uploaded by the user. e.g: `image/*,video/*`.",name:`accept`,required:!1,tags:{},type:{name:`string`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:"Children are passed as children of `Button`.",name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},icon:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:`The icon to render in the default button.

See the \`Icon\` component docs for more information.`,name:`icon`,required:!1,tags:{},type:{name:`IconType | null`}},multiple:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:`Whether to allow multiple selection of files or not.`,name:`multiple`,required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:"Callback function passed directly to the `input` file element.\n\nSelect files will be available in `event.currentTarget.files`.",name:`onChange`,required:!0,tags:{},type:{name:`ChangeEventHandler<HTMLInputElement, HTMLInputElement> | undefined`}},onClick:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:`Callback function passed directly to the \`input\` file element.

This can be useful when you want to force a \`change\` event to fire when
the user chooses the same file again. To do this, set the target value to
an empty string in the \`onClick\` function.

\`\`\`jsx
<FormFileUpload
  onClick={ ( event ) => ( event.target.value = '' ) }
  onChange={ onChange }
>
  Upload
</FormFileUpload>
\`\`\``,name:`onClick`,required:!1,tags:{},type:{name:`MouseEventHandler<HTMLInputElement>`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/form-file-upload/types.ts`,name:`TypeLiteral`}],description:`Optional callback function used to render the UI.

If passed, the component does not render the default UI (a button) and
calls this function to render it. The function receives an object with
property \`openFileDialog\`, a function that, when called, opens the browser
native file upload modal window.`,name:`render`,required:!1,tags:{},type:{name:`((arg: { openFileDialog: () => void; }) => ReactNode)`}}},tags:{}}}catch{}})))()}var l,u,Template,d,f,p,m,h;function init_index_story(){return(init_index_story=e((()=>{a(),init_form_file_upload(),l=t(),u={tags:[`manifest`],title:`Components/@wordpress-components/Selection & Input/File Upload/FormFileUpload`,id:`components-formfileupload`,component:FormFileUpload,argTypes:{icon:{control:!1},onChange:{action:`onChange`,control:!1},onClick:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},Template=e=>(0,l.jsx)(FormFileUpload,{...e}),d=Template.bind({}),d.args={children:`Select file`},f=Template.bind({}),f.args={...d.args,accept:`image/*`,children:`Select image`},p=Template.bind({}),p.args={...d.args,children:`Select files`,multiple:!0},m=Template.bind({}),m.args={...d.args,children:`Upload`,icon:i},h=Template.bind({}),h.args={...d.args,render:({openFileDialog:e})=>(0,l.jsx)(`button`,{onClick:e,children:`Custom Upload Button`})};try{h.__docgenInfo={description:"Render a custom trigger button by passing a render function to the `render` prop.\n\n```jsx\n( { openFileDialog } ) => <button onClick={ openFileDialog }>Custom Upload Button</button>\n```",displayName:`WithCustomRender`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/form-file-upload/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`props => {
  return <FormFileUpload {...props} />;
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`props => {
  return <FormFileUpload {...props} />;
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`props => {
  return <FormFileUpload {...props} />;
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`props => {
  return <FormFileUpload {...props} />;
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`props => {
  return <FormFileUpload {...props} />;
}`,...h.parameters?.docs?.source},description:{story:"Render a custom trigger button by passing a render function to the `render` prop.\n\n```jsx\n( { openFileDialog } ) => <button onClick={ openFileDialog }>Custom Upload Button</button>\n```",...h.parameters?.docs?.description}}}})))()}init_index_story();export{p as AllowMultipleFiles,d as Default,f as RestrictFileTypes,h as WithCustomRender,m as WithIcon,u as default};