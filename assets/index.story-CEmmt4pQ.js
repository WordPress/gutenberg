import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{Go as n,Lo as r,n as i}from"./build-module-DttIWYbV.js";import{n as a,t as o}from"./icon-Caw5EMeD.js";import{a as s,c,i as l,l as u,n as d,o as f,r as p,s as m,t as h,u as g}from"./root-a6ClTbon.js";import{n as _,t as v}from"./provider-D9cDxnm1.js";var y,b,x,S,C,w,T,E;function init_index_story(){return(init_index_story=e((()=>{i(),a(),d(),_(),l(),f(),c(),g(),y=t(),b={title:`Components/@wordpress-ui/Tooltip`,id:`design-system-components-tooltip`,component:h,tags:[`manifest`],subcomponents:{"Tooltip.Provider":v,"Tooltip.Trigger":p,"Tooltip.Popup":s,"Tooltip.Positioner":m,"Tooltip.Portal":u},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},x={args:{children:[(0,y.jsx)(p,{"aria-label":`Save`,children:`💾`},`trigger`),(0,y.jsx)(s,{children:`Save`},`popup`)]}},S={...x,args:{...x.args,disabled:!0}},C={render:()=>(0,y.jsxs)(`div`,{style:{display:`flex`,gap:`2rem`,padding:`4rem`,justifyContent:`center`},children:[(0,y.jsxs)(h,{children:[(0,y.jsx)(p,{"aria-label":`Up`,children:`⬆️`}),(0,y.jsx)(s,{positioner:(0,y.jsx)(m,{side:`top`}),children:`Up`})]}),(0,y.jsxs)(h,{children:[(0,y.jsx)(p,{"aria-label":`Forward`,children:`➡️`}),(0,y.jsx)(s,{positioner:(0,y.jsx)(m,{side:`right`}),children:`Forward`})]}),(0,y.jsxs)(h,{children:[(0,y.jsx)(p,{"aria-label":`Down`,children:`⬇️`}),(0,y.jsx)(s,{positioner:(0,y.jsx)(m,{side:`bottom`}),children:`Down`})]}),(0,y.jsxs)(h,{children:[(0,y.jsx)(p,{"aria-label":`Back`,children:`⬅️`}),(0,y.jsx)(s,{positioner:(0,y.jsx)(m,{side:`left`}),children:`Back`})]})]})},w={args:{children:[(0,y.jsx)(p,{"aria-label":`Save`,children:`💾`},`trigger`),(0,y.jsx)(s,{positioner:(0,y.jsx)(m,{side:`right`,align:`start`,sideOffset:16}),children:`Save`},`popup`)]}},T={name:`With Custom z-index`,args:{children:[(0,y.jsx)(p,{"aria-label":`Save`,children:`💾`},`trigger`),(0,y.jsx)(s,{portal:(0,y.jsx)(u,{style:{"--wp-ui-tooltip-z-index":`9999`}}),children:`Save`},`popup`)]}},E={render:()=>(0,y.jsx)(v,{delay:0,children:(0,y.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`},children:[(0,y.jsxs)(h,{children:[(0,y.jsx)(p,{"aria-label":`Bold`,children:(0,y.jsx)(o,{icon:n})}),(0,y.jsx)(s,{children:`Bold`})]}),(0,y.jsxs)(h,{children:[(0,y.jsx)(p,{"aria-label":`Italic`,children:(0,y.jsx)(o,{icon:r})}),(0,y.jsx)(s,{children:`Italic`})]})]})})};try{S.__docgenInfo={description:`The \`disabled\` prop prevents the tooltip from showing, and can be used to
show the tooltip conditionally without rendering the underlying react
component conditionally (which could cause reconciliation issues).`,displayName:`Disabled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{C.__docgenInfo={description:'Customize where the tooltip appears relative to the trigger by passing a\n`<Tooltip.Positioner />` element to `Tooltip.Popup`\'s `positioner` prop.\n`Tooltip.Positioner` accepts `side`, `align`, `sideOffset`, and collision\nsettings; when `positioner` is omitted, the tooltip uses the defaults\n(`side="top"`, `align="center"`, `sideOffset={ 4 }`).',displayName:`Positioning`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{w.__docgenInfo={description:"Beyond `side`, `Tooltip.Positioner` accepts the rest of the positioner\nsurface — `align`, `alignOffset`, `sideOffset`, collision settings, and\nmore — for fine-grained placement.",displayName:`WithCustomPositioner`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{T.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a tooltip renders below another popover when you\nwant it above.\n\nThe `--wp-ui-tooltip-z-index` CSS variable controls the z-index of the\ntooltip's positioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  tooltip in the page), or\n- **Per instance**, by passing a `Tooltip.Portal` with a `style` (or\n  `className`) to `Tooltip.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{E.__docgenInfo={description:`Use \`Tooltip.Provider\` to control the delay before tooltips appear.
This is useful when you have multiple tooltips and want them to share
the same delay configuration.`,displayName:`WithProvider`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Tooltip.Trigger aria-label="Save" key="trigger">
                💾
            </Tooltip.Trigger>, <Tooltip.Popup key="popup">Save</Tooltip.Popup>]
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    disabled: true
  }
}`,...S.parameters?.docs?.source},description:{story:`The \`disabled\` prop prevents the tooltip from showing, and can be used to
show the tooltip conditionally without rendering the underlying react
component conditionally (which could cause reconciliation issues).`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '2rem',
    padding: '4rem',
    justifyContent: 'center'
  }}>
            <Tooltip.Root>
                <Tooltip.Trigger aria-label="Up">⬆️</Tooltip.Trigger>
                <Tooltip.Popup positioner={<Tooltip.Positioner side="top" />}>
                    Up
                </Tooltip.Popup>
            </Tooltip.Root>

            <Tooltip.Root>
                <Tooltip.Trigger aria-label="Forward">➡️</Tooltip.Trigger>
                <Tooltip.Popup positioner={<Tooltip.Positioner side="right" />}>
                    Forward
                </Tooltip.Popup>
            </Tooltip.Root>

            <Tooltip.Root>
                <Tooltip.Trigger aria-label="Down">⬇️</Tooltip.Trigger>
                <Tooltip.Popup positioner={<Tooltip.Positioner side="bottom" />}>
                    Down
                </Tooltip.Popup>
            </Tooltip.Root>

            <Tooltip.Root>
                <Tooltip.Trigger aria-label="Back">⬅️</Tooltip.Trigger>
                <Tooltip.Popup positioner={<Tooltip.Positioner side="left" />}>
                    Back
                </Tooltip.Popup>
            </Tooltip.Root>
        </div>
}`,...C.parameters?.docs?.source},description:{story:'Customize where the tooltip appears relative to the trigger by passing a\n`<Tooltip.Positioner />` element to `Tooltip.Popup`\'s `positioner` prop.\n`Tooltip.Positioner` accepts `side`, `align`, `sideOffset`, and collision\nsettings; when `positioner` is omitted, the tooltip uses the defaults\n(`side="top"`, `align="center"`, `sideOffset={ 4 }`).',...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Tooltip.Trigger aria-label="Save" key="trigger">
                💾
            </Tooltip.Trigger>, <Tooltip.Popup positioner={<Tooltip.Positioner side="right" align="start" sideOffset={16} />} key="popup">
                Save
            </Tooltip.Popup>]
  }
}`,...w.parameters?.docs?.source},description:{story:"Beyond `side`, `Tooltip.Positioner` accepts the rest of the positioner\nsurface — `align`, `alignOffset`, `sideOffset`, collision settings, and\nmore — for fine-grained placement.",...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    children: [<Tooltip.Trigger aria-label="Save" key="trigger">
                💾
            </Tooltip.Trigger>, <Tooltip.Popup portal={<Tooltip.Portal style={{
      '--wp-ui-tooltip-z-index': '9999'
    }} />} key="popup">
                Save
            </Tooltip.Popup>]
  }
}`,...T.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a tooltip renders below another popover when you\nwant it above.\n\nThe `--wp-ui-tooltip-z-index` CSS variable controls the z-index of the\ntooltip's positioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  tooltip in the page), or\n- **Per instance**, by passing a `Tooltip.Portal` with a `style` (or\n  `className`) to `Tooltip.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <Tooltip.Provider delay={0}>
            <div style={{
      display: 'flex',
      gap: '1rem'
    }}>
                <Tooltip.Root>
                    <Tooltip.Trigger aria-label="Bold">
                        <Icon icon={formatBold} />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>Bold</Tooltip.Popup>
                </Tooltip.Root>

                <Tooltip.Root>
                    <Tooltip.Trigger aria-label="Italic">
                        <Icon icon={formatItalic} />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>Italic</Tooltip.Popup>
                </Tooltip.Root>
            </div>
        </Tooltip.Provider>
}`,...E.parameters?.docs?.source},description:{story:`Use \`Tooltip.Provider\` to control the delay before tooltips appear.
This is useful when you have multiple tooltips and want them to share
the same delay configuration.`,...E.parameters?.docs?.description}}}})))()}init_index_story();export{x as Default,S as Disabled,C as Positioning,w as WithCustomPositioner,T as WithCustomZIndex,E as WithProvider,b as default};