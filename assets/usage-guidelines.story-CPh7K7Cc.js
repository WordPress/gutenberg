import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{Go as r,La as i,Lo as a,_o as o,n as s}from"./build-module-DttIWYbV.js";import{n as c,t as l}from"./icon-Caw5EMeD.js";import{a as u,i as d,n as f,o as p,r as m,t as h}from"./root-a6ClTbon.js";import{n as g,t as _}from"./provider-D9cDxnm1.js";import{n as v,t as y}from"./visually-hidden-BD0tKS3_.js";import{n as b,t as x}from"./icon-button-DGP9SuUN.js";import{a as S,h as C,l as w,r as T,s as E,t as D,y as O}from"./popover-DgIRy3p9.js";var k=t({IconButtonWithTooltip:()=>P,InfotipWithPopover:()=>N,RecommendedUsage:()=>M,default:()=>j}),A,j,M,N,P;function init_usage_guidelines_story(){return(init_usage_guidelines_story=e((()=>{s(),g(),f(),d(),p(),c(),b(),D(),v(),A=n(),j={title:`Components/@wordpress-ui/Tooltip/Usage Guidelines`,id:`design-system-components-tooltip-usage-guidelines`,parameters:{controls:{disable:!0}},tags:[`!dev`]},M={render:()=>(0,A.jsx)(_,{delay:0,children:(0,A.jsxs)(`div`,{style:{display:`flex`,gap:`0.25rem`},children:[(0,A.jsxs)(h,{children:[(0,A.jsx)(m,{"aria-label":`Bold`,children:(0,A.jsx)(l,{icon:r})}),(0,A.jsx)(u,{children:`Bold`})]}),(0,A.jsxs)(h,{children:[(0,A.jsx)(m,{"aria-label":`Italic`,children:(0,A.jsx)(l,{icon:a})}),(0,A.jsx)(u,{children:`Italic`})]}),(0,A.jsxs)(h,{children:[(0,A.jsx)(m,{"aria-label":`Underline`,children:(0,A.jsx)(l,{icon:o})}),(0,A.jsx)(u,{children:`Underline`})]})]})})},N={render:()=>(0,A.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`var(--wpds-dimension-gap-xs, 4px)`},children:[(0,A.jsx)(`span`,{children:`Label`}),(0,A.jsxs)(E,{children:[(0,A.jsx)(T,{openOnHover:!0,delay:200,closeDelay:200,"aria-label":`More information`,style:{background:`none`,border:`none`,padding:0,cursor:`var(--wpds-cursor-control, pointer)`,display:`inline-flex`,alignItems:`center`,borderRadius:`var(--wpds-border-radius-sm, 2px)`},children:(0,A.jsx)(l,{icon:i,size:20})}),(0,A.jsxs)(w,{children:[(0,A.jsx)(O,{}),(0,A.jsx)(y,{render:(0,A.jsx)(S,{}),children:`More information`}),(0,A.jsx)(C,{children:`This is additional context about the label. Unlike tooltips, this content is accessible to touch and screen reader users.`})]})]})]})},P={render:()=>(0,A.jsxs)(`div`,{style:{display:`flex`,gap:`0.25rem`},children:[(0,A.jsx)(x,{icon:r,label:`Bold`,size:`compact`}),(0,A.jsx)(x,{icon:a,label:`Italic`,size:`compact`}),(0,A.jsx)(x,{icon:o,label:`Underline`,size:`compact`})]})};try{M.__docgenInfo={description:"Tooltips work best as visual labels for icon-only controls. Each trigger\nmust have its own accessible name via `aria-label`.",displayName:`RecommendedUsage`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{N.__docgenInfo={description:"Popups that open when hovering a help icon should use `Popover` with\n`openOnHover` instead of a Tooltip. This ensures the content is accessible\nto touch and screen reader users.",displayName:`InfotipWithPopover`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{P.__docgenInfo={description:"`IconButton` has built-in tooltip support via the `label` prop,\nmaking it the easiest way to provide a tooltip for icon-only actions.",displayName:`IconButtonWithTooltip`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/tooltip/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  render: () => <Tooltip.Provider delay={0}>
            <div style={{
      display: 'flex',
      gap: '0.25rem'
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

                <Tooltip.Root>
                    <Tooltip.Trigger aria-label="Underline">
                        <Icon icon={formatUnderline} />
                    </Tooltip.Trigger>
                    <Tooltip.Popup>Underline</Tooltip.Popup>
                </Tooltip.Root>
            </div>
        </Tooltip.Provider>
}`,...M.parameters?.docs?.source},description:{story:"Tooltips work best as visual labels for icon-only controls. Each trigger\nmust have its own accessible name via `aria-label`.",...M.parameters?.docs?.description}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--wpds-dimension-gap-xs)'
  }}>
            <span>Label</span>
            <Popover.Root>
                <Popover.Trigger openOnHover delay={200} closeDelay={200} aria-label="More information" style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'var(--wpds-cursor-control)',
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--wpds-border-radius-sm)'
      }}>
                    <Icon icon={help} size={20} />
                </Popover.Trigger>
                <Popover.Popup>
                    <Popover.Arrow />
                    <VisuallyHidden render={<Popover.Title />}>
                        More information
                    </VisuallyHidden>
                    <Popover.Description>
                        This is additional context about the label. Unlike
                        tooltips, this content is accessible to touch and screen
                        reader users.
                    </Popover.Description>
                </Popover.Popup>
            </Popover.Root>
        </div>
}`,...N.parameters?.docs?.source},description:{story:"Popups that open when hovering a help icon should use `Popover` with\n`openOnHover` instead of a Tooltip. This ensures the content is accessible\nto touch and screen reader users.",...N.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: '0.25rem'
  }}>
            <IconButton icon={formatBold} label="Bold" size="compact" />
            <IconButton icon={formatItalic} label="Italic" size="compact" />
            <IconButton icon={formatUnderline} label="Underline" size="compact" />
        </div>
}`,...P.parameters?.docs?.source},description:{story:"`IconButton` has built-in tooltip support via the `label` prop,\nmaking it the easiest way to provide a tooltip for icon-only actions.",...P.parameters?.docs?.description}}}})))()}export{k as a,init_usage_guidelines_story as i,N as n,M as r,P as t};