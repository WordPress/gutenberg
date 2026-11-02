import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./text-CMRHx_-b.js";import{n as i,t as a}from"./stack-BwmLRIE8.js";var o,s,c,l,u;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={tags:[`manifest`],title:`Components/@wordpress-ui/Text`,id:`design-system-components-text`,component:r,parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},c={args:{variant:`body-md`,children:`The quick brown fox jumps over the lazy dog.`}},l={render:()=>(0,o.jsx)(a,{direction:`column`,gap:`lg`,style:{color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:[`heading-2xl`,`heading-xl`,`heading-lg`,`heading-md`,`heading-sm`,`body-xl`,`body-lg`,`body-md`,`body-sm`].map(e=>(0,o.jsxs)(a,{direction:`column`,gap:`xs`,children:[(0,o.jsx)(r,{variant:`heading-sm`,children:e}),(0,o.jsx)(r,{variant:e,children:`The quick brown fox jumps over the lazy dog.`})]},e))})},u={render:()=>(0,o.jsxs)(a,{direction:`column`,gap:`md`,children:[(0,o.jsx)(r,{variant:`heading-2xl`,render:(0,o.jsx)(`h1`,{}),children:`Page Title`}),(0,o.jsx)(r,{variant:`heading-xl`,render:(0,o.jsx)(`h2`,{}),children:`Section Heading`}),(0,o.jsx)(r,{variant:`body-md`,render:(0,o.jsx)(`p`,{}),children:`A paragraph of body text rendered as a semantic paragraph element.`})]})};try{l.__docgenInfo={description:"Important: Setting the `variant` prop to a `heading` variant will not automatically render a heading element.\nUse the `render` prop to render a heading element with the appropriate level.",displayName:`AllVariants`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/text/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'body-md',
    children: 'The quick brown fox jumps over the lazy dog.'
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <Stack direction="column" gap="lg" style={{
    color: 'var(--wpds-color-foreground-content-neutral)'
  }}>
            {(['heading-2xl', 'heading-xl', 'heading-lg', 'heading-md', 'heading-sm', 'body-xl', 'body-lg', 'body-md', 'body-sm'] as const).map(variant => <Stack key={variant} direction="column" gap="xs">
                    <Text variant="heading-sm">{variant}</Text>
                    <Text variant={variant}>
                        The quick brown fox jumps over the lazy dog.
                    </Text>
                </Stack>)}
        </Stack>
}`,...l.parameters?.docs?.source},description:{story:"Important: Setting the `variant` prop to a `heading` variant will not automatically render a heading element.\nUse the `render` prop to render a heading element with the appropriate level.",...l.parameters?.docs?.description}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <Stack direction="column" gap="md">
            <Text variant="heading-2xl" render={<h1 />}>
                Page Title
            </Text>
            <Text variant="heading-xl" render={<h2 />}>
                Section Heading
            </Text>
            <Text variant="body-md" render={<p />}>
                A paragraph of body text rendered as a semantic paragraph
                element.
            </Text>
        </Stack>
}`,...u.parameters?.docs?.source}}}})))()}init_index_story();export{l as AllVariants,c as Default,u as WithRenderProp,s as default};