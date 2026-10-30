import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";import{n as o,t as s}from"./index.story-BgAC0j1s.js";function _createMdxContent(e){let t={code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...i(),...e.components};return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(n,{of:s,name:`Best practices`}),`
`,(0,c.jsx)(t.h1,{id:`data-views`,children:`Data Views`}),`
`,(0,c.jsx)(t.p,{children:`Data Views allow users to display and interact with information through different layouts such as table or grid. It includes features like search, filtering, sorting, pagination, and customization options to adjust column order, items per page, and hide columns, enhancing data exploration and flexibility.`}),`
`,(0,c.jsx)(t.p,{children:`A typical flow might be:`}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsx)(t.li,{children:`Use search and filters to narrow down a large collection.`}),`
`,(0,c.jsx)(t.li,{children:`Adjust the layout and visible fields to match the task (compare, skim, or visually scan).`}),`
`,(0,c.jsx)(t.li,{children:`Take inline actions on item metadata, or open an editing interface when more detail is needed.`}),`
`]}),`
`,(0,c.jsx)(t.h2,{id:`choosing-a-layout`,children:`Choosing a layout`}),`
`,(0,c.jsxs)(t.h3,{id:`when-to-use-list`,children:[`When to use `,(0,c.jsx)(t.strong,{children:`List`})]}),`
`,(0,c.jsxs)(t.p,{children:[`Use the `,(0,c.jsx)(t.strong,{children:`List`}),` layout when:`]}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Content needs the most compact layout`}),`, whether because it's used in a constrained context, or if paired with a preview surface.`]}),`
`,(0,c.jsx)(t.li,{children:`Default information density allows for a reduced set of secondary metadata.`}),`
`,(0,c.jsxs)(t.li,{children:[`The view needs to work well in `,(0,c.jsx)(t.strong,{children:`narrow spaces`}),`.`]}),`
`]}),`
`,(0,c.jsx)(t.p,{children:`List is a good fit for items like Pages that benefit from a live preview next to the list.`}),`
`,(0,c.jsxs)(t.h3,{id:`when-to-use-grid`,children:[`When to use `,(0,c.jsx)(t.strong,{children:`Grid`})]}),`
`,(0,c.jsxs)(t.p,{children:[`Use the `,(0,c.jsx)(t.strong,{children:`Grid`}),` layout when:`]}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Visual previews across multiple items at once are important`}),` for recognition (patterns, templates, media, products).`]}),`
`,(0,c.jsxs)(t.li,{children:[`You want a `,(0,c.jsx)(t.strong,{children:`card‑based experience`}),`, with each item having its own tile (image + metadata).`]}),`
`,(0,c.jsxs)(t.li,{children:[`You expect more `,(0,c.jsx)(t.strong,{children:`browsing and scanning by look`}),` than comparing raw values.`]}),`
`]}),`
`,(0,c.jsx)(t.p,{children:`Grid works well when choosing “by look” is more important than comparing precise numbers or dates.`}),`
`,(0,c.jsxs)(t.h3,{id:`when-to-use-table`,children:[`When to use `,(0,c.jsx)(t.strong,{children:`Table`})]}),`
`,(0,c.jsxs)(t.p,{children:[`Use the `,(0,c.jsx)(t.strong,{children:`Table`}),` layout when:`]}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsxs)(t.li,{children:[`Users need to `,(0,c.jsx)(t.strong,{children:`compare multiple attributes across items`}),` at once.`]}),`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Column headers and alignment`}),` are critical for understanding the data.`]}),`
`,(0,c.jsx)(t.li,{children:`The task involves working with structured data.`}),`
`]}),`
`,(0,c.jsx)(t.p,{children:`Table is ideal for dense, structured information where sorting and scanning down aligned columns is the primary workflow, such as posts or comments where metadata is important for choosing the next action.`}),`
`,(0,c.jsx)(t.h2,{id:`when-to-use-something-else`,children:`When to use something else`}),`
`,(0,c.jsxs)(t.p,{children:[`Data Views are designed for `,(0,c.jsx)(t.strong,{children:`browsing and managing collections`}),`. In other situations, consider other components in the `,(0,c.jsx)(t.code,{children:`@wordpress/dataviews`}),` package:`]}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsxs)(t.strong,{children:[`Use `,(0,c.jsx)(t.code,{children:`DataForm`})]}),` when the primary workflow primarily relates to `,(0,c.jsx)(t.strong,{children:`creating or editing a single item`}),` at a level that doesn't require a full editor.`]}),`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsxs)(t.strong,{children:[`Use `,(0,c.jsx)(t.code,{children:`DataViewsPicker`})]}),` when the goal is `,(0,c.jsx)(t.strong,{children:`selecting one or more items`}),` and returning that selection to another part of the UI. This is a better fit for dialogs and sidebars where the outcome is a selection, not ongoing management of a collection, e.g. inserting from a media library.`]}),`
`]})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var c,l;function init_best_practices_story(){return(init_best_practices_story=e((()=>{c=r(),a(),t(),o(),l=[]})))()}init_best_practices_story();export{l as __namedExportsOrder,MDXContent as default};