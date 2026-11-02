import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{a as n,o as r,r as i}from"./svg-0tzizuBa.js";import{i as a,n as o}from"./build-module-CPA2Y5FH.js";import{n as s,t as c}from"./icon-0FKfN3kn.js";import{n as l,t as u}from"./component-BYEAdrbI.js";var d,f,Template,p,m,MyIconComponent,h,g,WithADashicon;function init_index_story(){return(init_index_story=e((()=>{r(),o(),s(),l(),d=t(),f={id:`components-icon`,title:`Components/@wordpress-components/Icon`,component:c,parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"When rendering SVGs, use [`Icon`](?path=/docs/design-system-components-icon--docs) from `@wordpress/ui` instead."}}},Template=e=>(0,d.jsx)(c,{...e}),p=Template.bind({}),p.args={icon:a},m=Template.bind({}),m.args={...p.args,icon:({size:e})=>(0,d.jsx)(`img`,{width:e,height:e,src:`https://s.w.org/style/images/about/WordPress-logotype-wmark.png`,alt:`WordPress`})},m.parameters={docs:{source:{code:`
<Icon
  icon={ ( { size } ) => (
    <img
      width={ size }
      height={ size }
      src="https://s.w.org/style/images/about/WordPress-logotype-wmark.png"
      alt="WordPress"
    />
  ) }
/>
        `}}},MyIconComponent=({size:e})=>(0,d.jsx)(n,{width:e,height:e,children:(0,d.jsx)(i,{d:`M5 4v3h5.5v12h3V7H19V4z`})}),h=Template.bind({}),h.args={...p.args,icon:(0,d.jsx)(MyIconComponent,{})},h.parameters={docs:{source:{code:`
const MyIconComponent = ( { size } ) => (
  <SVG width={ size } height={ size }>
    <Path d="M5 4v3h5.5v12h3V7H19V4z" />
  </SVG>
);

<Icon icon={ <MyIconComponent /> } />
        `}}},g=Template.bind({}),g.args={...p.args,icon:(0,d.jsx)(n,{children:(0,d.jsx)(i,{d:`M5 4v3h5.5v12h3V7H19V4z`})})},WithADashicon=e=>(0,d.jsxs)(u,{children:[(0,d.jsx)(c,{...e}),(0,d.jsx)(`small`,{children:`This won’t show an icon if the Dashicons stylesheet isn’t loaded.`})]}),WithADashicon.args={...p.args,icon:`wordpress`};try{m.__docgenInfo={description:"When `icon` is a function, it will be passed the `size` prop and any other additional props.",displayName:`WithAFunction`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/icon/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{h.__docgenInfo={description:"When `icon` is a component, it will be passed the `size` prop and any other additional props.",displayName:`WithAComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/icon/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{WithADashicon.__docgenInfo={description:`Although it's preferred to use icons from the \`@wordpress/icons\` package, [Dashicons](https://developer.wordpress.org/resource/dashicons/) are still supported,
as long as you are in a context where the Dashicons stylesheet is loaded. To simulate that here,
use the Global CSS Injector in the Storybook toolbar at the top and select the "WordPress" preset.`,displayName:`WithADashicon`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/icon/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`args => <Icon {...args} />`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`args => <Icon {...args} />`,...m.parameters?.docs?.source},description:{story:"When `icon` is a function, it will be passed the `size` prop and any other additional props.",...m.parameters?.docs?.description}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`args => <Icon {...args} />`,...h.parameters?.docs?.source},description:{story:"When `icon` is a component, it will be passed the `size` prop and any other additional props.",...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`args => <Icon {...args} />`,...g.parameters?.docs?.source}}},WithADashicon.parameters={...WithADashicon.parameters,docs:{...WithADashicon.parameters?.docs,source:{originalSource:`args => {
  return <VStack>
            <Icon {...args} />
            <small>
                This won’t show an icon if the Dashicons stylesheet isn’t
                loaded.
            </small>
        </VStack>;
}`,...WithADashicon.parameters?.docs?.source},description:{story:`Although it's preferred to use icons from the \`@wordpress/icons\` package, [Dashicons](https://developer.wordpress.org/resource/dashicons/) are still supported,
as long as you are in a context where the Dashicons stylesheet is loaded. To simulate that here,
use the Global CSS Injector in the Storybook toolbar at the top and select the "WordPress" preset.`,...WithADashicon.parameters?.docs?.description}}}})))()}init_index_story();export{p as Default,h as WithAComponent,WithADashicon,m as WithAFunction,g as WithAnSVG,f as default};