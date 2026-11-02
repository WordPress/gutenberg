import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./text-CMRHx_-b.js";import{n as i,t as a}from"./stack-BwmLRIE8.js";import{n as o,t as s}from"./link-C3WALUlf.js";var c,l,u,d,f,p,m;function init_index_story(){return(init_index_story=e((()=>{o(),i(),n(),c=t(),l={title:`Components/@wordpress-ui/Link`,id:`design-system-components-link`,component:s,tags:[`manifest`],parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},u={args:{children:`Learn more`,href:`#`}},d={args:{children:`Visit WordPress.org`,href:`https://wordpress.org`,openInNewTab:!0}},f={...u,argTypes:{tone:{control:!1},variant:{control:!1}},render:e=>(0,c.jsx)(a,{direction:`column`,gap:`lg`,children:[`brand`,`neutral`].map(t=>[`default`,`unstyled`].map(n=>(0,c.jsxs)(a,{direction:`column`,gap:`xs`,children:[(0,c.jsxs)(r,{variant:`heading-sm`,children:[t,` tone, `,n,` variant`]}),(0,c.jsx)(s,{...e,tone:t,variant:n})]},`${t}-${n}`)))})},p={...u,args:{...u.args,children:`inline link`},render:e=>(0,c.jsxs)(r,{variant:`body-md`,render:(0,c.jsx)(`p`,{}),children:[`This is a paragraph with an `,(0,c.jsx)(s,{...e}),` that inherits its typography from the parent Text component.`]})},m={args:{href:`#`},argTypes:{children:{control:!1}},render:e=>(0,c.jsx)(r,{variant:`body-md`,render:(0,c.jsx)(s,{...e}),children:`A standalone link with body-md typography`})};try{f.__docgenInfo={description:"Note: `tone` has no effect on `unstyled` variant",displayName:`AllTonesAndVariants`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/link/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{m.__docgenInfo={description:"When composing `Text` and `Link` via the `render` prop, keep `Text` as the\nhost and pass `Link` via `render` so the resulting element stays an `<a>`.",displayName:`Standalone`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/link/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Learn more',
    href: '#'
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Visit WordPress.org',
    href: 'https://wordpress.org',
    openInNewTab: true
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  ...Default,
  argTypes: {
    tone: {
      control: false
    },
    variant: {
      control: false
    }
  },
  render: args => <Stack direction="column" gap="lg">
            {(['brand', 'neutral'] as const).map(tone => (['default', 'unstyled'] as const).map(variant => <Stack direction="column" gap="xs" key={\`\${tone}-\${variant}\`}>
                        <Text variant="heading-sm">
                            {tone} tone, {variant} variant
                        </Text>
                        <Link {...args} tone={tone} variant={variant} />
                    </Stack>))}
        </Stack>
}`,...f.parameters?.docs?.source},description:{story:"Note: `tone` has no effect on `unstyled` variant",...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    children: 'inline link'
  },
  render: args => <Text variant="body-md" render={<p />}>
            This is a paragraph with an <Link {...args} /> that inherits its
            typography from the parent Text component.
        </Text>
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    href: '#'
  },
  argTypes: {
    children: {
      control: false
    }
  },
  render: args => <Text variant="body-md" render={<Link {...args} />}>
            A standalone link with body-md typography
        </Text>
}`,...m.parameters?.docs?.source},description:{story:"When composing `Text` and `Link` via the `render` prop, keep `Text` as the\nhost and pass `Link` via `render` so the resulting element stays an `<a>`.",...m.parameters?.docs?.description}}}})))()}init_index_story();export{f as AllTonesAndVariants,u as Default,p as Inline,d as OpenInNewTab,m as Standalone,l as default};