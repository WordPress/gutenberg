import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./theme-provider-Deinw51u.js";import{n as o,r as s}from"./design-tokens-Dr3W74L2.js";var c,l,u,ColorTokenTable,DSTokensList,d,f,NestingDebug,p;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o(),c=t(),l=Object.keys(s).filter(e=>e.startsWith(`--wpds-color`)),u={title:`Design System/Theme/Theme Provider`,component:a,args:{isRoot:!0},argTypes:{children:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}}}},ColorTokenTable=({tokens:e})=>(0,c.jsx)(`ul`,{style:{listStyle:`none`,display:`flex`,flexDirection:`column`,gap:`0.5rem`},children:e.map(e=>(0,c.jsxs)(`li`,{style:{display:`grid`,gridTemplateColumns:`80px	1fr`,alignItems:`center`,gap:`0.5rem`},children:[(0,c.jsx)(`span`,{"aria-hidden":`true`,style:{backgroundColor:`var(${e})`,border:`1px solid var(--wpds-color-stroke-surface-neutral, #dbdbdb)`,width:`100%`,aspectRatio:`2/1`,display:`block`}}),(0,c.jsx)(`code`,{children:e})]},e))}),DSTokensList=()=>(0,c.jsxs)(`div`,{style:{color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:[(0,c.jsx)(`h1`,{children:`Design System Color tokens`}),(0,c.jsx)(ColorTokenTable,{tokens:l})]}),d={args:{children:(0,c.jsx)(DSTokensList,{})}},f={render:e=>{let t=(0,r.useId)(),[n,i]=(0,r.useState)();return(0,c.jsx)(a,{...e,color:{primary:n},children:(0,c.jsxs)(`div`,{style:{position:`relative`},children:[(0,c.jsx)(`div`,{style:{position:`sticky`,top:0,right:0,backgroundColor:`var(--wpds-color-background-surface-neutral, #fcfcfc)`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`,padding:`0.5rem`,borderRadius:`0.5rem`,boxShadow:`0 0 0.5rem 0 rgba(0, 0, 0, 0.1)`},children:(0,c.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`0.5rem`},children:[(0,c.jsx)(`input`,{type:`color`,id:t,name:`primary`,value:n,onChange:e=>i(e.target.value)}),(0,c.jsx)(`label`,{htmlFor:t,children:`Pick the primary color`})]})}),e.children]})})},args:{children:(0,c.jsx)(DSTokensList,{})}},NestingDebug=({background:e=``,primary:t=``})=>(0,c.jsxs)(`div`,{style:{padding:`var(--wpds-dimension-padding-lg, 16px)`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`,backgroundColor:`var(--wpds-color-background-surface-neutral, #fcfcfc)`,display:`flex`,alignItems:`center`,flexWrap:`wrap`,gap:`1rem`},children:[(0,c.jsxs)(`pre`,{style:{margin:0},children:[`background: `,e,` | primary: `,t]}),(0,c.jsx)(`span`,{style:{display:`inline-block`,padding:`var(--wpds-dimension-padding-sm, 8px)`,borderRadius:`0.25rem`,backgroundColor:`var(--wpds-color-background-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9))`,color:`var(--wpds-color-foreground-interactive-brand-strong, #fff)`},children:`primary`}),(0,c.jsx)(`span`,{style:{display:`inline-block`,marginInlineStart:`0.25rem`,padding:`var(--wpds-dimension-padding-sm, 8px)`,borderRadius:`0.25rem`,backgroundColor:`var(--wpds-color-background-interactive-neutral-weak-disabled, #0000)`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:`Neutral`})]}),p={render:()=>(0,c.jsxs)(a,{children:[(0,c.jsx)(NestingDebug,{background:`inherit (root)`,primary:`inherit (root)`}),(0,c.jsx)(`div`,{style:{paddingInlineStart:`1rem`},children:(0,c.jsxs)(a,{color:{background:`#1e1e1e`},children:[(0,c.jsx)(NestingDebug,{background:`#1e1e1e`,primary:`inherit (root)`}),(0,c.jsx)(`div`,{style:{paddingInlineStart:`1rem`},children:(0,c.jsxs)(a,{children:[(0,c.jsx)(NestingDebug,{background:`inherit (#1e1e1e)`,primary:`inherit (root)`}),(0,c.jsx)(`div`,{style:{paddingInlineStart:`1rem`},children:(0,c.jsxs)(a,{color:{primary:`hotpink`},children:[(0,c.jsx)(NestingDebug,{background:`inherit (#1e1e1e)`,primary:`hotpink`}),(0,c.jsx)(`div`,{style:{paddingInlineStart:`1rem`},children:(0,c.jsx)(a,{color:{background:`#f8f8f8`},children:(0,c.jsx)(NestingDebug,{background:`#f8f8f8`,primary:`inherit (hotpink)`})})})]})})]})})]})})]})},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    children: <DSTokensList />
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: args => {
    const id = useId();
    const [primary, setPrimary] = useState<undefined | string>();
    return <ThemeProvider {...args} color={{
      primary
    }}>
                <div style={{
        position: 'relative'
      }}>
                    <div style={{
          position: 'sticky',
          top: 0,
          right: 0,
          backgroundColor: 'var(--wpds-color-background-surface-neutral)',
          color: 'var( --wpds-color-foreground-content-neutral )',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 0 0.5rem 0 rgba(0, 0, 0, 0.1)'
        }}>
                        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
                            <input type="color" id={id} name="primary" value={primary} onChange={e => setPrimary(e.target.value)} />
                            <label htmlFor={id}>Pick the primary color</label>
                        </div>
                    </div>
                    {args.children}
                </div>
            </ThemeProvider>;
  },
  args: {
    children: <DSTokensList />
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => {
    return <ThemeProvider>
                <NestingDebug background="inherit (root)" primary="inherit (root)" />
                <div style={{
        paddingInlineStart: '1rem'
      }}>
                    <ThemeProvider color={{
          background: '#1e1e1e'
        }}>
                        <NestingDebug background="#1e1e1e" primary="inherit (root)" />
                        <div style={{
            paddingInlineStart: '1rem'
          }}>
                            <ThemeProvider>
                                <NestingDebug background="inherit (#1e1e1e)" primary="inherit (root)" />
                                <div style={{
                paddingInlineStart: '1rem'
              }}>
                                    <ThemeProvider color={{
                  primary: 'hotpink'
                }}>
                                        <NestingDebug background="inherit (#1e1e1e)" primary="hotpink" />
                                        <div style={{
                    paddingInlineStart: '1rem'
                  }}>
                                            <ThemeProvider color={{
                      background: '#f8f8f8'
                    }}>
                                                <NestingDebug background="#f8f8f8" primary="inherit (hotpink)" />
                                            </ThemeProvider>
                                        </div>
                                    </ThemeProvider>
                                </div>
                            </ThemeProvider>
                        </div>
                    </ThemeProvider>
                </div>
            </ThemeProvider>;
  }
}`,...p.parameters?.docs?.source}}}})))()}init_index_story();export{d as Default,p as NestingAndInheriting,f as WithPicker,u as default};