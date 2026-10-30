import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./react-CfMABiEl.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{a,i as o}from"./iframe-BbJPeSVw.js";import{n as s,t as c}from"./button-01oyTe_f.js";import{n as l,t as u}from"./notice-DuRdZfpP.js";function NoticeList({notices:e,onRemove:t=noop,className:n,children:r}){let removeNotice=e=>()=>t(e);return n=o(`components-notice-list`,n),(0,f.jsxs)(`div`,{className:n,children:[r,[...e].reverse().map(e=>{let{content:t,...n}=e;return(0,d.createElement)(u,{...n,key:e.id,onRemove:removeNotice(e.id)},e.content)})]})}var d,f,noop;function init_list(){return(init_list=e((()=>{a(),l(),d=t(),f=n(),noop=()=>{};try{NoticeList.__docgenInfo={description:`\`NoticeList\` is a component used to render a collection of notices.

\`\`\`jsx
import { Notice, NoticeList } from \`@wordpress/components\`;

const MyNoticeList = () => {
const [ notices, setNotices ] = useState( [
	{
		id: 'second-notice',
		content: 'second notice content',
	},
	{
		id: 'fist-notice',
		content: 'first notice content',
	},
] );

const removeNotice = ( id ) => {
	setNotices( notices.filter( ( notice ) => notice.id !== id ) );
};

return <NoticeList notices={ notices } onRemove={ removeNotice } />;
};
\`\`\``,displayName:`NoticeList`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/notice/list.tsx`,methods:[],props:{notices:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/notice/types.ts`,name:`TypeLiteral`}],description:`Array of notices to render.`,name:`notices`,required:!0,tags:{},type:{name:`(Omit<NoticeProps, "children"> & { id: string; content: string; })[]`}},onRemove:{defaultValue:{value:`() => {}`},declarations:[{fileName:`gutenberg/packages/components/src/notice/types.ts`,name:`TypeLiteral`}],description:`Function called when a notice should be removed / dismissed.`,name:`onRemove`,required:!1,tags:{},type:{name:`((id: string) => void)`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/notice/types.ts`,name:`TypeLiteral`}],description:`Children to be rendered inside the notice list.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var p,m,h,Template,g,_,v,y,NoticeListSubcomponent,b;function init_index_story(){return(init_index_story=e((()=>{r(),l(),s(),init_list(),p=n(),{fn:m}=__STORYBOOK_MODULE_TEST__,h={title:`Components/@wordpress-components/Feedback/Notice`,id:`components-notice`,component:u,subcomponents:{NoticeList},args:{onDismiss:m(),onRemove:m()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`Notice`](?path=/docs/design-system-components-notice--docs) from `@wordpress/ui` instead."}}},Template=e=>(0,p.jsx)(u,{...e}),g=Template.bind({}),g.args={children:`This is a notice.`},_=Template.bind({}),_.args={...g.args,politeness:`assertive`,spokenMessage:`This is a notice with a custom spoken message`},v=Template.bind({}),v.args={...g.args,children:(0,p.jsxs)(p.Fragment,{children:[(0,p.jsxs)(`p`,{children:[`JSX elements can be helpful`,(0,p.jsx)(`strong`,{children:` if you need to format`}),` the notice output.`]}),(0,p.jsx)(`code`,{children:`note: in the interest of consistency, this should not be overused!`})]})},y=Template.bind({}),y.args={...g.args,actions:[{label:`Click me!`,onClick:()=>{},variant:`primary`},{label:`Or click me instead!`,onClick:()=>{}},{label:`Or visit a link for more info`,url:`https://wordpress.org`,variant:`link`}]},NoticeListSubcomponent=()=>{let e=[{id:`second-notice`,content:`second notice content`},{id:`first-notice`,content:`first notice content`,actions:[{label:`Click me!`,onClick:()=>{},variant:`primary`},{label:`Or click me instead!`,onClick:()=>{}},{label:`Or visit a link for more info`,url:`https://wordpress.org`,variant:`link`}]}],[t,n]=(0,i.useState)(e),removeNotice=e=>{n(t.filter(t=>t.id!==e))},resetNotices=()=>{n(e)};return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(NoticeList,{notices:t,onRemove:removeNotice}),(0,p.jsx)(c,{__next40pxDefaultSize:!0,variant:`primary`,onClick:resetNotices,children:`Reset Notices`})]})},NoticeListSubcomponent.storyName=`NoticeList Subcomponent`,b=Template.bind({}),b.args={...g.args,children:`This notice has a disabled action.`,actions:[{label:`Disabled action`,onClick:()=>{},disabled:!0},{label:`Enabled action`,onClick:()=>{}}]};try{b.__docgenInfo={description:`Action buttons can be disabled.`,displayName:`WithDisabledAction`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/notice/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`props => {
  return <Notice {...props} />;
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`props => {
  return <Notice {...props} />;
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`props => {
  return <Notice {...props} />;
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`props => {
  return <Notice {...props} />;
}`,...y.parameters?.docs?.source}}},NoticeListSubcomponent.parameters={...NoticeListSubcomponent.parameters,docs:{...NoticeListSubcomponent.parameters?.docs,source:{originalSource:`() => {
  const exampleNotices: NoticeListProps['notices'] = [{
    id: 'second-notice',
    content: 'second notice content'
  }, {
    id: 'first-notice',
    content: 'first notice content',
    actions: [{
      label: 'Click me!',
      onClick: () => {},
      variant: 'primary'
    }, {
      label: 'Or click me instead!',
      onClick: () => {}
    }, {
      label: 'Or visit a link for more info',
      url: 'https://wordpress.org',
      variant: 'link'
    }]
  }];
  const [notices, setNotices] = useState(exampleNotices);
  const removeNotice = (id: NoticeListProps['notices'][number]['id']) => {
    setNotices(notices.filter(notice => notice.id !== id));
  };
  const resetNotices = () => {
    setNotices(exampleNotices);
  };
  return <>
            <NoticeList notices={notices} onRemove={removeNotice} />
            <Button __next40pxDefaultSize variant="primary" onClick={resetNotices}>
                Reset Notices
            </Button>
        </>;
}`,...NoticeListSubcomponent.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`props => {
  return <Notice {...props} />;
}`,...b.parameters?.docs?.source},description:{story:`Action buttons can be disabled.`,...b.parameters?.docs?.description}}}})))()}init_index_story();export{g as Default,NoticeListSubcomponent,y as WithActions,_ as WithCustomSpokenMessage,b as WithDisabledAction,v as WithJSXChildren,h as default};