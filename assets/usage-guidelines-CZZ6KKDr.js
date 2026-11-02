import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,r as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{a as s,n as c,r as l,t as u}from"./index.story-u8F5VICN.js";import{a as d,c as f,d as p,f as m,g as h,h as g,i as _,l as v,m as y,n as b,o as x,p as S,r as C,s as w,t as T,u as E}from"./usage-guidelines.story-bCRZTCSG.js";function _createMdxContent(e){let t={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...a(),...e.components};return(0,D.jsxs)(D.Fragment,{children:[(0,D.jsx)(r,{of:h}),`
`,(0,D.jsx)(t.h1,{id:`badge-usage-guidelines`,children:`Badge usage guidelines`}),`
`,(0,D.jsx)(t.h2,{id:`keep-badge-actions-limited-to-infotips`,children:`Keep badge actions limited to infotips`}),`
`,(0,D.jsxs)(t.p,{children:[`Badges communicate status or metadata. They should not perform actions or navigate to another page. A badge with an `,(0,D.jsx)(t.code,{children:`infotip`}),` is the one exception to the non-interactive pattern: it opens a popover that explains the status.`]}),`
`,(0,D.jsx)(t.h3,{id:`-dont`,children:`❌ Don't`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Use badges as links or buttons.`}),` Do not add click handlers or make badges focusable to trigger actions or navigation. Use the `,(0,D.jsx)(t.code,{children:`infotip`}),` prop to open additional context.`]}),`
`]}),`
`,(0,D.jsx)(t.h3,{id:`-do`,children:`✅ Do`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Use badges to communicate status or metadata.`}),` Keep any related action separate from the badge.`]}),`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Use the appropriate interactive component.`}),` Use `,(0,D.jsx)(t.a,{href:`?path=/docs/design-system-components-button--docs`,children:`Button`}),` for actions and `,(0,D.jsx)(t.a,{href:`?path=/docs/design-system-components-link--docs`,children:`Link`}),` for navigation.`]}),`
`]}),`
`,(0,D.jsx)(t.h2,{id:`choose-badge-intent-based-on-the-attention-a-status-needs`,children:`Choose badge intent based on the attention a status needs`}),`
`,(0,D.jsx)(n,{of:T}),`
`,(0,D.jsx)(t.p,{children:`It can be difficult to determine which badge intent to use because the component's properties are not tied to any specific product view. Those properties should be balanced against the requirements of the view in which the badge appears, all while keeping an eye on high-level consistency (global statuses that appear across multiple views).`}),`
`,(0,D.jsx)(t.p,{children:`Here is a decision tree to help identify which badge to use.`}),`
`,(0,D.jsx)(t.h3,{id:`1-ask-first-should-this-draw-the-eye`,children:`1. Ask first: should this draw the eye?`}),`
`,(0,D.jsx)(t.p,{children:`If the user scans this screen, should their attention be drawn to this badge?`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[`If `,(0,D.jsx)(t.strong,{children:`no`}),` → use `,(0,D.jsx)(t.code,{children:`none`}),` (or even just plain text; no badge), even if the state is positive or "stable".`]}),`
`,(0,D.jsxs)(t.li,{children:[`If `,(0,D.jsx)(t.strong,{children:`yes`}),` → pick an intent based on how important the action or awareness is.`]}),`
`]}),`
`,(0,D.jsx)(t.h3,{id:`2-high--medium--low--action-priority`,children:`2. High / Medium / Low = action priority`}),`
`,(0,D.jsx)(t.p,{children:`Use when there's something for the user to act on.`}),`
`,(0,D.jsxs)(t.h4,{id:`high--critical--top-priority`,children:[(0,D.jsx)(t.code,{children:`high`}),` – Critical / top priority`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Needs attention as soon as possible`}),`
`,(0,D.jsx)(t.li,{children:(0,D.jsx)(t.em,{children:`E.g. "Payment declined", "Security issue"`})}),`
`]}),`
`,(0,D.jsx)(n,{of:_}),`
`,(0,D.jsxs)(t.h4,{id:`medium--important--blocks-progress`,children:[(0,D.jsx)(t.code,{children:`medium`}),` – Important / blocks progress`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Blocks a key task, should be handled soon`}),`
`,(0,D.jsx)(t.li,{children:(0,D.jsx)(t.em,{children:`E.g. "Approval required", "Review needed"`})}),`
`]}),`
`,(0,D.jsx)(n,{of:f}),`
`,(0,D.jsxs)(t.h4,{id:`low--worth-noticing--nonurgent`,children:[(0,D.jsx)(t.code,{children:`low`}),` – Worth noticing / non‑urgent`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Good to be aware of; action may be optional or later`}),`
`,(0,D.jsx)(t.li,{children:(0,D.jsx)(t.em,{children:`E.g. "Pending", "Queued", "Minor issues", "Optional setup"`})}),`
`]}),`
`,(0,D.jsx)(n,{of:w}),`
`,(0,D.jsx)(t.h3,{id:`3-informational--draft--special-non-final-states`,children:`3. Informational / draft = special non-final states`}),`
`,(0,D.jsxs)(t.h4,{id:`informational--notable-no-action--fix-needed`,children:[(0,D.jsx)(t.code,{children:`informational`}),` – Notable, no action / fix needed`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Context only; no clear action`}),`
`,(0,D.jsx)(t.li,{children:(0,D.jsx)(t.em,{children:`E.g. "Scheduled", "Beta", "Internal only"`})}),`
`]}),`
`,(0,D.jsx)(n,{of:x}),`
`,(0,D.jsxs)(t.h4,{id:`draft--not-final--work-in-progress`,children:[(0,D.jsx)(t.code,{children:`draft`}),` – Not final / work in progress`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:(0,D.jsx)(t.em,{children:`E.g. "Draft", "Unpublished", "Work in progress"`})}),`
`]}),`
`,(0,D.jsx)(n,{of:C}),`
`,(0,D.jsx)(t.h3,{id:`4-stable--none--normal-states`,children:`4. Stable / none = normal states`}),`
`,(0,D.jsxs)(t.h4,{id:`stable--positive--healthy-state`,children:[(0,D.jsx)(t.code,{children:`stable`}),` – Positive / "healthy" state`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Use when confirming success or "all good" is important in that view`}),`
`,(0,D.jsx)(t.li,{children:(0,D.jsx)(t.em,{children:`E.g. "Healthy", "Active", "Live"`})}),`
`]}),`
`,(0,D.jsx)(n,{of:m}),`
`,(0,D.jsxs)(t.h4,{id:`none--default-for-normal--background-states`,children:[(0,D.jsx)(t.code,{children:`none`}),` – Default for normal / background states`]}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Especially in dense lists where too much color creates visual noise`}),`
`,(0,D.jsx)(t.li,{children:(0,D.jsx)(t.em,{children:`E.g. "Inactive", "Expired"`})}),`
`]}),`
`,(0,D.jsx)(n,{of:v}),`
`,(0,D.jsx)(t.h3,{id:`examples`,children:`Examples`}),`
`,(0,D.jsx)(t.h4,{id:`comment-status`,children:`Comment status`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[`"Approved" → `,(0,D.jsx)(t.code,{children:`none`})]}),`
`,(0,D.jsxs)(t.li,{children:[`"Approval required" → `,(0,D.jsx)(t.code,{children:`medium`})]}),`
`]}),`
`,(0,D.jsx)(n,{of:b}),`
`,(0,D.jsx)(t.h4,{id:`page-status`,children:`Page status`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[`"Published" → `,(0,D.jsx)(t.code,{children:`none`})]}),`
`,(0,D.jsxs)(t.li,{children:[`"Pending" → `,(0,D.jsx)(t.code,{children:`low`})]}),`
`,(0,D.jsxs)(t.li,{children:[`"Draft" → `,(0,D.jsx)(t.code,{children:`draft`})]}),`
`,(0,D.jsxs)(t.li,{children:[`"Scheduled" → `,(0,D.jsx)(t.code,{children:`informational`})]}),`
`,(0,D.jsxs)(t.li,{children:[`"Private" → `,(0,D.jsx)(t.code,{children:`informational`})]}),`
`]}),`
`,(0,D.jsx)(n,{of:E}),`
`,(0,D.jsx)(t.h4,{id:`plugin-status`,children:`Plugin status`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[`"Active" → `,(0,D.jsx)(t.code,{children:`stable`})]}),`
`,(0,D.jsxs)(t.li,{children:[`"Inactive" → `,(0,D.jsx)(t.code,{children:`none`})]}),`
`]}),`
`,(0,D.jsx)(n,{of:p}),`
`,(0,D.jsx)(t.h3,{id:`5-when-in-doubt`,children:`5. When in doubt…`}),`
`,(0,D.jsx)(t.p,{children:`Use the least attention‑grabbing intent that still:`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Makes it clear what needs attention,`}),`
`,(0,D.jsx)(t.li,{children:`Marks what isn't final, or`}),`
`,(0,D.jsx)(t.li,{children:`Confirms a key success state in that context.`}),`
`]}),`
`,(0,D.jsx)(t.h2,{id:`keep-icons-outside-badges`,children:`Keep icons outside badges`}),`
`,(0,D.jsxs)(t.p,{children:[(0,D.jsx)(t.code,{children:`Badge`}),` is text-only by default. Intent is communicated through color and label. A badge with an `,(0,D.jsx)(t.code,{children:`infotip`}),` adds a fixed trailing help icon. This icon signals that more context is available; it does not represent the status. Do not add other icons.`]}),`
`,(0,D.jsx)(t.h3,{id:`-dont-1`,children:`❌ Don't`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Put status icons inside badges.`}),` A status icon duplicates what the intent color and label already convey.`]}),`
`]}),`
`,(0,D.jsx)(n,{of:d}),`
`,(0,D.jsx)(t.h3,{id:`-do-1`,children:`✅ Do`}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Use text-only badges.`}),` In most cases, the intent color and label are enough. Adding a status icon inside the badge duplicates information and adds visual noise, especially in dense lists.`]}),`
`]}),`
`,(0,D.jsx)(n,{of:S}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsxs)(t.li,{children:[(0,D.jsx)(t.strong,{children:`Keep nearby icons separate.`}),` When a row already includes a content icon (e.g. post type, plugin), use that icon for identity and let the badge communicate status on its own.`]}),`
`]}),`
`,(0,D.jsx)(n,{of:y}),`
`,(0,D.jsx)(t.h2,{id:`use-infotips-sparingly-to-explain-a-status`,children:`Use infotips sparingly to explain a status`}),`
`,(0,D.jsxs)(t.p,{children:[`Use `,(0,D.jsx)(t.code,{children:`infotip`}),` when a status needs a short explanation that does not fit in the label. Choose the intent as usual, then add an infotip only if the status needs explaining.`]}),`
`,(0,D.jsx)(n,{of:l}),`
`,(0,D.jsxs)(t.ul,{children:[`
`,(0,D.jsx)(t.li,{children:`Rewrite an unclear label first. Self-explanatory statuses such as "Draft", "Active", or "Scheduled" usually do not need an infotip.`}),`
`,(0,D.jsx)(t.li,{children:`Reserve infotips for statuses that need context. If every badge needs an explanation, show the information directly in the interface.`}),`
`,(0,D.jsx)(t.li,{children:`Keep essential information visible. Users who do not open the infotip should still understand the status and what to do next. Use inline text or a Notice for critical messages.`}),`
`,(0,D.jsx)(t.li,{children:`Keep essential recovery actions available elsewhere in the interface. The infotip must not be the only way to retry a failed upload or fix a publishing error.`}),`
`,(0,D.jsx)(t.li,{children:`Keep content brief, usually one to three sentences. Prefer at most one related link or button. Use a detail view or dialog for long explanations or workflows with several actions.`}),`
`]}),`
`,(0,D.jsx)(t.h3,{id:`compose-the-popup`,children:`Compose the popup`}),`
`,(0,D.jsxs)(t.p,{children:[`Pass the `,(0,D.jsx)(t.code,{children:`Popover`}),` export and a complete `,(0,D.jsx)(t.code,{children:`Popover.Popup`}),` composition to `,(0,D.jsx)(t.code,{children:`infotip`}),` as `,(0,D.jsx)(t.code,{children:`{ popover: Popover, popup: <Popover.Popup>…</Popover.Popup> }`}),`. Use the same `,(0,D.jsx)(t.code,{children:`Popover`}),` import for the supplied component family and every popup part so they share context. Supplying `,(0,D.jsx)(t.code,{children:`Popover`}),` lets bundlers omit its code when only static badges are used. Include a meaningful `,(0,D.jsx)(t.code,{children:`Popover.Title`}),`, which can be visually hidden, and use `,(0,D.jsx)(t.code,{children:`Popover.Description`}),` for explanatory text. Popover's positioning, portal, and focus options remain available on the supplied popup. Constrain the popup width for readable lines and narrow layouts, as shown in these examples.`]}),`
`,(0,D.jsxs)(t.p,{children:[`A popup can contain a related link or button. Prefer one action that directly relates to the explanation. For buttons, use `,(0,D.jsx)(t.code,{children:`variant="minimal"`}),`, `,(0,D.jsx)(t.code,{children:`tone="neutral"`}),`, and `,(0,D.jsx)(t.code,{children:`size="compact"`}),`, and align the action to the inline end of the popup.`]}),`
`,(0,D.jsx)(n,{of:c}),`
`,(0,D.jsx)(n,{of:u}),`
`,(0,D.jsx)(t.h3,{id:`interaction-and-accessibility`,children:`Interaction and accessibility`}),`
`,(0,D.jsx)(t.p,{children:`Keep the badge's visible label in its accessible name.`}),`
`,(0,D.jsxs)(t.p,{children:[`Do not place a badge with an infotip inside a link, button, or another interactive trigger. If you customize the badge's `,(0,D.jsx)(t.code,{children:`render`}),` prop, preserve its button element when an infotip is present.`]}),`
`,(0,D.jsxs)(t.p,{children:[`If you remove the `,(0,D.jsx)(t.code,{children:`infotip`}),` while the badge or its popup has focus, move focus to a relevant control in the surrounding interface.`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,D.jsx)(t,{...e,children:(0,D.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var D;function init_usage_guidelines(){return(init_usage_guidelines=e((()=>{D=i(),o(),t(),g(),s()})))()}init_usage_guidelines();export{MDXContent as default};