import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,r as n,u as r}from"./blocks-CABDfz-X.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{a as s,i as c,n as l,o as u,r as d,t as f}from"./save-and-submit.story-0teNV6pg.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...a(),...e.components};return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(r,{title:`Design System/Patterns/Save & Submit`,tags:[`manifest`]}),`
`,(0,p.jsx)(t.h1,{id:`save--submit`,children:`Save & Submit`}),`
`,(0,p.jsx)(t.p,{children:`Guidelines for saving settings and submitting forms.`}),`
`,(0,p.jsx)(t.p,{children:`Editing a document, such as a post and its blocks, follows a different model: changes apply to the content straight away and are saved together with the document. These guidelines don’t cover that model.`}),`
`,(0,p.jsx)(t.h2,{id:`choose-one-save-model-per-surface`,children:`Choose one save model per surface`}),`
`,(0,p.jsxs)(t.p,{children:[`Before designing anywhere people change settings, such as a screen, a panel, or a modal, make a deliberate choice: does the surface `,(0,p.jsx)(t.strong,{children:`collect changes behind an explicit “Save changes” button`}),`, or does it `,(0,p.jsx)(t.strong,{children:`save automatically`}),` as the user makes changes?`]}),`
`,(0,p.jsxs)(t.p,{children:[`Pick one for the entire surface. `,(0,p.jsx)(t.strong,{children:`Do not mix the two.`}),` A page where some fields save instantly while others wait for a button leaves the user unable to tell what has actually been saved and what is still pending. This is the core reason mixed saving feels unreliable. Mixing also undermines the unsaved-changes prompt: a warning that only covers some of the fields gives false reassurance about the rest.`]}),`
`,(0,p.jsx)(t.p,{children:`A surface is a region whose save state is communicated by a single control: either one Save button, or the absence of any. Usually that is the whole screen, panel, or modal. A screen can occasionally be split into separate surfaces, for example a card of instantly applied switches beside a form with its own Save button, but only when the regions are visually distinct and each makes its model obvious. Treat this as the exception, not a way to mix models within one form.`}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`Manual save`}),` is the usual choice in WordPress. It is the right one when changes are interdependent and should apply together, when saving has side effects that are better batched into a single action, or when the environment submits a whole form at once (for example, classic WordPress admin screens, or third-party pages that post to PHP).`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`Autosave`}),` suits surfaces whose fields can be validated and persisted independently and asynchronously, such as a list of preferences that each take effect on their own (for example, the block editor’s Preferences modal). Changes save as they’re made, so there is no Save button, and no unsaved-changes prompt unless an edit fails to save.`]}),`
`]}),`
`,(0,p.jsx)(t.p,{children:`Choose the model that fits how the surface’s data is saved, and commit to it across every field on the surface.`}),`
`,(0,p.jsx)(t.h2,{id:`manual-save-model`,children:`Manual save model`}),`
`,(0,p.jsxs)(t.p,{children:[`Edits are held locally and applied together when the user clicks a single primary `,(0,p.jsx)(t.strong,{children:`Save changes`}),` button.`]}),`
`,(0,p.jsx)(n,{of:c}),`
`,(0,p.jsx)(t.h3,{id:`saving`,children:`Saving`}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[`While saving, the `,(0,p.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-button--docs`,rel:`nofollow`,children:(0,p.jsx)(t.code,{children:`Button`})}),` switches to its `,(0,p.jsx)(t.code,{children:`loading`}),` state and can’t be clicked again.`]}),`
`,(0,p.jsxs)(t.li,{children:[`A `,(0,p.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/components-snackbar--docs`,rel:`nofollow`,children:`Snackbar`}),` confirms a successful save.`]}),`
`]}),`
`,(0,p.jsx)(t.h3,{id:`no-unsaved-changes`,children:`No unsaved changes`}),`
`,(0,p.jsxs)(t.p,{children:[`When all changes are saved, the Save button is disabled. A disabled Save on a form with no changes is a familiar convention and needs no explanation. If a disabled state does need explaining, use inline text, not a `,(0,p.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-tooltip--docs`,rel:`nofollow`,children:(0,p.jsx)(t.code,{children:`Tooltip`})}),`: tooltips aren't available to screen readers or on touch devices.`]}),`
`,(0,p.jsx)(t.h3,{id:`unsaved-changes-on-exit`,children:`Unsaved changes on exit`}),`
`,(0,p.jsxs)(t.p,{children:[`If the user navigates away with unsaved edits, prompt them to confirm before leaving so their changes aren’t lost. This guard belongs to the manual save model. An autosave surface only needs it while a text field holds an edit that failed to save (see `,(0,p.jsx)(t.a,{href:`#autosave-model`,children:`Autosave model`}),`).`]}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`Only ask when something would be lost.`}),` Prompt only while there are unsaved edits. Once the user saves, or changes a field back to its saved value, navigation is free again.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsxs)(t.strong,{children:[`Inside the app, use an `,(0,p.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-alertdialog--docs`,rel:`nofollow`,children:(0,p.jsx)(t.code,{children:`AlertDialog`})}),`.`]}),` Hold the navigation (switching between adjacent pages, following a breadcrumb or opening a record) and ask “Discard unsaved changes?” with the `,(0,p.jsx)(t.code,{children:`irreversible`}),` intent, because leaving discards the edits and can’t be undone. Offer two choices: “Keep editing”, which cancels the navigation and is the safe default, and “Discard changes”, which continues. Don’t add a “Save and leave” option: a save can fail validation, and the dialog is the wrong place to show that.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`When leaving the app, rely on the browser.`}),` Reloading, closing the tab or following an external link can only be guarded with the `,(0,p.jsx)(t.code,{children:`beforeunload`}),` event, which shows the browser’s own warning. Its wording can’t be customized, so don’t try to imitate it.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`Dialogs and drawers that hold a draft close only through their actions.`}),` Give them a footer with Cancel and Save, and omit the close icon and closing by clicking outside, so the user always makes an explicit choice. Cancel discards the draft without asking again, because choosing it is the decision. If the user presses Escape with unsaved edits, ask with the same dialog before closing.`]}),`
`]}),`
`,(0,p.jsx)(t.p,{children:`Edit the title below, then click “Back”:`}),`
`,(0,p.jsx)(n,{of:s}),`
`,(0,p.jsx)(t.h3,{id:`invalid-fields-partial-saves-and-failed-saves`,children:`Invalid fields, partial saves, and failed saves`}),`
`,(0,p.jsx)(t.p,{children:`Keep the Save button enabled when fields are invalid, so that clicking it can explain what needs fixing. When it is clicked:`}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsx)(t.li,{children:`Show each error message right below its field.`}),`
`,(0,p.jsx)(t.li,{children:`Move focus to the first invalid field, scrolling it into view.`}),`
`,(0,p.jsx)(t.li,{children:`Don’t send the save until the errors are fixed.`}),`
`]}),`
`,(0,p.jsxs)(t.p,{children:[`A form’s native validation does this for you: wrap the fields in a `,(0,p.jsx)(t.code,{children:`<form>`}),` and make Save a `,(0,p.jsx)(t.code,{children:`type="submit"`}),` button, so pressing Enter in a field submits too. Controls built on `,(0,p.jsx)(t.code,{children:`ControlWithError`}),` show their message and move focus. They also show a message as soon as focus leaves an invalid field, so place Save above the fields, for example in the card or page header, where a new message can’t push it away mid-click. Clear the site title below, then click “Save changes”:`]}),`
`,(0,p.jsx)(n,{of:d}),`
`,(0,p.jsxs)(t.p,{children:[`If the save goes through but only some changes succeed, show a single `,(0,p.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-notice--docs`,rel:`nofollow`,children:(0,p.jsx)(t.code,{children:`Notice`})}),` at the top of the form that says what saved and what still needs attention. List every area that needs attention in that one `,(0,p.jsx)(t.code,{children:`Notice`}),`, and never show a success message and an error message together.`]}),`
`,(0,p.jsxs)(t.p,{children:[`If the save fails entirely, keep the user’s edits so they can retry, and show the reason in the `,(0,p.jsx)(t.code,{children:`Notice`}),`.`]}),`
`,(0,p.jsx)(t.h2,{id:`autosave-model`,children:`Autosave model`}),`
`,(0,p.jsx)(t.p,{children:`Each change is persisted as it is made. There is no Save button, and no unsaved-changes guard while every change has saved.`}),`
`,(0,p.jsx)(n,{of:l}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`Switches, selects, and radios`}),` save immediately on change.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`Text and number fields`}),` save on blur, or debounced after the user stops typing, never on every keystroke.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`Per-field errors.`}),` If a save fails, show the error at the field and let the user retry. A failure on one field must not block editing the others.`,`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsx)(t.li,{children:`For a switch, select, or radio, return the control to its saved value, so it never shows a state that wasn’t saved.`}),`
`,(0,p.jsx)(t.li,{children:`For a text or number field, keep what the user entered so it isn’t lost, and mark the field as not saved until a retry succeeds.`}),`
`,(0,p.jsx)(t.li,{children:`After “Try again”, move focus to the field it retried. The retry removes its notice, and focus would otherwise fall back to the page.`}),`
`]}),`
`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`No global Save button.`}),` It implies pending state that this model doesn’t have.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`No unsaved-changes prompt while everything has saved.`}),` The exception is a text or number field that failed to save: the field holds the user’s only copy of the edit. If the user navigates away, keep that edit so they can retry when they come back, or ask “Discard unsaved changes?” before throwing it away.`]}),`
`]}),`
`,(0,p.jsxs)(t.p,{children:[`In this example, saving “Show related posts” always fails. Flip it to see the switch return to its saved value, with an error `,(0,p.jsx)(t.code,{children:`Notice`}),` below it:`]}),`
`,(0,p.jsx)(n,{of:f}),`
`,(0,p.jsx)(t.p,{children:`Because autosave depends on fields saving independently, it isn’t suitable when several fields must be validated or applied together. Those cases call for the manual save model.`}),`
`,(0,p.jsx)(t.h2,{id:`switches`,children:`Switches`}),`
`,(0,p.jsxs)(t.p,{children:[`A switch implies immediate effect, like a light switch, so `,(0,p.jsx)(t.strong,{children:`only use a switch where flipping it takes effect immediately`}),`:`]}),`
`,(0,p.jsxs)(t.ul,{children:[`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`On an autosave surface, use a switch.`}),` Flipping it saves the change. Use `,(0,p.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-form-switchcontrol--docs`,rel:`nofollow`,children:(0,p.jsx)(t.code,{children:`SwitchControl`})}),` for turning features on and off.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`In an editor, such as the block settings sidebar, use a switch.`}),` The change applies to the content straight away, even though it is saved with the document later.`]}),`
`,(0,p.jsxs)(t.li,{children:[(0,p.jsx)(t.strong,{children:`On a manual-save surface, don’t use a switch.`}),` Nothing happens until the Save button is clicked, so a switch would either save on its own, mixing the two models, or wait for the button and contradict what it implies. Use `,(0,p.jsx)(t.a,{href:`https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-form-checkboxcontrol--docs`,rel:`nofollow`,children:(0,p.jsx)(t.code,{children:`CheckboxControl`})}),` for the same on and off choices, so they are applied together with the rest of the form.`]}),`
`]}),`
`,(0,p.jsxs)(t.p,{children:[`Keep switch labels short. Name the setting, such as “Lazy loading”, or lead with a verb, such as “Allow comments”. Use the switch’s `,(0,p.jsx)(t.code,{children:`description`}),` or the card title to provide more context.`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,p.jsx)(t,{...e,children:(0,p.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var p;function init_save_and_submit(){return(init_save_and_submit=e((()=>{p=i(),o(),t(),u()})))()}init_save_and_submit();export{MDXContent as default};