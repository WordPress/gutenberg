import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,r as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{a as s,i as c,n as l,r as u,t as d}from"./usage-guidelines.story-CPh7K7Cc.js";function _createMdxContent(e){let t={a:`a`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...a(),...e.components};return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(r,{of:s}),`
`,(0,f.jsx)(t.h1,{id:`tooltip-usage-guidelines`,children:`Tooltip usage guidelines`}),`
`,(0,f.jsx)(t.h2,{id:`usage-guidelines`,children:`Usage guidelines`}),`
`,(0,f.jsxs)(t.ul,{children:[`
`,(0,f.jsxs)(t.li,{children:[(0,f.jsx)(t.strong,{children:`Use tooltips as visual labels only.`}),` Tooltips provide supplementary visual labels for sighted mouse and keyboard users. Tooltip popups are not exposed to assistive technologies, so the trigger's accessible name provides the label for screen reader users. Do not use tooltips for descriptions, instructions, disabled reasons, or dynamic status messages. See `,(0,f.jsx)(t.a,{href:`#alternatives-to-tooltips`,children:(0,f.jsx)(t.em,{children:`Alternatives to tooltips`})}),` below.`]}),`
`,(0,f.jsxs)(t.li,{children:[(0,f.jsx)(t.strong,{children:`Match the tooltip label to the trigger's accessible name.`}),` Use the same wording for both. For example, a button with the accessible name "Publish" should have a "Publish" tooltip. The trigger must have its own accessible name, provided by its visible text, `,(0,f.jsx)(t.code,{children:`aria-labelledby`}),`, or `,(0,f.jsx)(t.code,{children:`aria-label`}),` for an icon-only control. The tooltip does not provide that name. If the tooltip also displays a keyboard shortcut, keep it separate from the label and use `,(0,f.jsx)(t.code,{children:`aria-keyshortcuts`}),` on the trigger.`]}),`
`]}),`
`,(0,f.jsx)(n,{of:u}),`
`,(0,f.jsxs)(t.p,{children:[(0,f.jsx)(t.code,{children:`IconButton`}),` uses its `,(0,f.jsx)(t.code,{children:`label`}),` prop for both the accessible name and the tooltip label, making it the easiest way to keep them consistent for icon-only actions.`]}),`
`,(0,f.jsx)(n,{of:d}),`
`,(0,f.jsx)(t.h2,{id:`alternatives-to-tooltips`,children:`Alternatives to tooltips`}),`
`,(0,f.jsx)(t.p,{children:`Tooltips should be supplementary popups that provide non-essential clarity in
high-density UIs. A user should not miss critical information if they never
see a tooltip.`}),`
`,(0,f.jsx)(t.p,{children:`Tooltips don't work well with touch input. Unlike mouse pointers with hover
capability, there's no easily discoverable way to reveal a tooltip before
tapping its trigger on a touch device.`}),`
`,(0,f.jsx)(t.p,{children:`iOS doesn't provide a system-standard, touch-friendly tooltip affordance,
while Android may show a tooltip on long press. However, on the web,
long press is often used to trigger contextual menus in the browser, which
can lead to potential conflicts. For this reason, tooltips are disabled on
touch devices.`}),`
`,(0,f.jsx)(t.h3,{id:`infotips`,children:`Infotips`}),`
`,(0,f.jsxs)(t.p,{children:[`Popups that open when hovering a help icon should use
`,(0,f.jsx)(t.a,{href:`?path=/docs/design-system-components-popover--docs`,children:`Popover`}),` with the
`,(0,f.jsx)(t.code,{children:`openOnHover`}),` prop on the trigger instead of a tooltip. This way, touch
users and screen reader users can access the content.`]}),`
`,(0,f.jsxs)(t.p,{children:[`To know when to reach for a popover instead of a tooltip, consider the `,(0,f.jsx)(t.strong,{children:`purpose`}),` of the trigger element and the popup content. If the trigger's purpose is to open the popup itself, use a popover. If the trigger performs another action and the popup only shows that action's label, use a tooltip. Use inline text or a popover for explanations about an action.`]}),`
`,(0,f.jsx)(n,{of:l}),`
`,(0,f.jsxs)(t.p,{children:[`See also the `,(0,f.jsx)(t.a,{href:`?path=/story/design-system-components-popover--infotip`,children:`Popover Infotip story`}),`.`]}),`
`,(0,f.jsxs)(t.p,{children:[`Infotips opened on hover can be dismissed by pressing `,(0,f.jsx)(t.code,{children:`Escape`}),`.`]}),`
`,(0,f.jsx)(t.h3,{id:`description-text`,children:`Description text`}),`
`,(0,f.jsxs)(t.p,{children:[`Descriptions and instructions should use inline text or `,(0,f.jsx)(t.a,{href:`?path=/docs/design-system-components-popover--docs`,children:`Popover`}),` if space is limited, so the information is accessible to touch users and assistive technologies. This applies even when the description is not critical. For example, keep "Publish" as the button's accessible name and tooltip label, and explain a disabled state separately. Adding an accessible description to the button does not make a tooltip suitable for that explanation.`]}),`
`,(0,f.jsx)(t.p,{children:`Since tooltips serve sighted mouse and keyboard users, iconography should
clearly communicate the purpose of icon-only triggers, especially on mobile
where the text label may not be visible.`}),`
`,(0,f.jsx)(t.h3,{id:`contextual-feedback-messages`,children:`Contextual feedback messages`}),`
`,(0,f.jsxs)(t.p,{children:[`For contextual feedback after an action (e.g. "Copied!"), prefer a pattern
that ensures the message is announced to screen readers and supports complex
content, such as a
`,(0,f.jsx)(t.a,{href:`?path=/docs/design-system-components-notice--docs`,children:`Notice`}),`.`]}),`
`,(0,f.jsx)(t.h2,{id:`references`,children:`References`}),`
`,(0,f.jsxs)(t.ul,{children:[`
`,(0,f.jsxs)(t.li,{children:[(0,f.jsx)(t.a,{href:`https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html`,rel:`nofollow`,children:`WCAG 1.4.13: Content on Hover or Focus`}),` — tooltips must be dismissible (Escape), hoverable, and persistent.`]}),`
`,(0,f.jsxs)(t.li,{children:[(0,f.jsx)(t.a,{href:`https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/`,rel:`nofollow`,children:`WAI-ARIA APG: Tooltip pattern`}),` — note that this component intentionally diverges from the traditional `,(0,f.jsx)(t.code,{children:`role="tooltip"`}),` + `,(0,f.jsx)(t.code,{children:`aria-describedby`}),` pattern. The trigger's accessible name is the source of truth for assistive technologies, and the tooltip popup is a visual-only supplement.`]}),`
`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,f.jsx)(t,{...e,children:(0,f.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var f;function init_usage_guidelines(){return(init_usage_guidelines=e((()=>{f=i(),o(),t(),c()})))()}init_usage_guidelines();export{MDXContent as default};