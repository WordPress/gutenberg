import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,r as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{a as s,i as c,n as l,r as u,t as d}from"./usage-guidelines.story-9FD638IS.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...a(),...e.components};return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(r,{of:s}),`
`,(0,f.jsx)(t.h1,{id:`dialog-usage-guidelines`,children:`Dialog usage guidelines`}),`
`,(0,f.jsx)(t.p,{children:(0,f.jsxs)(t.strong,{children:[`When should something be shown in a `,(0,f.jsx)(t.a,{href:`?path=/docs/design-system-components-dialog--docs`,children:`Dialog`}),` vs. a `,(0,f.jsx)(t.a,{href:`?path=/docs/design-system-components-drawer--docs`,children:`Drawer`}),`?`]})}),`
`,(0,f.jsx)(t.p,{children:`Both patterns interrupt the primary workflow, but they signal different expectations about context, scope, and how long the user will stay in the overlay.`}),`
`,(0,f.jsxs)(t.h2,{id:`use-a-dialog-or-alertdialog-when`,children:[`Use a `,(0,f.jsx)(t.code,{children:`Dialog`}),` (or `,(0,f.jsx)(t.code,{children:`AlertDialog`}),`) when`]}),`
`,(0,f.jsx)(t.h3,{id:`the-task-can-be-opened-from-multiple-places`,children:`The task can be opened from multiple places`}),`
`,(0,f.jsxs)(t.p,{children:[`Choose a `,(0,f.jsx)(t.code,{children:`Dialog`}),` when the same flow is reachable from several entry points and the user does not need much of the surrounding page to complete it.`]}),`
`,(0,f.jsx)(t.p,{children:`Examples in WordPress:`}),`
`,(0,f.jsxs)(t.ul,{children:[`
`,(0,f.jsxs)(t.li,{children:[(0,f.jsx)(t.strong,{children:`Draft a page`}),` — the same flow can open from a navigation menu block, the Pages list, or other surfaces.`]}),`
`,(0,f.jsxs)(t.li,{children:[(0,f.jsx)(t.strong,{children:`Command palette`}),` — global, context-light navigation and actions.`]}),`
`,(0,f.jsxs)(t.li,{children:[(0,f.jsx)(t.strong,{children:`Media Library`}),` when adding an image — a reusable picker that does not depend on one specific screen.`]}),`
`]}),`
`,(0,f.jsx)(n,{of:l}),`
`,(0,f.jsx)(t.h3,{id:`the-overlay-is-a-deliberate-interruption`,children:`The overlay is a deliberate interruption`}),`
`,(0,f.jsxs)(t.p,{children:[`A `,(0,f.jsx)(t.code,{children:`Dialog`}),` is appropriate for focused, specific tasks that pause the current workflow and require the user to make a decision or acknowledge critical information.`]}),`
`,(0,f.jsxs)(t.p,{children:[`For destructive or irreversible actions, prefer `,(0,f.jsx)(t.a,{href:`?path=/docs/design-system-components-alertdialog--docs`,children:`AlertDialog`}),` so dismissal behavior and button emphasis match the severity of the action.`]}),`
`,(0,f.jsx)(n,{of:d}),`
`,(0,f.jsx)(t.h3,{id:`there-is-one-decision-or-one-primary-action`,children:`There is one decision or one primary action`}),`
`,(0,f.jsxs)(t.p,{children:[`A `,(0,f.jsx)(t.code,{children:`Dialog`}),` works best when the user can answer a single question or complete one focused task:`]}),`
`,(0,f.jsxs)(t.ul,{children:[`
`,(0,f.jsx)(t.li,{children:`Add a tax rate`}),`
`,(0,f.jsx)(t.li,{children:`Add an image`}),`
`,(0,f.jsx)(t.li,{children:`Remove a customer`}),`
`]}),`
`,(0,f.jsx)(t.p,{children:`Include a prominent and clear call to action so the expected next step is obvious.`}),`
`,(0,f.jsx)(t.h3,{id:`content-is-short-enough-to-scan-without-scrolling`,children:`Content is short enough to scan without scrolling`}),`
`,(0,f.jsxs)(t.p,{children:[`In most cases, `,(0,f.jsx)(t.code,{children:`Dialog`}),` content should fit comfortably in the viewport. Longer flows with many fields, sections, or drill-down steps are usually better suited to a `,(0,f.jsx)(t.code,{children:`Drawer`}),`.`]}),`
`,(0,f.jsx)(t.h3,{id:`do-not-nest-dialogs`,children:`Do not nest dialogs`}),`
`,(0,f.jsxs)(t.p,{children:[`Avoid launching one `,(0,f.jsx)(t.code,{children:`Dialog`}),` from another. If a flow needs additional steps, prefer a single `,(0,f.jsx)(t.code,{children:`Dialog`}),` with clearer content, or move the longer flow into a `,(0,f.jsx)(t.code,{children:`Drawer`}),`.`]}),`
`,(0,f.jsxs)(t.h2,{id:`use-a-drawer-when`,children:[`Use a `,(0,f.jsx)(t.code,{children:`Drawer`}),` when`]}),`
`,(0,f.jsx)(t.h3,{id:`the-user-is-editing-something-on-the-current-page`,children:`The user is editing something on the current page`}),`
`,(0,f.jsxs)(t.p,{children:[`A `,(0,f.jsx)(t.code,{children:`Drawer`}),` fits contextual work where it helps to keep the underlying page visible — or at least mentally available — while editing details of an item already on screen.`]}),`
`,(0,f.jsx)(n,{of:u}),`
`,(0,f.jsx)(t.h3,{id:`there-are-multiple-fields-or-sections`,children:`There are multiple fields or sections`}),`
`,(0,f.jsxs)(t.p,{children:[`When the overlay becomes a small parallel workspace with several inputs, tabs, or collapsible sections, a `,(0,f.jsx)(t.code,{children:`Drawer`}),` usually scales better than a `,(0,f.jsx)(t.code,{children:`Dialog`}),`.`]}),`
`,(0,f.jsx)(t.h3,{id:`the-flow-may-drill-down`,children:`The flow may drill down`}),`
`,(0,f.jsxs)(t.p,{children:[`A `,(0,f.jsx)(t.code,{children:`Drawer`}),` can grow into multi-step or multi-section experiences without feeling cramped. Collapsible sections, tabs, and nested panels are common `,(0,f.jsx)(t.code,{children:`Drawer`}),` patterns.`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,f.jsx)(t,{...e,children:(0,f.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var f;function init_usage_guidelines(){return(init_usage_guidelines=e((()=>{f=i(),o(),t(),c()})))()}init_usage_guidelines();export{MDXContent as default};