import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-reduced-motion-ocRupczh.js";import{a as o,i as s}from"./iframe-y9psNcyg.js";import{n as c,t as l}from"./proxy-Dy5IRRym.js";import{n as u,t as d}from"./AnimatePresence-BALm1Kwi.js";import{n as f,t as p}from"./snackbar-BG29yRCq.js";function SnackbarList({notices:e,className:t,children:n,onRemove:a}){let o=(0,r.useRef)(null),l=i();t=s(`components-snackbar-list`,t);let removeNotice=e=>()=>a?.(e.id);return(0,m.jsxs)(`div`,{className:t,tabIndex:-1,ref:o,"data-testid":`snackbar-list`,children:[n,(0,m.jsx)(d,{children:e.map(e=>{let{content:t,...n}=e;return(0,m.jsx)(c.div,{layout:!l&&`position`,style:{width:`100%`},initial:`init`,animate:`open`,exit:`exit`,variants:l?void 0:h,children:(0,m.jsx)(`div`,{className:`components-snackbar-list__notice-container`,children:(0,m.jsx)(p,{...n,onRemove:removeNotice(e),listRef:o,children:e.content})})},e.id)})})]})}var m,h;function init_list(){return(init_list=e((()=>{o(),a(),n(),f(),l(),u(),m=t(),h={init:{height:0,opacity:0},open:{height:`auto`,opacity:1,transition:{height:{type:`tween`,duration:.3,ease:[0,0,.2,1]},opacity:{type:`tween`,duration:.25,delay:.05,ease:[0,0,.2,1]}}},exit:{opacity:0,transition:{type:`tween`,duration:.1,ease:[0,0,.2,1]}}};try{SnackbarList.__docgenInfo={description:`Renders a list of notices.

\`\`\`jsx
const MySnackbarListNotice = () => (
  <SnackbarList
    notices={ notices }
    onRemove={ removeNotice }
  />
);
\`\`\``,displayName:`SnackbarList`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/snackbar/list.tsx`,methods:[],props:{notices:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/snackbar/types.ts`,name:`TypeLiteral`}],description:``,name:`notices`,required:!0,tags:{},type:{name:`(Omit<SnackbarProps, "children"> & { id: string; content: string; })[]`}},onRemove:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/snackbar/types.ts`,name:`TypeLiteral`}],description:``,name:`onRemove`,required:!0,tags:{},type:{name:`(id: string) => void`}},as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element or React component to render the component as.`,name:`as`,required:!1,tags:{},type:{name:`JSXElementConstructor<any> | keyof IntrinsicElements`}}},tags:{}}}catch{}})))()}var g,_,Default;function init_list_story(){return(init_list_story=e((()=>{n(),init_list(),g=t(),_={title:`Components/@wordpress-components/Feedback/SnackbarList`,id:`components-snackbarlist`,component:SnackbarList,argTypes:{as:{control:!1},onRemove:{action:`onRemove`,control:!1}},parameters:{a11y:{test:`todo`},controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}}}},Default=({children:e,notices:t,...n})=>{let[i,a]=(0,r.useState)(t),onRemove=e=>{let t=i.findIndex(t=>t.id===e);t>-1&&a([...i.slice(0,t),...i.slice(t+1)])};return(0,g.jsx)(SnackbarList,{...n,notices:i,onRemove,children:e})},Default.args={children:`Use SnackbarList to communicate multiple low priority, non-interruptive messages to the user.`,notices:[{id:`SAVE_POST_NOTICE_ID_1`,spokenMessage:`Post published.`,actions:[{label:`View Post`,url:`https://example.com/?p=522`}],content:`Post published.`,explicitDismiss:!1},{id:`SAVE_POST_NOTICE_ID_2`,spokenMessage:`Post updated`,actions:[{label:`View Post`,url:`https://example.com/?p=522`}],content:`Post updated.`,explicitDismiss:!1},{id:`global1`,spokenMessage:`All content copied.`,actions:[],content:`All content copied.`,explicitDismiss:!1}]},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`({
  children,
  notices: noticesProp,
  ...props
}) => {
  const [notices, setNotices] = useState(noticesProp);
  const onRemove = (id: string) => {
    const matchIndex = notices.findIndex(n => n.id === id);
    if (matchIndex > -1) {
      setNotices([...notices.slice(0, matchIndex), ...notices.slice(matchIndex + 1)]);
    }
  };
  return <SnackbarList {...props} notices={notices} onRemove={onRemove}>
            {children}
        </SnackbarList>;
}`,...Default.parameters?.docs?.source}}}})))()}init_list_story();export{Default,_ as default};