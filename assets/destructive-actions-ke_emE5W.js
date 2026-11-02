import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,strong:`strong`,ul:`ul`,...i(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n,{title:`Design System/Patterns/Destructive Actions`,tags:[`manifest`]}),`
`,(0,o.jsx)(t.h1,{id:`destructive-actions`,children:`Destructive Actions`}),`
`,(0,o.jsx)(t.p,{children:`Destructive actions are operations that remove, delete, or permanently alter content or data. The appropriate pattern to use depends on the reversibility and immediacy of the action's result.`}),`
`,(0,o.jsx)(t.h2,{id:`decision-tree`,children:`Decision Tree`}),`
`,(0,o.jsx)(t.p,{children:`When implementing a destructive action, follow this decision tree:`}),`
`,(0,o.jsxs)(t.ol,{children:[`
`,(0,o.jsxs)(t.li,{children:[`
`,(0,o.jsx)(t.p,{children:(0,o.jsx)(t.strong,{children:`Does the action have an immediate visible result on the frontend?`})}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[`If `,(0,o.jsx)(t.strong,{children:`no`}),` → `,(0,o.jsx)(t.a,{href:`#no-confirmation-needed`,children:`No confirmation needed`})]}),`
`,(0,o.jsxs)(t.li,{children:[`If `,(0,o.jsx)(t.strong,{children:`yes`}),` → Continue to question 2`]}),`
`]}),`
`]}),`
`,(0,o.jsxs)(t.li,{children:[`
`,(0,o.jsx)(t.p,{children:(0,o.jsx)(t.strong,{children:`Can the action be easily undone?`})}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[`If `,(0,o.jsx)(t.strong,{children:`yes`}),` → `,(0,o.jsx)(t.a,{href:`#use-confirmdialog`,children:`Use confirmDialog`})]}),`
`,(0,o.jsxs)(t.li,{children:[`If `,(0,o.jsx)(t.strong,{children:`no`}),` → `,(0,o.jsx)(t.a,{href:`#use-modal-with-destructive-button`,children:`Use Modal with destructive button`})]}),`
`]}),`
`]}),`
`]}),`
`,(0,o.jsx)(t.h2,{id:`no-confirmation-needed`,children:`No Confirmation Needed`}),`
`,(0,o.jsx)(t.p,{children:`Destructive actions that have no immediate visible result on the frontend (e.g., deleting a block) do not require any destructive styling or confirmation.`}),`
`,(0,o.jsx)(t.h3,{id:`when-to-use`,children:`When to Use`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsx)(t.li,{children:`The action doesn't produce an immediate visible change on the frontend`}),`
`,(0,o.jsx)(t.li,{children:`The action can be reversed through standard undo functionality`}),`
`,(0,o.jsx)(t.li,{children:`The user expects the action to be reversible`}),`
`]}),`
`,(0,o.jsx)(t.h3,{id:`implementation`,children:`Implementation`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsx)(t.li,{children:`Use standard trigger styling, avoiding destructive (red) styling`}),`
`,(0,o.jsx)(t.li,{children:`No confirmation dialog required`}),`
`,(0,o.jsx)(t.li,{children:`Ensure undo functionality is available`}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.strong,{children:`Example`}),`: Deleting a block in the editor. The block is removed but the change can be immediately undone using the undo command.`]}),`
`,(0,o.jsx)(t.h2,{id:`use-confirmdialog`,children:`Use ConfirmDialog`}),`
`,(0,o.jsxs)(t.p,{children:[`Destructive actions that have an immediate visible result but can be easily undone (e.g., moving to trash) require a confirmation using the `,(0,o.jsx)(t.code,{children:`ConfirmDialog`}),` component. A snackbar with undo affordance should be displayed after the action completes.`]}),`
`,(0,o.jsx)(t.h3,{id:`when-to-use-1`,children:`When to Use`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsx)(t.li,{children:`The action produces an immediate visible change`}),`
`,(0,o.jsx)(t.li,{children:`The action can be reversed through a clear, accessible mechanism (e.g., trash/restore)`}),`
`,(0,o.jsx)(t.li,{children:`The user should be aware of the change before it happens`}),`
`]}),`
`,(0,o.jsx)(t.h3,{id:`implementation-1`,children:`Implementation`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[`Use `,(0,o.jsx)(t.code,{children:`__experimentalConfirmDialog`}),` from `,(0,o.jsx)(t.code,{children:`@wordpress/components`})]}),`
`,(0,o.jsx)(t.li,{children:`The dialog can be dismissed (ESC key, click outside, cancel button)`}),`
`,(0,o.jsx)(t.li,{children:`Standard button styling for the trigger (no destructive styling)`}),`
`,(0,o.jsx)(t.li,{children:`The confirmation button uses primary variant (not destructive)`}),`
`,(0,o.jsx)(t.li,{children:`After the action completes, display a Snackbar with an undo action`}),`
`]}),`
`,(0,o.jsx)(t.h3,{id:`component-details`,children:`Component Details`}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.code,{children:`ConfirmDialog`}),` is built on top of `,(0,o.jsx)(t.code,{children:`Modal`}),` and provides:`]}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsx)(t.li,{children:`Automatic focus management`}),`
`,(0,o.jsx)(t.li,{children:`Keyboard navigation (Enter to confirm, ESC to cancel)`}),`
`,(0,o.jsx)(t.li,{children:`Accessible dialog structure`}),`
`,(0,o.jsx)(t.li,{children:`Standard button layout (Cancel + Confirm)`}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.strong,{children:`Example`}),`: Moving a post to trash. The post status changes immediately, but it can be restored from the trash.`]}),`
`,(0,o.jsx)(t.h2,{id:`use-modal-with-destructive-button`,children:`Use Modal with Destructive Button`}),`
`,(0,o.jsxs)(t.p,{children:[`Destructive actions that cannot be undone require a confirmation, but the primary action button should be `,(0,o.jsx)(t.code,{children:`destructive`}),`. Use `,(0,o.jsx)(t.code,{children:`Modal`}),` without a close button. A snackbar should confirm the action completes.`]}),`
`,(0,o.jsx)(t.h3,{id:`when-to-use-2`,children:`When to Use`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsx)(t.li,{children:`The action produces an immediate, permanent change`}),`
`,(0,o.jsx)(t.li,{children:`The action cannot be reversed or undone`}),`
`,(0,o.jsx)(t.li,{children:`The consequences are significant and irreversible`}),`
`]}),`
`,(0,o.jsx)(t.h3,{id:`implementation-2`,children:`Implementation`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsxs)(t.li,{children:[`Use `,(0,o.jsx)(t.code,{children:`Modal`}),` component (not `,(0,o.jsx)(t.code,{children:`ConfirmDialog`}),`)`]}),`
`,(0,o.jsxs)(t.li,{children:[`Set `,(0,o.jsx)(t.code,{children:`isDismissible={ false }`}),` to prevent closing via the header button`]}),`
`,(0,o.jsxs)(t.li,{children:[`Set `,(0,o.jsx)(t.code,{children:`shouldCloseOnEsc={ false }`}),` to prevent closing via ESC key`]}),`
`,(0,o.jsxs)(t.li,{children:[`Set `,(0,o.jsx)(t.code,{children:`shouldCloseOnClickOutside={ false }`}),` to prevent closing via overlay click`]}),`
`,(0,o.jsxs)(t.li,{children:[`Primary action button must have `,(0,o.jsx)(t.code,{children:`isDestructive={ true }`}),` prop`]}),`
`,(0,o.jsxs)(t.li,{children:[`Cancel button should use `,(0,o.jsx)(t.code,{children:`variant="tertiary"`})]}),`
`,(0,o.jsx)(t.li,{children:`User must explicitly choose Cancel or Delete (no accidental dismissal)`}),`
`,(0,o.jsx)(t.li,{children:`After the action completes, display a Snackbar to confirm the action`}),`
`]}),`
`,(0,o.jsx)(t.h3,{id:`component-details-1`,children:`Component Details`}),`
`,(0,o.jsxs)(t.p,{children:[`The `,(0,o.jsx)(t.code,{children:`Modal`}),` configuration ensures:`]}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsx)(t.li,{children:`User cannot accidentally dismiss the dialog`}),`
`,(0,o.jsx)(t.li,{children:`Destructive styling on the primary button clearly indicates danger`}),`
`,(0,o.jsx)(t.li,{children:`User must make a deliberate choice to proceed or cancel`}),`
`,(0,o.jsx)(t.li,{children:`Accessibility is maintained through proper ARIA attributes and focus management`}),`
`]}),`
`,(0,o.jsx)(t.h3,{id:`accessibility-considerations`,children:`Accessibility Considerations`}),`
`,(0,o.jsxs)(t.ul,{children:[`
`,(0,o.jsx)(t.li,{children:`The modal title should clearly describe the action`}),`
`,(0,o.jsx)(t.li,{children:`Use descriptive button labels (e.g., "Delete permanently" not just "Delete")`}),`
`,(0,o.jsx)(t.li,{children:`Ensure focus is properly managed when the modal opens`}),`
`]}),`
`,(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.strong,{children:`Example`}),`: Permanently deleting a post. The post is removed completely and cannot be restored.`]}),`
`,(0,o.jsx)(t.h2,{id:`additional-confirmation-patterns`,children:`Additional Confirmation Patterns`}),`
`,(0,o.jsx)(t.p,{children:`For highly destructive or complex actions, an additional confirmation step may be warranted. Include an initially unchecked checkbox that the user must check before the destructive button becomes enabled. The checkbox label should explicitly state what the user is acknowledging (e.g., "I understand this action cannot be undone").`})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var o;function init_destructive_actions(){return(init_destructive_actions=e((()=>{o=r(),a(),t()})))()}init_destructive_actions();export{MDXContent as default};