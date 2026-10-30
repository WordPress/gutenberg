import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a,n as o,o as s,r as c,t as l}from"./trigger-CsacBF4i.js";var u,d,f,p,m,h,g;function init_index_story(){return(init_index_story=e((()=>{n(),a(),o(),s(),u=t(),d={tags:[`manifest`],title:`Components/@wordpress-ui/Collapsible`,id:`design-system-components-collapsible`,component:c,subcomponents:{"Collapsible.Trigger":l,"Collapsible.Panel":i},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},f={args:{children:[(0,u.jsx)(l,{children:`Toggle`},`trigger`),(0,u.jsx)(i,{children:(0,u.jsx)(`p`,{children:`Collapsible content here.`})},`panel`)]}},p={argTypes:{open:{control:!1}},args:{defaultOpen:!0,children:[(0,u.jsx)(l,{children:`Toggle`},`trigger`),(0,u.jsx)(i,{children:(0,u.jsx)(`p`,{children:`This panel is open by default.`})},`panel`)]}},m={args:{disabled:!0,children:[(0,u.jsx)(l,{children:`Toggle (disabled)`},`trigger`),(0,u.jsx)(i,{children:(0,u.jsx)(`p`,{children:`This content cannot be toggled.`})},`panel`)]}},h={render:function HiddenUntilFoundRender(){return(0,u.jsxs)(`div`,{children:[(0,u.jsx)(`p`,{children:`Use the browser's find-in-page (Ctrl/Cmd+F) to search for "hidden treasure". The collapsed panel will automatically expand to reveal the match.`}),(0,u.jsxs)(c,{children:[(0,u.jsx)(l,{children:`Expand to reveal`}),(0,u.jsx)(i,{hiddenUntilFound:!0,children:(0,u.jsx)(`p`,{children:`This is the hidden treasure that can be found via the browser's built-in page search even while the panel is collapsed.`})})]})]})}},g={argTypes:{open:{control:!1},defaultOpen:{control:!1}},render:function ControlledRender(){let[e,t]=(0,r.useState)(!1);return(0,u.jsxs)(c,{open:e,onOpenChange:t,children:[(0,u.jsx)(l,{children:e?`Close`:`Open`}),(0,u.jsx)(i,{children:(0,u.jsx)(`p`,{children:`Controlled collapsible panel.`})})]})}};try{h.__docgenInfo={description:'When `hiddenUntilFound` is set on `Collapsible.Panel`, the collapsed content\nremains in the DOM using the `hidden="until-found"` HTML attribute instead of\nbeing removed entirely. This lets the browser\'s native page search (Ctrl/Cmd+F)\nfind text inside collapsed panels and automatically expand them to reveal the\nmatch — improving discoverability without sacrificing the collapsed layout.',displayName:`HiddenUntilFound`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/collapsible/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Collapsible.Trigger key="trigger">Toggle</Collapsible.Trigger>, <Collapsible.Panel key="panel">
                <p>Collapsible content here.</p>
            </Collapsible.Panel>]
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  argTypes: {
    open: {
      control: false
    }
  },
  args: {
    defaultOpen: true,
    children: [<Collapsible.Trigger key="trigger">Toggle</Collapsible.Trigger>, <Collapsible.Panel key="panel">
                <p>This panel is open by default.</p>
            </Collapsible.Panel>]
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: [<Collapsible.Trigger key="trigger">
                Toggle (disabled)
            </Collapsible.Trigger>, <Collapsible.Panel key="panel">
                <p>This content cannot be toggled.</p>
            </Collapsible.Panel>]
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: function HiddenUntilFoundRender() {
    return <div>
                <p>
                    Use the browser&apos;s find-in-page (Ctrl/Cmd+F) to search
                    for &quot;hidden treasure&quot;. The collapsed panel will
                    automatically expand to reveal the match.
                </p>
                <Collapsible.Root>
                    <Collapsible.Trigger>Expand to reveal</Collapsible.Trigger>
                    <Collapsible.Panel hiddenUntilFound>
                        <p>
                            This is the hidden treasure that can be found via
                            the browser&apos;s built-in page search even while
                            the panel is collapsed.
                        </p>
                    </Collapsible.Panel>
                </Collapsible.Root>
            </div>;
  }
}`,...h.parameters?.docs?.source},description:{story:'When `hiddenUntilFound` is set on `Collapsible.Panel`, the collapsed content\nremains in the DOM using the `hidden="until-found"` HTML attribute instead of\nbeing removed entirely. This lets the browser\'s native page search (Ctrl/Cmd+F)\nfind text inside collapsed panels and automatically expand them to reveal the\nmatch — improving discoverability without sacrificing the collapsed layout.',...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  argTypes: {
    open: {
      control: false
    },
    defaultOpen: {
      control: false
    }
  },
  render: function ControlledRender() {
    const [open, setOpen] = useState(false);
    return <Collapsible.Root open={open} onOpenChange={setOpen}>
                <Collapsible.Trigger>
                    {open ? 'Close' : 'Open'}
                </Collapsible.Trigger>
                <Collapsible.Panel>
                    <p>Controlled collapsible panel.</p>
                </Collapsible.Panel>
            </Collapsible.Root>;
  }
}`,...g.parameters?.docs?.source}}}})))()}init_index_story();export{g as Controlled,f as Default,p as DefaultOpen,m as Disabled,h as HiddenUntilFound,d as default};