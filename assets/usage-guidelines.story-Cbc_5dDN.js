import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./create-interpolate-element-Dn8dC6qL.js";import{dc as a,n as o}from"./build-module-DttIWYbV.js";import{n as s,t as c}from"./button-lq-dgQsp.js";import{n as l,t as u}from"./provider-D9cDxnm1.js";import{n as d,t as f}from"./icon-button-DGP9SuUN.js";import{n as p,t as m}from"./text-C_0Rw7Zg.js";import{n as h,t as g}from"./stack-CzK5c0hq.js";import{n as _,t as v}from"./link-DGItCQU-.js";import{n as y,t as b}from"./button-link-ClJsWhkM.js";var x=t({UseButtonForActions:()=>w,UseButtonLinkForNavigation:()=>E,UseLinkForInlineNavigation:()=>T,default:()=>C}),S,C,w,T,E;function init_usage_guidelines_story(){return(init_usage_guidelines_story=e((()=>{r(),o(),s(),d(),_(),y(),h(),p(),l(),S=n(),C={title:`Components/@wordpress-ui/Button/Usage Guidelines`,id:`design-system-components-button-usage-guidelines`,parameters:{controls:{disable:!0}},tags:[`!dev`]},w={render:()=>(0,S.jsx)(u,{delay:0,children:(0,S.jsxs)(g,{direction:`row`,gap:`sm`,wrap:`wrap`,align:`center`,children:[(0,S.jsx)(c,{type:`submit`,children:`Save changes`}),(0,S.jsx)(c,{variant:`outline`,onClick:()=>{},children:`Settings`}),(0,S.jsx)(f,{icon:a,label:`Settings`,variant:`outline`,onClick:()=>{}})]})})},T={render:()=>(0,S.jsx)(m,{variant:`body-md`,render:(0,S.jsx)(`p`,{}),children:i(`Read the <DocumentationLink /> for more details, or <ExternalLink />.`,{DocumentationLink:(0,S.jsx)(v,{href:`https://wordpress.org/documentation/`,children:`documentation`}),ExternalLink:(0,S.jsx)(v,{href:`https://make.wordpress.org/`,openInNewTab:!0,children:`open an external reference`})})})},E={render:()=>(0,S.jsxs)(g,{direction:`column`,gap:`md`,children:[(0,S.jsx)(m,{variant:`body-md`,render:(0,S.jsx)(`p`,{}),children:"Standalone navigation calls to action can use `ButtonLink` when button styling matches the surrounding UI."}),(0,S.jsx)(`div`,{children:(0,S.jsx)(b,{href:`https://make.wordpress.org/`,openInNewTab:!0,children:`Get started`})}),(0,S.jsx)(m,{variant:`body-md`,render:(0,S.jsx)(`p`,{}),children:i(`Note: Prefer <LinkComponent /> for navigation when possible — its underline and link styling communicate where the user is going more clearly than a button-shaped control.`,{LinkComponent:(0,S.jsx)(v,{href:`https://wordpress.org/documentation/`,children:`Link`})})})]})};try{w.__docgenInfo={description:"Use `Button` or `IconButton` for actions on the current view: submitting a\nform, opening a dialog, toggling UI, or running JavaScript. Both render a\n`<button>` and support loading and pressed states.",displayName:`UseButtonForActions`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/button/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{T.__docgenInfo={description:"Use `Link` for navigation. Its underline and link styling communicate where\nthe user is going more clearly than a button-shaped control.",displayName:`UseLinkForInlineNavigation`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/button/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{E.__docgenInfo={description:"Use `ButtonLink` when navigation should look like a `Button`, such as\nstandalone calls to action that require an `href`.\n\nNote: Prefer `Link` for navigation when possible. Its underline and link\nstyling set clearer expectations than a button-shaped control.",displayName:`UseButtonLinkForNavigation`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/button/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <Tooltip.Provider delay={0}>
            <Stack direction="row" gap="sm" wrap="wrap" align="center">
                <Button type="submit">Save changes</Button>
                <Button variant="outline" onClick={() => {}}>
                    Settings
                </Button>
                <IconButton icon={cog} label="Settings" variant="outline" onClick={() => {}} />
            </Stack>
        </Tooltip.Provider>
}`,...w.parameters?.docs?.source},description:{story:"Use `Button` or `IconButton` for actions on the current view: submitting a\nform, opening a dialog, toggling UI, or running JavaScript. Both render a\n`<button>` and support loading and pressed states.",...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <Text variant="body-md" render={<p />}>
            {createInterpolateElement('Read the <DocumentationLink /> for more details, or <ExternalLink />.', {
      DocumentationLink: <Link href="https://wordpress.org/documentation/">
                            documentation
                        </Link>,
      ExternalLink: <Link href="https://make.wordpress.org/" openInNewTab>
                            open an external reference
                        </Link>
    })}
        </Text>
}`,...T.parameters?.docs?.source},description:{story:"Use `Link` for navigation. Its underline and link styling communicate where\nthe user is going more clearly than a button-shaped control.",...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: () => <Stack direction="column" gap="md">
            <Text variant="body-md" render={<p />}>
                Standalone navigation calls to action can use \`ButtonLink\` when
                button styling matches the surrounding UI.
            </Text>
            <div>
                <ButtonLink href="https://make.wordpress.org/" openInNewTab>
                    Get started
                </ButtonLink>
            </div>
            <Text variant="body-md" render={<p />}>
                {createInterpolateElement('Note: Prefer <LinkComponent /> for navigation when possible — its underline and link styling communicate where the user is going more clearly than a button-shaped control.', {
        LinkComponent: <Link href="https://wordpress.org/documentation/">
                                Link
                            </Link>
      })}
            </Text>
        </Stack>
}`,...E.parameters?.docs?.source},description:{story:"Use `ButtonLink` when navigation should look like a `Button`, such as\nstandalone calls to action that require an `href`.\n\nNote: Prefer `Link` for navigation when possible. Its underline and link\nstyling set clearer expectations than a button-shaped control.",...E.parameters?.docs?.description}}}})))()}export{x as a,init_usage_guidelines_story as i,E as n,T as r,w as t};