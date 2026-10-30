import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./use-copy-to-clipboard-CIXFEkaC.js";import{n as s,t as c}from"./text-C_0Rw7Zg.js";import{n as l,t as u}from"./stack-CzK5c0hq.js";import{a as d,c as f,i as p,n as m,o as h,r as g,s as _,t as v}from"./action-button-BU8d6N9s.js";var y=t({WithDetails:()=>C,default:()=>x});function CopyButton({text:e}){let[t,n]=(0,i.useState)(!1),r=a(e,()=>{n(!0)});return(0,i.useEffect)(()=>{n(!1)},[e]),(0,i.useEffect)(()=>{if(!t)return;let e=setTimeout(()=>{n(!1)},S);return()=>clearTimeout(e)},[t]),(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(v,{ref:r,variant:`outline`,children:`Copy error`}),(0,b.jsx)(d,{role:`status`,children:t?`Copied`:``})]})}var b,x,S,C;function init_disclosure_story(){return(init_disclosure_story=e((()=>{r(),o(),m(),h(),f(),p(),l(),s(),b=n(),x={title:`Components/@wordpress-ui/Notice/Disclosure`,id:`design-system-components-notice-disclosure`,tags:[`!autodocs`,`docs-only`],argTypes:{message:{control:`text`,description:`Example content rendered inside Notice.Description.`},details:{control:`text`,description:`Example content revealed by the disclosure.`}}},S=4e3,C={args:{message:`Updating failed. Please try updating again.`,details:`The title was rejected by a server-side rule.
Remove "Break save" from the title, then try again.`},render:function NoticeWithDetails({message:e,details:t}){let n=t.trim().length>0;return(0,b.jsxs)(_,{intent:`error`,children:[(0,b.jsxs)(d,{render:(0,b.jsx)(u,{direction:`column`,gap:`sm`}),style:{overflowWrap:`anywhere`},children:[(0,b.jsx)(`div`,{children:e}),n&&(0,b.jsxs)(`details`,{children:[(0,b.jsx)(`summary`,{children:`Details`}),(0,b.jsx)(c,{render:(0,b.jsx)(`pre`,{}),style:{marginBlockStart:`var(--wpds-dimension-gap-sm, 8px)`,whiteSpace:`pre-wrap`},children:t})]})]}),(0,b.jsx)(g,{render:(0,b.jsx)(u,{align:`center`}),children:(0,b.jsx)(CopyButton,{text:n?`${e}\n\n${t}`:e})})]})}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Updating failed. Please try updating again.',
    details: 'The title was rejected by a server-side rule.\\nRemove "Break save" from the title, then try again.'
  },
  render: function NoticeWithDetails({
    message,
    details
  }) {
    const hasDetails = details.trim().length > 0;
    return <Notice.Root intent="error">
                <Notice.Description render={<Stack direction="column" gap="sm" />} style={{
        overflowWrap: 'anywhere'
      }}>
                    <div>{message}</div>
                    {hasDetails && <details>
                            <summary>Details</summary>
                            <Text render={<pre />} style={{
            marginBlockStart: 'var(--wpds-dimension-gap-sm)',
            whiteSpace: 'pre-wrap'
          }}>
                                {details}
                            </Text>
                        </details>}
                </Notice.Description>
                <Notice.Actions render={<Stack align="center" />}>
                    <CopyButton text={hasDetails ? \`\${message}\\n\\n\${details}\` : message} />
                </Notice.Actions>
            </Notice.Root>;
  }
}`,...C.parameters?.docs?.source}}}})))()}export{y as n,init_disclosure_story as r,C as t};