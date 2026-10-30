import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,r as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{a as s,i as c,n as l,r as u,t as d}from"./announcements.story-DPU2ljIE.js";import{r as f,t as p}from"./index.story-CH1idGhY.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...a(),...e.components};return(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(r,{of:c}),`
`,(0,m.jsx)(t.h1,{id:`notice-announcements`,children:`Notice announcements`}),`
`,(0,m.jsxs)(t.p,{children:[`Standalone notices do not announce their content. Use `,(0,m.jsx)(t.code,{children:`Notice.List`}),` to announce notices as they are added or changed. Visual `,(0,m.jsx)(t.code,{children:`intent`}),` and announcement urgency are independent.`]}),`
`,(0,m.jsx)(t.h2,{id:`static-information`,children:`Static information`}),`
`,(0,m.jsx)(t.p,{children:`Leave static notices without an announcement. Users can read the message and reach its actions through normal navigation.`}),`
`,(0,m.jsx)(n,{of:l}),`
`,(0,m.jsx)(t.h2,{id:`announce-a-list-of-notices`,children:`Announce a list of notices`}),`
`,(0,m.jsxs)(t.p,{children:[`Keep `,(0,m.jsx)(t.code,{children:`Notice.List`}),` mounted, including when it is empty, and render keyed `,(0,m.jsx)(t.code,{children:`Notice.Root`}),` children inside it. The list stacks its children with a small gap. It announces added notices and changes to their messages, including when a new save result replaces a message under the same key. Notices present when the list mounts stay silent.`]}),`
`,(0,m.jsx)(n,{of:p}),`
`,(0,m.jsxs)(t.p,{children:[`The default announcement joins the plaintext content of `,(0,m.jsx)(t.code,{children:`Notice.Title`}),` and `,(0,m.jsx)(t.code,{children:`Notice.Description`}),` with a space if the title already ends in Unicode sentence-ending punctuation, or `,(0,m.jsx)(t.code,{children:`. `}),` otherwise. The supplied text is preserved. Actions, dismiss buttons, descriptions inside `,(0,m.jsx)(t.code,{children:`Notice.Actions`}),`, and content hidden with `,(0,m.jsx)(t.code,{children:`hidden`}),` or `,(0,m.jsx)(t.code,{children:`aria-hidden="true"`}),` are excluded. For complex content or content rendered outside the notice, use `,(0,m.jsx)(t.code,{children:`spokenMessage`}),` on `,(0,m.jsx)(t.code,{children:`Notice.Root`}),` to provide a complete, punctuated announcement that excludes technical details.`]}),`
`,(0,m.jsxs)(t.p,{children:[`Announcements are `,(0,m.jsx)(t.code,{children:`polite`}),` by default, including error notices. Set `,(0,m.jsx)(t.code,{children:`politeness="assertive"`}),` on a notice only when its message needs immediate attention. Set `,(0,m.jsx)(t.code,{children:`politeness="off"`}),` to skip announcements for a notice. These props only affect notices inside `,(0,m.jsx)(t.code,{children:`Notice.List`}),`.`]}),`
`,(0,m.jsx)(t.pre,{children:(0,m.jsx)(t.code,{className:`language-jsx`,children:`<Notice.List>
	{ notices.map( ( notice ) => (
		<Notice.Root
			key={ notice.id }
			intent={ notice.intent }
			politeness={ notice.isUrgent ? 'assertive' : 'polite' }
		>
			<Notice.Title>{ notice.title }</Notice.Title>
			<Notice.Description>{ notice.description }</Notice.Description>
		</Notice.Root>
	) ) }
</Notice.List>
`})}),`
`,(0,m.jsxs)(t.p,{children:[`The list does not move focus, and notices continue to announce while focus is inside the list. If your application moves focus to a new notice, set `,(0,m.jsx)(t.code,{children:`politeness="off"`}),` on that notice when adding it to avoid announcing the same content twice. This leaves announcements for other notices enabled. Removing a notice does not announce it or repeat the remaining notices. Give each notice a stable key. Use a new key for a new notification, including a repeated message.`]}),`
`,(0,m.jsxs)(t.p,{children:[`The list renders separate, visually hidden live regions for polite and assertive messages. Keep live-region roles off the visible notices and do not also call `,(0,m.jsx)(t.code,{children:`speak()`}),` for the same update.`]}),`
`,(0,m.jsx)(t.h2,{id:`announce-from-the-application`,children:`Announce from the application`}),`
`,(0,m.jsxs)(t.p,{children:[`For a standalone dynamic notice, or an announcement tied to an application event rather than a change to visible text, use `,(0,m.jsx)(t.code,{children:`speak()`}),` from `,(0,m.jsx)(t.code,{children:`@wordpress/a11y`}),` in the event handler or lifecycle callback that handles the update. Pass an explicit message containing the relevant title and description. Exclude action labels and technical error details. Do not also add a live-region role to the visible notice, which could cause duplicate announcements.`]}),`
`,(0,m.jsxs)(t.p,{children:[`Import `,(0,m.jsx)(t.code,{children:`@wordpress/a11y`}),` during application startup, before announcements are needed. Its main entrypoint creates shared live regions when the document is ready; `,(0,m.jsx)(t.code,{children:`speak()`}),` updates those regions. In a standalone app, wait until the document is ready before sending the first announcement. The WordPress script entrypoint uses the same setup. The script-module entrypoint requires the host to provide the live regions.`]}),`
`,(0,m.jsx)(t.h3,{id:`urgent-errors`,children:`Urgent errors`}),`
`,(0,m.jsxs)(t.p,{children:[`Use `,(0,m.jsx)(t.code,{children:`speak( message, 'assertive' )`}),` when an error needs immediate attention, such as a failed save or an editor crash. Keep keyboard focus where it is. Select `,(0,m.jsx)(t.strong,{children:`Save changes`}),` to simulate a failed save. `,(0,m.jsx)(t.strong,{children:`Try again`}),` clears the simulated error.`]}),`
`,(0,m.jsx)(n,{of:u}),`
`,(0,m.jsx)(t.h3,{id:`non-urgent-updates`,children:`Non-urgent updates`}),`
`,(0,m.jsxs)(t.p,{children:[`Use `,(0,m.jsx)(t.code,{children:`speak( message, 'polite' )`}),` for updates that can wait until the screen reader finishes speaking. An error in one dashboard widget, while the rest of the dashboard remains usable, can also use a polite announcement.`]}),`
`,(0,m.jsxs)(t.p,{children:[`Select `,(0,m.jsx)(t.strong,{children:`Save draft`}),` to show and announce a new notice. `,(0,m.jsx)(t.strong,{children:`Dismiss`}),` removes the visible notice. Neither action label is included in the announcement.`]}),`
`,(0,m.jsx)(n,{of:d}),`
`,(0,m.jsx)(t.h2,{id:`using-a-live-region-directly`,children:`Using a live region directly`}),`
`,(0,m.jsxs)(t.p,{children:[`An application can instead manage its own live region. Mount an empty region before the update, then populate it. Use `,(0,m.jsx)(t.code,{children:`role="status"`}),` for non-urgent updates and `,(0,m.jsx)(t.code,{children:`role="alert"`}),` for important, time-sensitive messages. Include the relevant title and description, and keep actions outside the region.`]}),`
`,(0,m.jsx)(t.pre,{children:(0,m.jsx)(t.code,{className:`language-jsx`,children:`// Keep this region mounted before the save completes.
<div role="status">
	{ isSaved ? 'Draft saved. Your draft has been saved.' : '' }
