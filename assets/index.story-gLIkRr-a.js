import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./button-lq-dgQsp.js";import{n as s,t as c}from"./visually-hidden-BD0tKS3_.js";import{n as l,t as u}from"./stack-CzK5c0hq.js";import{n as d,t as f}from"./badge-MVEXENlY.js";import{n as p,t as m}from"./link-DGItCQU-.js";import{a as h,h as g,l as _,n as v,t as y}from"./popover-DgIRy3p9.js";var b=t({AllIntents:()=>O,Default:()=>w,InfotipWithButton:()=>D,InfotipWithLink:()=>E,WithInfotip:()=>T,default:()=>C}),x,S,C,w,T,E,D,O;function init_index_story(){return(init_index_story=e((()=>{r(),d(),y(),s(),p(),a(),l(),x=n(),{action:S}=__STORYBOOK_MODULE_ACTIONS__,C={tags:[`manifest`],title:`Components/@wordpress-ui/Badge`,id:`design-system-components-badge`,component:f,parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},w={args:{children:`Badge`}},T={args:{children:`Special requirements`,intent:`informational`,infotip:{popover:v,popup:(0,x.jsxs)(_,{style:{maxWidth:`min(var(--wpds-dimension-surface-width-sm, 320px), var(--available-width))`},children:[(0,x.jsx)(c,{render:(0,x.jsx)(h,{}),children:`Special requirements`}),(0,x.jsx)(g,{children:`This domain requires a local address in the country where it is registered.`})]})}}},E={args:{children:`HSTS required`,intent:`medium`,infotip:{popover:v,popup:(0,x.jsxs)(_,{style:{maxWidth:`min(var(--wpds-dimension-surface-width-sm, 320px), var(--available-width))`},children:[(0,x.jsx)(c,{render:(0,x.jsx)(h,{}),children:`HSTS required`}),(0,x.jsxs)(g,{children:[`This domain requires HTTPS for every connection.`,` `,(0,x.jsx)(m,{href:`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security`,children:`Learn about HSTS`})]})]})}}},D={args:{children:`Failed`,intent:`high`,infotip:{popover:v,popup:(0,x.jsxs)(_,{style:{maxWidth:`min(var(--wpds-dimension-surface-width-sm, 320px), var(--available-width))`},children:[(0,x.jsx)(c,{render:(0,x.jsx)(h,{}),children:`Upload failed`}),(0,x.jsxs)(u,{direction:`column`,gap:`sm`,children:[(0,x.jsx)(g,{children:`The upload was interrupted. Check your connection and try again.`}),(0,x.jsx)(u,{direction:`row`,justify:`flex-end`,children:(0,x.jsx)(o,{variant:`minimal`,tone:`neutral`,size:`compact`,onClick:S(`Retry upload`),children:`Retry upload`})})]})]})}}},O={args:{...T.args,children:`Status`},render:e=>(0,x.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(3, max-content)`,justifyItems:`start`,gap:`var(--wpds-dimension-gap-lg, 16px)`,alignItems:`center`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:[(0,x.jsx)(`strong`,{children:`Intent`}),(0,x.jsx)(`strong`,{children:`Static`}),(0,x.jsx)(`strong`,{children:`With infotip`}),[`high`,`medium`,`low`,`stable`,`informational`,`draft`,`none`].map(t=>(0,x.jsxs)(i.Fragment,{children:[(0,x.jsx)(`span`,{children:t}),(0,x.jsx)(f,{...e,intent:t,infotip:void 0}),(0,x.jsx)(f,{...e,intent:t})]},t))]})};try{T.__docgenInfo={description:`Use an infotip sparingly when a status needs a short explanation.
The whole badge opens the popup on hover or activation.`,displayName:`WithInfotip`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/badge/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{E.__docgenInfo={description:`A related link can follow the explanation. Keep important recovery actions
available elsewhere in the interface too.`,displayName:`InfotipWithLink`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/badge/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{D.__docgenInfo={description:`Prefer at most one related action. Use a detail view or dialog for longer
workflows, and make essential recovery actions available outside the infotip.`,displayName:`InfotipWithButton`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/badge/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Badge'
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Special requirements',
    intent: 'informational',
    infotip: {
      popover: Popover,
      popup: <Popover.Popup style={{
        maxWidth: 'min(var(--wpds-dimension-surface-width-sm), var(--available-width))'
      }}>
                    <VisuallyHidden render={<Popover.Title />}>
                        Special requirements
                    </VisuallyHidden>
                    <Popover.Description>
                        This domain requires a local address in the country
                        where it is registered.
                    </Popover.Description>
                </Popover.Popup>
    }
  }
}`,...T.parameters?.docs?.source},description:{story:`Use an infotip sparingly when a status needs a short explanation.
The whole badge opens the popup on hover or activation.`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'HSTS required',
    intent: 'medium',
    infotip: {
      popover: Popover,
      popup: <Popover.Popup style={{
        maxWidth: 'min(var(--wpds-dimension-surface-width-sm), var(--available-width))'
      }}>
                    <VisuallyHidden render={<Popover.Title />}>
                        HSTS required
                    </VisuallyHidden>
                    <Popover.Description>
                        This domain requires HTTPS for every connection.{' '}
                        <Link href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security">
                            Learn about HSTS
                        </Link>
                    </Popover.Description>
                </Popover.Popup>
    }
  }
}`,...E.parameters?.docs?.source},description:{story:`A related link can follow the explanation. Keep important recovery actions
available elsewhere in the interface too.`,...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Failed',
    intent: 'high',
    infotip: {
      popover: Popover,
      popup: <Popover.Popup style={{
        maxWidth: 'min(var(--wpds-dimension-surface-width-sm), var(--available-width))'
      }}>
                    <VisuallyHidden render={<Popover.Title />}>
                        Upload failed
                    </VisuallyHidden>
                    <Stack direction="column" gap="sm">
                        <Popover.Description>
                            The upload was interrupted. Check your connection
                            and try again.
                        </Popover.Description>
                        <Stack direction="row" justify="flex-end">
                            <Button variant="minimal" tone="neutral" size="compact" onClick={action('Retry upload')}>
                                Retry upload
                            </Button>
                        </Stack>
                    </Stack>
                </Popover.Popup>
    }
  }
}`,...D.parameters?.docs?.source},description:{story:`Prefer at most one related action. Use a detail view or dialog for longer
workflows, and make essential recovery actions available outside the infotip.`,...D.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    ...WithInfotip.args,
    children: 'Status'
  },
  render: args => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, max-content)',
    justifyItems: 'start',
    gap: 'var(--wpds-dimension-gap-lg)',
    alignItems: 'center',
    color: 'var(--wpds-color-foreground-content-neutral)'
  }}>
            <strong>Intent</strong>
            <strong>Static</strong>
            <strong>With infotip</strong>
            {(['high', 'medium', 'low', 'stable', 'informational', 'draft', 'none'] as const).map(intent => <Fragment key={intent}>
                    <span>{intent}</span>
                    <Badge {...args} intent={intent} infotip={undefined} />
                    <Badge {...args} intent={intent} />
                </Fragment>)}
        </div>
}`,...O.parameters?.docs?.source}}}})))()}export{init_index_story as a,b as i,E as n,T as r,D as t};