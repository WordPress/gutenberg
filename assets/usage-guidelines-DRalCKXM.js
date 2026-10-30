import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,r,u as i}from"./blocks-Bi8bw4xb.js";import{t as a}from"./jsx-runtime-BxZPLZy3.js";import{i as o,r as s}from"./react-sPqhvIIV.js";import{a as c,i as l,n as u,r as d,t as f}from"./usage-guidelines.story-Cbc_5dDN.js";function _createMdxContent(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,h1:`h1`,h2:`h2`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...o(),...e.components};return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(i,{of:c}),`
`,(0,p.jsx)(t.h1,{id:`button-iconbutton-link-and-buttonlink`,children:`Button, IconButton, Link, and ButtonLink`}),`
`,(0,p.jsxs)(t.p,{children:[`Choose the component based on `,(0,p.jsx)(t.strong,{children:`what happens when the user activates it`}),`, not only on how it should look.`]}),`
`,(0,p.jsx)(t.h2,{id:`quick-reference`,children:`Quick reference`}),`
`,(0,p.jsx)(n,{children:`
| Goal | Component | Element | Examples |
| --- | --- | --- | --- |
| Performs an action on the current page | [Button](?path=/docs/design-system-components-button--docs), [IconButton](?path=/docs/design-system-components-iconbutton--docs) | \`<button>\` | Save, Delete, Submit, toolbar icon actions |
| Navigate to another page or URL | [Link](?path=/docs/design-system-components-link--docs) | \`<a>\` | "Learn more", docs links, external references |
| Navigate with button styling | [ButtonLink](?path=/docs/design-system-components-buttonlink--docs) | \`<a>\` | Standalone CTAs, card actions |
`}),`
`,(0,p.jsxs)(t.h2,{id:`use-button-and-iconbutton-for-actions`,children:[`Use `,(0,p.jsx)(t.code,{children:`Button`}),` and `,(0,p.jsx)(t.code,{children:`IconButton`}),` for actions`]}),`
`,(0,p.jsxs)(t.p,{children:[`Use `,(0,p.jsx)(t.code,{children:`Button`}),` or `,(0,p.jsx)(t.code,{children:`IconButton`}),` when activation should `,(0,p.jsx)(t.strong,{children:`not`}),` navigate away as a link would:`]}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[`Submitting or resetting a form (`,(0,p.jsx)(t.code,{children:`type="submit"`}),` / `,(0,p.jsx)(t.code,{children:`type="reset"`}),`)`]}),`
`,(0,p.jsxs)(t.li,{children:[`Opening overlays (`,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-dialog--docs`,children:`Dialog`}),`, `,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-popover--docs`,children:`Popover`}),`, etc.)`]}),`
`,(0,p.jsxs)(t.li,{children:[`Running JavaScript on the current page (`,(0,p.jsx)(t.code,{children:`onClick`}),` without a meaningful `,(0,p.jsx)(t.code,{children:`href`}),`)`]}),`
`,(0,p.jsxs)(t.li,{children:[`Toggle controls (`,(0,p.jsx)(t.code,{children:`aria-pressed`}),` on neutral minimal buttons)`]}),`
`,(0,p.jsxs)(t.li,{children:[`Showing a `,(0,p.jsx)(t.strong,{children:`loading`}),` state while an async action completes`]}),`
`]}),`
`,(0,p.jsxs)(t.p,{children:[`Use `,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-iconbutton--docs`,children:`IconButton`}),` for the same kinds of actions when the control is `,(0,p.jsx)(t.strong,{children:`icon-only`}),` — for example, toolbar buttons. It inherits `,(0,p.jsx)(t.code,{children:`Button`}),` props and adds a built-in tooltip via the required `,(0,p.jsx)(t.code,{children:`label`}),` prop (used as the accessible name).`]}),`
`,(0,p.jsxs)(t.p,{children:[(0,p.jsx)(t.code,{children:`Button`}),` and `,(0,p.jsx)(t.code,{children:`IconButton`}),` use button semantics. Do not use them as stand-ins for navigation when a real URL is the primary outcome.`]}),`
`,(0,p.jsx)(r,{of:f}),`
`,(0,p.jsxs)(t.p,{children:[`See `,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-button--docs`,children:`Button`}),` and `,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-iconbutton--docs`,children:`IconButton`}),` for API details and examples.`]}),`
`,(0,p.jsxs)(t.h2,{id:`use-link-for-navigation`,children:[`Use `,(0,p.jsx)(t.code,{children:`Link`}),` for navigation`]}),`
`,(0,p.jsxs)(t.p,{children:[`Use `,(0,p.jsx)(t.code,{children:`Link`}),` when activation should take the user to another page or URL. This is the default choice for navigation — not just inline references in running text, but any case where the outcome is “go somewhere else.”`]}),`
`,(0,p.jsxs)(t.p,{children:[(0,p.jsx)(t.code,{children:`Link`}),` styling communicates navigation more clearly than a button-shaped control. Users can see at a glance that they are following a link, not triggering an action on the current page.`]}),`
`,(0,p.jsx)(t.p,{children:`Typical uses:`}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[`Inline references inside `,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-text--docs`,children:`Text`}),` or paragraphs`]}),`
`,(0,p.jsx)(t.li,{children:`Standalone “Learn more”, “View documentation”, or “Open site” actions`}),`
`,(0,p.jsxs)(t.li,{children:[`External destinations with `,(0,p.jsx)(t.code,{children:`openInNewTab`}),` (adds `,(0,p.jsx)(t.code,{children:`target="_blank"`}),` and an accessible new-tab indicator)`]}),`
`]}),`
`,(0,p.jsxs)(t.p,{children:[`Compose `,(0,p.jsx)(t.code,{children:`Text`}),` as the host and `,(0,p.jsx)(t.code,{children:`Link`}),` via `,(0,p.jsx)(t.code,{children:`render`}),` when you need typography from `,(0,p.jsx)(t.code,{children:`Text`}),` on a standalone link.`]}),`
`,(0,p.jsx)(r,{of:d}),`
`,(0,p.jsxs)(t.p,{children:[`See `,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-link--docs`,children:`Link`}),` for API details and examples.`]}),`
`,(0,p.jsxs)(t.h2,{id:`use-buttonlink-for-navigation-with-button-styling`,children:[`Use `,(0,p.jsx)(t.code,{children:`ButtonLink`}),` for navigation with button styling`]}),`
`,(0,p.jsxs)(t.p,{children:[`Use `,(0,p.jsx)(t.code,{children:`ButtonLink`}),` when the destination is a `,(0,p.jsx)(t.strong,{children:`URL`}),` and the control should `,(0,p.jsxs)(t.strong,{children:[`look like a `,(0,p.jsx)(t.code,{children:`Button`})]}),` — for example, standalone calls to action, card footers, or notice actions where button weight fits the layout.`]}),`
`,(0,p.jsxs)(t.p,{children:[(0,p.jsx)(t.code,{children:`ButtonLink`}),` shares `,(0,p.jsx)(t.code,{children:`Button`}),` visual props (`,(0,p.jsx)(t.code,{children:`variant`}),`, `,(0,p.jsx)(t.code,{children:`tone`}),`, `,(0,p.jsx)(t.code,{children:`size`}),`) but renders an `,(0,p.jsx)(t.code,{children:`<a>`}),` like `,(0,p.jsx)(t.code,{children:`Link`}),`. Use `,(0,p.jsx)(t.code,{children:`openInNewTab`}),` for external destinations (adds `,(0,p.jsx)(t.code,{children:`target="_blank"`}),` and an accessible new-tab indicator). It does `,(0,p.jsx)(t.strong,{children:`not`}),` support `,(0,p.jsx)(t.code,{children:`disabled`}),`, `,(0,p.jsx)(t.code,{children:`loading`}),`, `,(0,p.jsx)(t.code,{children:`focusableWhenDisabled`}),`, `,(0,p.jsx)(t.code,{children:`nativeButton`}),`, or toggle `,(0,p.jsx)(t.code,{children:`aria-pressed`}),`.`]}),`
`,(0,p.jsxs)(t.p,{children:[`Do `,(0,p.jsx)(t.strong,{children:`not`}),` use `,(0,p.jsx)(t.code,{children:`ButtonLink`}),` for form submit, dialogs, or other non-navigation actions — use `,(0,p.jsx)(t.code,{children:`Button`}),` instead.`]}),`
`,(0,p.jsxs)(t.p,{children:[`Do `,(0,p.jsx)(t.strong,{children:`not`}),` use `,(0,p.jsx)(t.code,{children:`Button`}),` with `,(0,p.jsx)(t.code,{children:`render={ <a href="…" /> }`}),` and `,(0,p.jsx)(t.code,{children:`nativeButton={ false }`}),` for new code when `,(0,p.jsx)(t.code,{children:`ButtonLink`}),` fits; `,(0,p.jsx)(t.code,{children:`ButtonLink`}),` is the supported pattern for button-styled links.`]}),`
`,(0,p.jsx)(r,{of:u}),`
`,(0,p.jsxs)(t.blockquote,{children:[`
`,(0,p.jsxs)(t.p,{children:[(0,p.jsx)(t.strong,{children:`Note:`}),` Prefer `,(0,p.jsx)(t.code,{children:`Link`}),` for navigation when possible. Its underline and link styling communicate where the user is going more clearly than a button-shaped control. Reach for `,(0,p.jsx)(t.code,{children:`ButtonLink`}),` only when you have considered `,(0,p.jsx)(t.code,{children:`Button`}),` and `,(0,p.jsx)(t.code,{children:`Link`}),` and still need button prominence.`]}),`
`]}),`
`,(0,p.jsxs)(t.p,{children:[`See `,(0,p.jsx)(t.a,{href:`?path=/docs/design-system-components-buttonlink--docs`,children:`ButtonLink`}),` for API details and examples.`]}),`
`,(0,p.jsx)(t.h2,{id:`common-mistakes`,children:`Common mistakes`}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsxs)(t.strong,{children:[(0,p.jsx)(t.code,{children:`Button`}),` or `,(0,p.jsx)(t.code,{children:`IconButton`}),` + `,(0,p.jsx)(t.code,{children:`onClick`}),` for navigation`]}),` — Prefer `,(0,p.jsx)(t.code,{children:`Link`}),` with a real `,(0,p.jsx)(t.code,{children:`href`}),` so keyboard, assistive technology, and browser link affordances stay correct.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsxs)(t.strong,{children:[(0,p.jsx)(t.code,{children:`ButtonLink`}),` when `,(0,p.jsx)(t.code,{children:`Link`}),` would work`]}),` — Default to `,(0,p.jsx)(t.code,{children:`Link`}),` for navigation; button styling can obscure that the control goes elsewhere.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsxs)(t.strong,{children:[(0,p.jsx)(t.code,{children:`ButtonLink`}),` for submit or toggle actions`]}),` — Use `,(0,p.jsx)(t.code,{children:`Button`}),` or `,(0,p.jsx)(t.code,{children:`IconButton`}),`, depending on whether the control needs a visible text label or is icon-only; `,(0,p.jsx)(t.code,{children:`ButtonLink`}),` does not support loading or pressed toggle styling.`]}),`
`]})]})}function MDXContent(e={}){let{wrapper:t}={...o(),...e.components};return t?(0,p.jsx)(t,{...e,children:(0,p.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var p;function init_usage_guidelines(){return(init_usage_guidelines=e((()=>{p=a(),s(),t(),l()})))()}init_usage_guidelines();export{MDXContent as default};