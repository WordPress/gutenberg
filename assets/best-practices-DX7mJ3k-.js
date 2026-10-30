import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";import{n as o,t as s}from"./index.story-DGTUSq_O.js";function _createMdxContent(e){let t={code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...i(),...e.components};return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(n,{of:s,name:`Best Practices`}),`
`,(0,c.jsx)(t.h1,{id:`menu`,children:`Menu`}),`
`,(0,c.jsx)(t.h2,{id:`usage`,children:`Usage`}),`
`,(0,c.jsxs)(t.h3,{id:`when-to-use-a-menu`,children:[`When to use a `,(0,c.jsx)(t.code,{children:`Menu`})]}),`
`,(0,c.jsxs)(t.p,{children:[`Use a `,(0,c.jsx)(t.code,{children:`Menu`}),` when you want users to:`]}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsx)(t.li,{children:`Choose an action or change a setting from a list, AND`}),`
`,(0,c.jsx)(t.li,{children:`Only see the available choices contextually.`}),`
`]}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.code,{children:`Menu`}),` is a React component to render an expandable menu of buttons. It is similar in purpose to a `,(0,c.jsx)(t.code,{children:`<select>`}),` element, with the distinction that it does not maintain a value. Instead, each option behaves as an action button.`]}),`
`,(0,c.jsxs)(t.p,{children:[`If you need to display all the available options at all times, consider using a Toolbar instead. Use a `,(0,c.jsx)(t.code,{children:`Menu`}),` to display a list of actions after the user interacts with a button.`]}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.strong,{children:`Do`}),`
Use a `,(0,c.jsx)(t.code,{children:`Menu`}),` to display a list of actions after the user interacts with an icon.`]}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.strong,{children:`Don’t`}),` use a `,(0,c.jsx)(t.code,{children:`Menu`}),` for important actions that should always be visible. Use a `,(0,c.jsx)(t.code,{children:`Toolbar`}),` instead.`]}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.strong,{children:`Don’t`}),`
Don’t use a `,(0,c.jsx)(t.code,{children:`Menu`}),` for frequently used actions. Use a `,(0,c.jsx)(t.code,{children:`Toolbar`}),` instead.`]}),`
`,(0,c.jsx)(t.h3,{id:`behavior`,children:`Behavior`}),`
`,(0,c.jsxs)(t.p,{children:[`Generally, the parent button should indicate that interacting with it will show a `,(0,c.jsx)(t.code,{children:`Menu`}),`.`]}),`
`,(0,c.jsxs)(t.p,{children:[`The parent button should retain the same visual styling regardless of whether the `,(0,c.jsx)(t.code,{children:`Menu`}),` is displayed or not.`]}),`
`,(0,c.jsx)(t.h3,{id:`placement`,children:`Placement`}),`
`,(0,c.jsxs)(t.p,{children:[`The `,(0,c.jsx)(t.code,{children:`Menu`}),` should typically appear directly below, or below and to the left of, the parent button. If there isn’t enough space below to display the full `,(0,c.jsx)(t.code,{children:`Menu`}),`, it can be displayed instead above the parent button.`]})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var c;function init_best_practices(){return(init_best_practices=e((()=>{c=r(),a(),t(),o()})))()}init_best_practices();export{MDXContent as default};