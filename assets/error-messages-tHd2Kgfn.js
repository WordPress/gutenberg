import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";function _createMdxContent(e){let t={a:`a`,blockquote:`blockquote`,code:`code`,em:`em`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,strong:`strong`,ul:`ul`,...i(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n,{title:`Design System/Patterns/Error Messages`,tags:[`manifest`]}),`
`,(0,o.jsx)(t.h1,{id:`error-messages`,children:`Error Messages`}),`
`,(0,o.jsx)(t.p,{children:`An error message can be the only conversation a user has with the software when something breaks. A good one turns a dead end into a next step or an action item. These guidelines describe how to write error messages that explain what happened, why, and what the user can do about it.`}),`
`,(0,o.jsxs)(t.p,{children:[`See also: `,(0,o.jsx)(t.a,{href:`docs/contributors/documentation/copy-guide.md`,children:`Copy guide`}),`.`]}),`
`,(0,o.jsx)(t.h2,{id:`anatomy-of-a-good-error-message`,children:`Anatomy of a good error message`}),`
`,(0,o.jsx)(t.p,{children:`A strong message answers three questions in order:`}),`
`,(0,o.jsxs)(t.ol,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`What happened?`}),` The outcome, stated plainly.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Why?`}),` The specific cause.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`What now?`}),` One or more next steps to try.`]}),`
`]}),`
`,(0,o.jsxs)(t.blockquote,{children:[`
`,(0,o.jsx)(t.p,{children:(0,o.jsx)(t.em,{children:`{Browser} can't read {format} photos, so we couldn't convert this one. {Supported option} usually can, or {fallback} instead.`})}),`
`]}),`
`,(0,o.jsx)(t.p,{children:`Keep it to a sentence or two. If a message needs a paragraph, the underlying flow probably needs rethinking more than the copy does.`}),`
`,(0,o.jsx)(t.h2,{id:`principles`,children:`Principles`}),`
`,(0,o.jsxs)(t.h3,{id:`explain-the-why`,children:[`Explain the `,(0,o.jsx)(t.em,{children:`why`})]}),`
`,(0,o.jsx)(t.p,{children:`Don't report only that something failed. Explain the reason, because the reason is usually what points to the fix.`}),`
`,(0,o.jsx)(t.p,{children:`If the cause genuinely isn't known, don't invent a plausible-sounding one. Say that something went wrong and still offer a next step, but a guessed reason that turns out wrong sends the user down the wrong path.`}),`
`,(0,o.jsx)(t.h3,{id:`write-it-like-youd-describe-it-to-a-friend`,children:`Write it like you'd describe it to a friend`}),`
`,(0,o.jsx)(t.p,{children:`Use plain, natural language. Skip error codes, internal component names, and jargon. If you wouldn't say it out loud to a colleague looking over your shoulder, don't put it in the message. A little warmth (and even a little fun) is welcome: an error is a frustrating moment, and the tone can soften it.`}),`
`,(0,o.jsx)(t.h3,{id:`dont-blame-the-user`,children:`Don't blame the user`}),`
`,(0,o.jsxs)(t.p,{children:[`Keep the tone nonjudgmental and describe the situation, not a fault. Avoid words that pin the problem on the reader, such as `,(0,o.jsx)(t.em,{children:`invalid`}),`, `,(0,o.jsx)(t.em,{children:`illegal`}),`, `,(0,o.jsx)(t.em,{children:`incorrect`}),`, or phrasing it like "you failed to" or "you didn't." Say what needs to happen next instead: "Enter a date in the future," not "You entered an invalid date."`]}),`
`,(0,o.jsx)(t.h3,{id:`be-specific`,children:`Be specific`}),`
`,(0,o.jsx)(t.p,{children:`Vague subjects ("this browser", "the server", "something") force the user to guess. Name the thing that didn't work: the specific browser, platform, file type, or field. Specificity also makes the message searchable and easier for the user to reason about.`}),`
`,(0,o.jsx)(t.h3,{id:`offer-a-way-forward`,children:`Offer a way forward`}),`
`,(0,o.jsx)(t.p,{children:`Every error should leave the user with at least one thing to try next: a supported alternative, a format that will work, a setting to change. When you name a constraint, name the escape from it also.`}),`
`,(0,o.jsx)(t.h3,{id:`fail-gracefully`,children:`Fail gracefully`}),`
`,(0,o.jsx)(t.p,{children:`When something goes wrong, minimize harm or exposure. Preserve the user's work, avoid destructive side effects, and never leak sensitive or internal details in the message.`}),`
`,(0,o.jsx)(t.h3,{id:`make-errors-easy-to-act-on`,children:`Make errors easy to act on`}),`
`,(0,o.jsx)(t.p,{children:`A message the user can't read or copy isn't actionable:`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Persist it.`}),` Errors that require a decision should not auto-dismiss. Give the user time to read, understand, and act.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Place it near the problem.`}),` If possible, place the message where the failure happened.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Let people copy it.`}),` Optionally offer a copy-to-clipboard affordance so users can paste messages into search, documentation, or an AI assistant.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`See `,(0,o.jsx)(t.a,{href:`?path=/docs/design-system-components-notice-disclosure--docs`,children:`Notice with disclosed details`}),` for an example using native details to reveal supplementary text, with a text button to copy the message and details.`]}),`
`,(0,o.jsx)(t.h2,{id:`displaying-error-messages`,children:`Displaying error messages`}),`
`,(0,o.jsxs)(t.ol,{children:[`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Does the user have to make a decision?`}),` If not, use a `,(0,o.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/components-snackbar--docs`,rel:`nofollow`,children:(0,o.jsx)(t.code,{children:`Snackbar`})}),`. It clears itself after after a short delay.`]}),`
`,(0,o.jsxs)(t.li,{children:[`If yes, `,(0,o.jsx)(t.strong,{children:`Can you show where the failure happened?`}),` Then do that: render a `,(0,o.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/components-notice--docs`,rel:`nofollow`,children:(0,o.jsx)(t.code,{children:`Notice`})}),` with `,(0,o.jsx)(t.code,{children:`status="error"`}),` in the block, panel, or row that failed, rather than at the top of the screen. For invalid fields on save or submit, follow the `,(0,o.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/design-system-patterns-save-submit--docs`,rel:`nofollow`,children:`Save & Submit`}),` pattern, which scrolls to the first field and shows the message there.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Does it affect the whole screen?`}),` Use a `,(0,o.jsx)(t.code,{children:`Notice`}),` at the top of the screen, below any toolbars. It persists until dismissed or resolved.`]}),`
`,(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:`Must it be resolved before the user can continue?`}),` Use a `,(0,o.jsx)(t.code,{children:`Modal`}),`, not a `,(0,o.jsx)(t.code,{children:`Notice`}),`. See the `,(0,o.jsxs)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/components-notice--docs`,rel:`nofollow`,children:[(0,o.jsx)(t.code,{children:`Notice`}),` guidelines`]}),`.`]}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[`Note: if a Snackbar's position is right but its timer isn't, set `,(0,o.jsx)(t.code,{children:`explicitDismiss`}),` to keep it on screen until the user closes it.`]})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var o;function init_error_messages(){return(init_error_messages=e((()=>{o=r(),a(),t()})))()}init_error_messages();export{MDXContent as default};