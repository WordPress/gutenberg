import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{r as a,t as o}from"./build-module-BvdTt2vY.js";import{n as s,t as c}from"./button-lq-dgQsp.js";import{n as l,t as u}from"./stack-CzK5c0hq.js";import{a as d,c as f,i as p,n as m,o as h,r as g,s as _,t as v}from"./action-button-BU8d6N9s.js";import{i as y,n as b,r as x,t as S}from"./action-link-jsToDzbR.js";var C=t({PoliteStatus:()=>O,StaticNotice:()=>E,UrgentError:()=>D,default:()=>T}),w,T,E,D,O;function init_announcements_story(){return(init_announcements_story=e((()=>{r(),o(),s(),l(),f(),h(),p(),b(),y(),m(),w=n(),T={title:`Components/@wordpress-ui/Notice/Announcements`,id:`design-system-components-notice-announcements`,component:_,tags:[`!autodocs`],parameters:{controls:{disable:!0}}},E={render:()=>(0,w.jsxs)(_,{intent:`info`,children:[(0,w.jsx)(d,{children:`Your site is private. Only invited people can view it.`}),(0,w.jsx)(g,{children:(0,w.jsx)(S,{href:`https://wordpress.org/documentation/`,children:`Learn more`})})]})},D={render:function UrgentErrorExample(){let[e,t]=(0,i.useState)(!1),n=`Changes not saved`,r=`Your changes could not be saved because the connection was lost. Check your connection and try again.`;function saveChanges(){t(!0),a(`${n}. ${r}`,`assertive`)}return(0,w.jsxs)(u,{direction:`column`,gap:`md`,children:[(0,w.jsx)(c,{onClick:saveChanges,children:`Save changes`}),e&&(0,w.jsxs)(_,{intent:`error`,children:[(0,w.jsx)(x,{children:n}),(0,w.jsx)(d,{children:r}),(0,w.jsx)(g,{children:(0,w.jsx)(v,{onClick:()=>t(!1),children:`Try again`})})]})]})}},O={render:function PoliteStatusExample(){let[e,t]=(0,i.useState)(!1),n=`Draft saved`,r=`Your draft has been saved.`;function saveDraft(){t(!0),a(`${n}. ${r}`,`polite`)}return(0,w.jsxs)(u,{direction:`column`,gap:`md`,children:[(0,w.jsx)(c,{onClick:saveDraft,children:`Save draft`}),e&&(0,w.jsxs)(_,{intent:`success`,children:[(0,w.jsx)(x,{children:n}),(0,w.jsx)(d,{children:r}),(0,w.jsx)(g,{children:(0,w.jsx)(v,{onClick:()=>t(!1),children:`Dismiss`})})]})]})}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <Notice.Root intent="info">
            <Notice.Description>
                Your site is private. Only invited people can view it.
            </Notice.Description>
            <Notice.Actions>
                <Notice.ActionLink href="https://wordpress.org/documentation/">
                    Learn more
                </Notice.ActionLink>
            </Notice.Actions>
        </Notice.Root>
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: function UrgentErrorExample() {
    const [hasError, setHasError] = useState(false);
    const title = 'Changes not saved';
    const description = 'Your changes could not be saved because the connection was lost. Check your connection and try again.';
    function saveChanges() {
      setHasError(true);
      speak(\`\${title}. \${description}\`, 'assertive');
    }
    return <Stack direction="column" gap="md">
                <Button onClick={saveChanges}>Save changes</Button>
                {hasError && <Notice.Root intent="error">
                        <Notice.Title>{title}</Notice.Title>
                        <Notice.Description>{description}</Notice.Description>
                        <Notice.Actions>
                            <Notice.ActionButton onClick={() => setHasError(false)}>
                                Try again
                            </Notice.ActionButton>
                        </Notice.Actions>
                    </Notice.Root>}
            </Stack>;
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  render: function PoliteStatusExample() {
    const [isSaved, setIsSaved] = useState(false);
    const title = 'Draft saved';
    const description = 'Your draft has been saved.';
    function saveDraft() {
      setIsSaved(true);
      speak(\`\${title}. \${description}\`, 'polite');
    }
    return <Stack direction="column" gap="md">
                <Button onClick={saveDraft}>Save draft</Button>
                {isSaved && <Notice.Root intent="success">
                        <Notice.Title>{title}</Notice.Title>
                        <Notice.Description>{description}</Notice.Description>
                        <Notice.Actions>
                            <Notice.ActionButton onClick={() => setIsSaved(false)}>
                                Dismiss
                            </Notice.ActionButton>
                        </Notice.Actions>
                    </Notice.Root>}
            </Stack>;
  }
}`,...O.parameters?.docs?.source}}}})))()}export{init_announcements_story as a,C as i,E as n,D as r,O as t};