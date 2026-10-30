import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,r,s as i,t as a}from"./build-module-CI6dFhun.js";import{E as o,Rr as s,Vs as c,Xr as l,_s as u,dc as d,f,i as p,n as m}from"./build-module-DttIWYbV.js";import{c as h,s as g}from"./root-a6ClTbon.js";import{n as _,t as v}from"./provider-D9cDxnm1.js";import{n as y,t as b}from"./icon-button-DGP9SuUN.js";var x,S,C,w,T,E,D,O,k,A,j,M,N;function init_index_story(){return(init_index_story=e((()=>{m(),r(),y(),_(),h(),x=t(),S={title:`Components/@wordpress-ui/IconButton`,id:`design-system-components-iconbutton`,component:b,argTypes:{"aria-pressed":{control:{type:`boolean`}}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, text overflow behavior, and overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},C={args:{icon:d,label:`Settings`}},w={...C,args:{...C.args,variant:`outline`}},T={...C,args:{...C.args,variant:`minimal`}},E={...C,args:{...C.args,tone:`neutral`,label:`Settings`}},D={...C,args:{...C.args,tone:`neutral`,variant:`outline`,label:`Settings`}},O={...C,args:{...C.args,disabled:!0,label:`Settings`}},k={...C,render:e=>(0,x.jsx)(v,{children:(0,x.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`,alignItems:`center`,flexWrap:`wrap`},children:[(0,x.jsx)(b,{...e,icon:p,label:`WordPress`}),(0,x.jsx)(b,{...e,icon:s,label:`Add`}),(0,x.jsx)(b,{...e,icon:l,label:`Edit`}),(0,x.jsx)(b,{...e,icon:o,label:`Delete`}),(0,x.jsx)(b,{...e,icon:u,label:`Download`}),(0,x.jsx)(b,{...e,icon:f,label:`Upload`})]})})},A={...C,args:{...C.args,tone:`neutral`,variant:`minimal`,label:`Toggle Settings`,"aria-pressed":!0}},j={displayShortcut:n.primary(`c`),ariaKeyShortcut:a.primary(`c`),label:i.primary(`c`)},M={...C,args:{...C.args,icon:c,label:`Copy`,shortcut:j}},N={...C,args:{...C.args,positioner:(0,x.jsx)(g,{side:`right`})}};try{A.__docgenInfo={description:'The pressed state is only available for buttons with `tone="neutral"` and\n`variant="minimal"` and can be toggled via the `aria-pressed` HTML attribute.',displayName:`Pressed`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/icon-button/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{M.__docgenInfo={description:"Use the `displayShortcut`, `ariaKeyShortcut`, and `shortcutAriaLabel` helpers\nfrom `@wordpress/keycodes` to create the visual, ARIA-compatible, and\nhuman-readable representations of the shortcut.",displayName:`WithShortcut`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/icon-button/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{N.__docgenInfo={description:"Customize where the tooltip appears relative to the button by passing a\n`<Tooltip.Positioner />` element with a `side` to the `positioner` prop.",displayName:`WithCustomPositioner`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/icon-button/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    icon: cog,
    label: 'Settings'
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    variant: 'outline'
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    variant: 'minimal'
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    tone: 'neutral',
    label: 'Settings'
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    tone: 'neutral',
    variant: 'outline',
    label: 'Settings'
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    disabled: true,
    label: 'Settings'
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  ...Default,
  render: args => <Tooltip.Provider>
            <div style={{
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
                <IconButton {...args} icon={wordpress} label="WordPress" />
                <IconButton {...args} icon={plus} label="Add" />
                <IconButton {...args} icon={pencil} label="Edit" />
                <IconButton {...args} icon={trash} label="Delete" />
                <IconButton {...args} icon={download} label="Download" />
                <IconButton {...args} icon={upload} label="Upload" />
            </div>
        </Tooltip.Provider>
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    tone: 'neutral',
    variant: 'minimal',
    label: 'Toggle Settings',
    'aria-pressed': true
  }
}`,...A.parameters?.docs?.source},description:{story:'The pressed state is only available for buttons with `tone="neutral"` and\n`variant="minimal"` and can be toggled via the `aria-pressed` HTML attribute.',...A.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    icon: copy,
    label: 'Copy',
    shortcut: EXAMPLE_SHORTCUT_OBJECT
  }
}`,...M.parameters?.docs?.source},description:{story:"Use the `displayShortcut`, `ariaKeyShortcut`, and `shortcutAriaLabel` helpers\nfrom `@wordpress/keycodes` to create the visual, ARIA-compatible, and\nhuman-readable representations of the shortcut.",...M.parameters?.docs?.description}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    positioner: <Tooltip.Positioner side="right" />
  }
}`,...N.parameters?.docs?.source},description:{story:"Customize where the tooltip appears relative to the button by passing a\n`<Tooltip.Positioner />` element with a `side` to the `positioner` prop.",...N.parameters?.docs?.description}}}})))()}init_index_story();export{C as Default,O as Disabled,T as Minimal,E as Neutral,D as NeutralOutline,w as Outline,A as Pressed,N as WithCustomPositioner,k as WithDifferentIcons,M as WithShortcut,S as default};