import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,r as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{n as s,t as c}from"./save-and-submit.story-hqazDh9_.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...a(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r,{title:`Design System/Patterns/Save & Submit`,tags:[`manifest`]}),`
`,(0,l.jsx)(t.h1,{id:`save--submit`,children:`Save & Submit`}),`
`,(0,l.jsx)(t.p,{children:`Guidelines for saving settings and submitting forms.`}),`
`,(0,l.jsx)(t.h2,{id:`choose-one-save-model-per-surface`,children:`Choose one save model per surface`}),`
`,(0,l.jsxs)(t.p,{children:[`Before designing a settings screen, make a deliberate choice: does the surface `,(0,l.jsx)(t.strong,{children:`save automatically`}),` as the user makes changes, or does it `,(0,l.jsx)(t.strong,{children:`collect changes behind an explicit “Save changes” button`}),`?`]}),`
`,(0,l.jsxs)(t.p,{children:[`Pick one for the entire surface. `,(0,l.jsx)(t.strong,{children:`Do not mix the two.`}),` A page where some fields save instantly while others wait for a button leaves the user unable to tell what has actually been saved and what is still pending. This is the core reason mixed saving feels unreliable.`]}),`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Autosave`}),` is the preferred default for modern interfaces whose fields can be validated and persisted independently and asynchronously (for example, React screens built with DataViews `,(0,l.jsx)(t.code,{children:`DataForm`}),`). Nothing is ever “unsaved”, so there is no Save button and no unsaved-changes prompt.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Manual save`}),` remains a fully supported choice, and is the right one when changes are interdependent and should apply together, when saving has side effects that are better batched into a single action, or when the environment submits a whole form at once (for example, classic WordPress admin screens, or third-party pages that post to PHP).`]}),`
`]}),`
`,(0,l.jsx)(t.p,{children:`When in doubt, prefer autosave, but commit to whichever model you choose across every field on the surface.`}),`
`,(0,l.jsx)(t.h2,{id:`autosave-model`,children:`Autosave model`}),`
`,(0,l.jsx)(t.p,{children:`Each change is persisted as it is made. There is no Save button and no unsaved-changes guard, because there is never any unsaved state.`}),`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Toggles, selects, and radios`}),` save immediately on change.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Text and number fields`}),` save on blur, or debounced after the user stops typing, never on every keystroke.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Per-field feedback.`}),` While a field is saving, show a subtle inline indicator on that field; confirm success inline and quietly. Reserve the `,(0,l.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/components-snackbar--docs`,rel:`nofollow`,children:`Snackbar`}),` for changes whose effect isn’t otherwise visible, and avoid one snackbar per field.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Per-field errors.`}),` If a save fails, surface the error inline at the field, keep the user’s entered value, and let them retry. A failure on one field must not block editing the others.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`No global Save button`}),` and `,(0,l.jsx)(t.strong,{children:`no “leave without saving?” prompt`}),`. Both imply pending state that this model doesn’t have.`]}),`
`]}),`
`,(0,l.jsx)(t.p,{children:`Because autosave depends on fields saving independently, it isn’t suitable when several fields must be validated or applied together. Those cases call for the manual save model.`}),`
`,(0,l.jsx)(t.h2,{id:`manual-save-model`,children:`Manual save model`}),`
`,(0,l.jsxs)(t.p,{children:[`Edits are held locally and applied together when the user clicks a single primary `,(0,l.jsx)(t.strong,{children:`Save changes`}),` button.`]}),`
`,(0,l.jsx)(n,{of:c}),`
`,(0,l.jsx)(t.h3,{id:`saving`,children:`Saving`}),`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsx)(t.li,{children:`While saving, the button switches to a busy or loading state.`}),`
`,(0,l.jsxs)(t.li,{children:[`A `,(0,l.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/components-snackbar--docs`,rel:`nofollow`,children:`Snackbar`}),` confirms a successful save.`]}),`
`]}),`
`,(0,l.jsx)(t.h3,{id:`no-unsaved-changes`,children:`No unsaved changes`}),`
`,(0,l.jsx)(t.p,{children:`When all changes are saved, the Save button is disabled and can reveal a “No unsaved changes” tooltip on hover or focus.`}),`
`,(0,l.jsx)(t.h3,{id:`unsaved-changes-on-exit`,children:`Unsaved changes on exit`}),`
`,(0,l.jsxs)(t.p,{children:[`If the user navigates away with unsaved edits, prompt them to confirm before leaving so their changes aren’t lost. This guard exists `,(0,l.jsx)(t.strong,{children:`only`}),` in the manual save model; an autosave surface never needs it.`]}),`
`,(0,l.jsx)(t.h3,{id:`invalid-fields-partial-saves-and-failed-saves`,children:`Invalid fields, partial saves, and failed saves`}),`
`,(0,l.jsx)(t.p,{children:`For automatic saving methods, an invalid field can require being addressed before saving, e.g. by outputting an error message right below the relevant input control.`}),`
`,(0,l.jsxs)(t.p,{children:[`In some situations, however, some options might save successfully save while others still need attention. In this case, through a `,(0,l.jsx)(t.code,{children:`Notice`}),`, tell people what saved and what still needs attention. And never stack a success and an error on top of each other. You can list multiple areas that need attention in the `,(0,l.jsx)(t.code,{children:`Notice`}),` component, so you don't have to stack multiple.`]}),`
`,(0,l.jsxs)(t.p,{children:[`For fully failed saves, show the reason in the `,(0,l.jsx)(t.code,{children:`Notice`}),`.`]}),`
`,(0,l.jsx)(t.h2,{id:`toggles`,children:`Toggles`}),`
`,(0,l.jsx)(t.p,{children:`A toggle implies immediate effect, like a light switch, which makes it a natural fit for autosave surfaces where a change takes effect as soon as it is flipped. On a manual-save surface, nothing applies until the Save button is clicked, so weigh whether that immediacy still reads true.`}),`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[`Auto-saving is restricted to `,(0,l.jsx)(t.code,{children:`ToggleControl`}),` fields.`]}),`
`,(0,l.jsx)(t.li,{children:`Follows the same feedback conventions as other save methods.`}),`
`,(0,l.jsx)(t.li,{children:`It is preferable to use a toggle instead of a checkbox for turning features on and off. The exception would be if the checkbox is part of a form with other fields that also need to be updated at the same time.`}),`
`,(0,l.jsx)(t.li,{children:`Keep labels short. Use the description under the toggle or in the card title to provide more context.`}),`
`,(0,l.jsx)(t.li,{children:`Lead labels with a verb like “Use, Allow, Show,” or “Enable”.`}),`
`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var l;function init_save_and_submit(){return(init_save_and_submit=e((()=>{l=i(),o(),t(),s()})))()}init_save_and_submit();export{MDXContent as default};