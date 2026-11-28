import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./visually-hidden-BD0tKS3_.js";var o,s,c,l;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={tags:[`manifest`],title:`Components/@wordpress-ui/VisuallyHidden`,id:`design-system-components-visuallyhidden`,component:a,parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},c={render:()=>(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(a,{children:`This should not show.`}),(0,o.jsxs)(`div`,{children:[`This text will `,(0,o.jsx)(a,{children:`but not inline `}),`always show.`]})]})},l={render:function WithCustomElementStory(){let e=(0,r.useId)();return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(a,{render:(0,o.jsx)(`label`,{htmlFor:e}),children:`Accessible label`}),(0,o.jsx)(`input`,{id:e,placeholder:`This input has a visually hidden label`})]})}};try{l.__docgenInfo={description:"Use the `render` prop to change the underlying HTML element.\nBy default, `VisuallyHidden` renders a `<div>`. Here it renders\na `<label>` instead, keeping the native label–input association\nwhile hiding the label text visually.",displayName:`WithCustomElement`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/visually-hidden/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <>
            <VisuallyHidden>This should not show.</VisuallyHidden>
            <div>
                This text will <VisuallyHidden>but not inline </VisuallyHidden>
                always show.
            </div>
        </>
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: function WithCustomElementStory() {
    const inputId = useId();
    return <>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <VisuallyHidden render={<label htmlFor={inputId} />}>
                    Accessible label
                </VisuallyHidden>
                <input id={inputId} placeholder="This input has a visually hidden label" />
            </>;
  }
}`,...l.parameters?.docs?.source},description:{story:"Use the `render` prop to change the underlying HTML element.\nBy default, `VisuallyHidden` renders a `<div>`. Here it renders\na `<label>` instead, keeping the native label–input association\nwhile hiding the label text visually.",...l.parameters?.docs?.description}}}})))()}init_index_story();export{c as Default,l as WithCustomElement,s as default};