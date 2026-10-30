import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{t as n}from"./build-module-CqL0UdL5.js";import{t as r}from"./build-module-BvdTt2vY.js";import{Fc as i,n as a}from"./build-module-DttIWYbV.js";import{n as o,t as s}from"./icon-BoYSwVRb.js";import{n as c,t as l}from"./spinner-Dh3DKqKc.js";import{n as u,t as d}from"./snackbar-vHzxhUsH.js";import{t as f}from"./build-module-DWSS6WmV.js";var p,m,h;function init_upload_progress_snackbar(){return(init_upload_progress_snackbar=e((()=>{n(),r(),f(),o(),c(),a(),p=t(),m=(0,p.jsx)(`span`,{className:`editor-upload-progress-snackbar__spinner`,"aria-hidden":`true`,children:(0,p.jsx)(l,{})}),h=(0,p.jsx)(`span`,{className:`editor-upload-progress-snackbar__check`,"aria-hidden":`true`,children:(0,p.jsx)(s,{icon:i})})})))()}var g,_,v,y,b,x;function init_index_story(){return(init_index_story=e((()=>{u(),init_upload_progress_snackbar(),g=t(),_={id:`editor-uploadprogresssnackbar`,title:`Editor/Upload Progress Snackbar`,component:d,parameters:{docs:{canvas:{sourceState:`shown`},description:{component:`The \`UploadProgressSnackbar\` component itself renders no UI: it manages a
snackbar notice via the notices store while media uploads are in progress.

These stories render the \`Snackbar\` with the same icon markup and text the
notice produces, so the in-progress and completed states can be reviewed
visually without running an actual upload.`}}},argTypes:{icon:{control:!1},children:{control:!1}}},v={args:{icon:m,children:`Uploading — sunset-over-the-bay.jpg`,explicitDismiss:!0}},y={args:{icon:m,children:`Uploading 1 of 3 — sunset-over-the-bay.jpg`,explicitDismiss:!0}},b={args:{icon:h,children:`Upload complete`}},x={render:()=>(0,g.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,alignItems:`flex-start`,gap:`12px`},children:[(0,g.jsx)(d,{icon:m,explicitDismiss:!0,children:`Uploading — sunset-over-the-bay.jpg`}),(0,g.jsx)(d,{icon:m,explicitDismiss:!0,children:`Uploading 1 of 3 — sunset-over-the-bay.jpg`}),(0,g.jsx)(d,{icon:h,children:`Upload complete`})]})};try{x.__docgenInfo={description:`All states shown together for quick comparison of the icon alignment and
sizing between the spinner and the completion checkmark.`,displayName:`AllStates`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/editor/src/components/upload-progress-snackbar/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    icon: UPLOAD_SPINNER,
    children: 'Uploading — sunset-over-the-bay.jpg',
    explicitDismiss: true
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    icon: UPLOAD_SPINNER,
    children: 'Uploading 1 of 3 — sunset-over-the-bay.jpg',
    explicitDismiss: true
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    icon: UPLOAD_DONE,
    children: 'Upload complete'
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px'
  }}>
            <Snackbar icon={UPLOAD_SPINNER} explicitDismiss>
                Uploading — sunset-over-the-bay.jpg
            </Snackbar>
            <Snackbar icon={UPLOAD_SPINNER} explicitDismiss>
                Uploading 1 of 3 — sunset-over-the-bay.jpg
            </Snackbar>
            <Snackbar icon={UPLOAD_DONE}>Upload complete</Snackbar>
        </div>
}`,...x.parameters?.docs?.source},description:{story:`All states shown together for quick comparison of the icon alignment and
sizing between the spinner and the completion checkmark.`,...x.parameters?.docs?.description}}}})))()}init_index_story();export{x as AllStates,b as Complete,v as Uploading,y as UploadingMultiple,_ as default};