</div>
`})}),`
`,(0,m.jsxs)(t.p,{children:[`The `,(0,m.jsx)(t.a,{href:`https://www.w3.org/WAI/ARIA/apg/patterns/alert/`,rel:`nofollow`,children:`WAI-ARIA alert pattern`}),` notes that most screen readers announce dynamically inserted alerts. This special behavior does not apply to every live-region role. Do not rely on inserting a populated `,(0,m.jsx)(t.code,{children:`role="status"`}),` element to announce its contents. Keeping the region mounted first is the more reliable pattern for both roles.`]}),`
`,(0,m.jsxs)(t.p,{children:[`Use one announcement mechanism for each update. Do not combine this live region with a `,(0,m.jsx)(t.code,{children:`speak()`}),` call for the same message.`]}),`
`,(0,m.jsx)(t.h2,{id:`migrating-existing-notices`,children:`Migrating existing notices`}),`
`,(0,m.jsxs)(t.p,{children:[(0,m.jsx)(t.code,{children:`Notice.Root`}),` only uses `,(0,m.jsx)(t.code,{children:`spokenMessage`}),` and `,(0,m.jsx)(t.code,{children:`politeness`}),` inside `,(0,m.jsx)(t.code,{children:`Notice.List`}),`. Standalone notices stay silent.`]}),`
`,(0,m.jsxs)(t.ul,{children:[`
`,(0,m.jsx)(t.li,{children:`If the notice is static, no replacement is needed.`}),`
`,(0,m.jsxs)(t.li,{children:[`For dynamic notices, keep a `,(0,m.jsx)(t.code,{children:`Notice.List`}),` mounted and add notices to it. Existing notices are not announced when the list first mounts.`]}),`
`,(0,m.jsxs)(t.li,{children:[`If the previous `,(0,m.jsx)(t.code,{children:`spokenMessage`}),` differed from the visible text, retain that message on the notice inside the list.`]}),`
`,(0,m.jsxs)(t.li,{children:[`For event-based announcements, call `,(0,m.jsx)(t.code,{children:`speak()`}),` where the application handles the update, as shown above, or update an existing live region.`]}),`
`,(0,m.jsxs)(t.li,{children:[`Choose `,(0,m.jsx)(t.code,{children:`polite`}),` or `,(0,m.jsx)(t.code,{children:`assertive`}),` based on urgency, independently of the notice's visual intent.`]}),`
`]}),`
`,(0,m.jsxs)(t.p,{children:[`This change applies to `,(0,m.jsx)(t.code,{children:`@wordpress/ui`}),` `,(0,m.jsx)(t.code,{children:`Notice`}),`. The `,(0,m.jsx)(t.code,{children:`@wordpress/components`}),` `,(0,m.jsx)(t.code,{children:`Notice`}),` API is unchanged.`]}),`
`,(0,m.jsxs)(t.p,{children:[`Test dynamic announcements with the browsers and screen readers your application supports. Automated tests can check live-region content and the message and politeness passed to `,(0,m.jsx)(t.code,{children:`speak()`}),`, but cannot verify speech output.`]}),`
`,(0,m.jsxs)(t.p,{children:[`See the `,(0,m.jsxs)(t.a,{href:`https://github.com/WordPress/gutenberg/tree/HEAD/packages/a11y#api`,rel:`nofollow`,children:[(0,m.jsx)(t.code,{children:`@wordpress/a11y`}),` API`]}),` and the `,(0,m.jsx)(t.a,{href:`https://www.w3.org/TR/wai-aria-1.2/#status`,rel:`nofollow`,children:`WAI-ARIA status role`}),`.`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,m.jsx)(t,{...e,children:(0,m.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var m;function init_announcements(){return(init_announcements=e((()=>{m=i(),o(),t(),s(),f()})))()}init_announcements();export{MDXContent as default};