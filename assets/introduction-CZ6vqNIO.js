import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";var s;function init_introduction(){return(init_introduction=e((()=>{s=`# Widget Dashboard

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

Stateless rendering engine for widget dashboards. \`WidgetDashboard\` renders an editable grid of widget instances behind a consumer-controlled edit mode: drag-to-reorder, resize, a modal inserter, per-widget settings, and command-palette integration.


## What it does not own

-   **The contract.** What a widget _is_, _asks_, and _shows_ belongs to primitives, layer by layer. See _Widget Primitives / Anatomy_.
-   **Data.** The engine is stateless. Widget types arrive through \`widgetTypes\`; the consumer owns \`layout\` and its persistence.
-   **Permissions.** Who may customize the dashboard or insert a widget type is the application's to decide; it answers through \`WidgetDashboard.Policy\`. See _Policy_.

Widgets are one _concept_ the admin renders, among materials and surfaces shared across screens.
For that broader vocabulary, see [the admin materials and surfaces discussion](https://github.com/WordPress/gutenberg/issues/70913).
`})))()}function _createMdxContent(e){return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(r,{id:`widget-dashboard-introduction`,title:`Widgets/Dashboard/Introduction`}),`
`,(0,c.jsx)(n,{children:s})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var c;function init_introduction$1(){return(init_introduction$1=e((()=>{c=i(),o(),t(),init_introduction()})))()}init_introduction$1();export{MDXContent as default};