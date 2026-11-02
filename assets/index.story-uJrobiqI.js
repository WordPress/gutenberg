import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,c as a,i as o,n as s,o as c,r as l,s as u,t as d}from"./popup-Dm_wZh14.js";import{n as f,t as p}from"./text-CMRHx_-b.js";import{n as m,t as h}from"./stack-BwmLRIE8.js";import{a as g,d as _,g as v,h as y,i as b,n as x,o as S,p as C,r as w,t as T}from"./trigger-r8rl_vow.js";function sleep(e){return new Promise(t=>setTimeout(t,e))}function StickyToggle({label:e,value:t,onChange:n}){let i=(0,r.useId)();return(0,E.jsxs)(h,{direction:`row`,gap:`sm`,align:`center`,children:[(0,E.jsx)(`input`,{id:i,type:`checkbox`,checked:t,onChange:e=>n(e.target.checked)}),(0,E.jsx)(`label`,{htmlFor:i,children:e})]})}function ScrollableContent(){let[e,t]=(0,r.useState)(!0),[n,a]=(0,r.useState)(!0);return(0,E.jsxs)(E.Fragment,{children:[(0,E.jsxs)(h,{direction:`column`,gap:`lg`,align:`start`,children:[(0,E.jsxs)(h,{direction:`row`,gap:`lg`,align:`center`,children:[(0,E.jsx)(StickyToggle,{label:`Sticky header`,value:e,onChange:t}),(0,E.jsx)(StickyToggle,{label:`Sticky footer`,value:n,onChange:a})]}),(0,E.jsx)(i,{children:`Review terms`})]}),(0,E.jsx)(d,{title:`Terms of service`,description:`Please review the terms before continuing.`,confirmButtonText:`Accept`,cancelButtonText:`Decline`,stickyHeader:e,stickyFooter:n,children:(0,E.jsx)(h,{direction:`column`,gap:`lg`,children:Array.from({length:20}).map((e,t)=>(0,E.jsxs)(`p`,{style:{margin:0},children:[`Paragraph `,t+1,`: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`]},t))})})]})}var E,D,O,k,A,j,M,N,P,F,I,L,R;function init_index_story(){return(init_index_story=e((()=>{n(),a(),c(),o(),s(),b(),x(),S(),C(),v(),m(),f(),E=t(),{action:D}=__STORYBOOK_MODULE_ACTIONS__,{fn:O}=__STORYBOOK_MODULE_TEST__,k={title:`Components/@wordpress-ui/AlertDialog`,id:`design-system-components-alertdialog`,component:u,subcomponents:{"AlertDialog.Trigger":i,"AlertDialog.Portal":l,"AlertDialog.Popup":d},argTypes:{onConfirm:{action:O()},onOpenChange:{action:O()}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},A={args:{children:[(0,E.jsx)(i,{children:`Move to trash`},`trigger`),(0,E.jsx)(d,{title:`Move to trash?`,description:`This post will be moved to trash. You can restore it later.`},`popup`)]}},j={args:{children:[(0,E.jsx)(i,{children:`Delete permanently`},`trigger`),(0,E.jsx)(d,{intent:`irreversible`,title:`Delete permanently?`,description:`This action cannot be undone. All data will be lost.`,confirmButtonText:`Delete permanently`},`popup`)]}},M={args:{children:[(0,E.jsx)(i,{children:`Send feedback`},`trigger`),(0,E.jsx)(d,{title:`Send feedback?`,description:`Your feedback helps us improve. Would you like to send it now?`,confirmButtonText:`Send feedback`,cancelButtonText:`Not now`},`popup`)]}},N={args:{children:[(0,E.jsx)(i,{children:`Remove pages`},`trigger`),(0,E.jsx)(d,{title:`Remove 3 pages?`,description:`These pages will be moved to trash.`,confirmButtonText:`Delete pages`,children:(0,E.jsxs)(`ul`,{style:{margin:`var(--wpds-dimension-gap-sm, 8px) 0 0`,paddingInlineStart:`var(--wpds-dimension-gap-lg, 16px)`},children:[(0,E.jsx)(p,{render:(0,E.jsx)(`li`,{}),children:`About us`}),(0,E.jsx)(p,{render:(0,E.jsx)(`li`,{}),children:`Contact`}),(0,E.jsx)(p,{render:(0,E.jsx)(`li`,{}),children:`Privacy policy`})]})},`popup`)]}},P={name:`With Custom z-index`,args:{children:[(0,E.jsx)(i,{children:`Move to trash`},`trigger`),(0,E.jsx)(d,{title:`Move to trash?`,description:`This post will be moved to trash. You can restore it later.`,portal:(0,E.jsx)(l,{style:{"--wp-ui-dialog-z-index":`9999`}})},`popup`)]}},F={render:()=>{let[e,t]=(0,r.useState)(!1);return(0,E.jsxs)(u,{open:e,onOpenChange:t,onConfirm:()=>D(`onConfirm`)(),children:[(0,E.jsxs)(w,{children:[(0,E.jsx)(T,{children:`Actions ▾`}),(0,E.jsxs)(g,{children:[(0,E.jsx)(_,{children:(0,E.jsx)(y,{children:`Edit`})}),(0,E.jsx)(_,{onClick:()=>t(!0),children:(0,E.jsx)(y,{children:`Delete…`})})]})]}),(0,E.jsx)(d,{intent:`irreversible`,title:`Delete permanently?`,description:`This action cannot be undone. All data will be lost.`,confirmButtonText:`Delete permanently`})]})}},I={render:function AsyncConfirmRender(e){let[t,n]=(0,r.useState)(!1),a=(0,r.useId)(),o=(0,r.useId)();return(0,E.jsxs)(E.Fragment,{children:[(0,E.jsxs)(`fieldset`,{children:[(0,E.jsx)(`legend`,{children:`Async task outcome`}),(0,E.jsxs)(`label`,{htmlFor:a,children:[(0,E.jsx)(`input`,{id:a,type:`radio`,name:`async-outcome`,checked:!t,onChange:()=>n(!1)}),`Success (closes dialog)`]}),(0,E.jsxs)(`label`,{htmlFor:o,style:{marginInlineStart:12},children:[(0,E.jsx)(`input`,{id:o,type:`radio`,name:`async-outcome`,checked:t,onChange:()=>n(!0)}),`Failure (dialog stays open, shows error)`]})]}),(0,E.jsx)(`br`,{}),(0,E.jsxs)(u,{...e,onConfirm:async()=>{D(`onConfirm`)();try{if(await sleep(2e3),t)throw Error(`Task failed`)}catch{return{close:!1,error:`Something went wrong. Please try again.`}}},children:[(0,E.jsx)(i,{children:`Delete permanently`}),(0,E.jsx)(d,{intent:`irreversible`,title:`Delete permanently?`,description:`This action cannot be undone. All data will be lost.`,confirmButtonText:`Delete permanently`})]})]})}},L={args:{children:(0,E.jsx)(ScrollableContent,{})}},R={render:function ControlledRender(e){let[t,n]=(0,r.useState)(!1);return(0,E.jsxs)(E.Fragment,{children:[(0,E.jsx)(`button`,{onClick:()=>n(!0),children:`Open Dialog`}),(0,E.jsx)(u,{...e,open:t,onOpenChange:(t,r)=>{n(t),e.onOpenChange?.(t,r)},children:(0,E.jsx)(d,{title:`Move to trash?`,description:`This post will be moved to trash. You can restore it later.`})})]})}};try{A.__docgenInfo={description:`Standard confirmation dialog for reversible actions. The dialog can be
dismissed via Escape key or the cancel/confirm buttons. Backdrop click
is blocked.`,displayName:`Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{j.__docgenInfo={description:`Confirmation dialog for irreversible actions that cannot be undone.
The confirm button uses error/danger coloring.`,displayName:`Irreversible`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{M.__docgenInfo={description:`Example with custom button labels for both confirm and cancel buttons.`,displayName:`CustomLabels`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{N.__docgenInfo={description:"Use `children` to render custom content between the description and the\naction buttons. The `description` should be self-contained for\naccessibility (`aria-describedby`); `children` adds supplementary detail.",displayName:`WithCustomContent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{P.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where an alert dialog renders below another popover when\nyou want it above.\n\n`AlertDialog` reuses `Dialog`'s styles, so the same\n`--wp-ui-dialog-z-index` CSS variable controls the z-index of the alert\ndialog's backdrop and popup. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  dialog and alert dialog in the page), or\n- **Per instance**, by passing an `AlertDialog.Portal` with a `style` (or\n  `className`) to `AlertDialog.Popup`'s `portal` prop. The variable\n  cascades from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{F.__docgenInfo={description:`Control the alert dialog when opening it from a menu item. This lets the
menu close before the dialog opens and keeps the dialog mounted while the
menu popup unmounts.`,displayName:`MenuTrigger`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{I.__docgenInfo={description:`Async confirm flow. The consumer returns a promise from \`onConfirm\`.
The dialog automatically manages the pending state: buttons are disabled
and a spinner appears on the confirm button. Toggle between success and
failure to test both outcomes.

On failure, the consumer catches the error and returns
\`{ close: false, error: '...' }\`. The component displays the message
below the action buttons and announces it to screen readers. The error
is automatically cleared on the next confirm attempt or when the dialog
reopens.`,displayName:`AsyncConfirm`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{L.__docgenInfo={description:`When the dialog's body overflows the available height, the title/description
area stays pinned to the top of the popup and the action buttons stay pinned
to the bottom so users keep sight of the context and primary actions while
scrolling. Separator borders appear only when there is off-screen content
above or below. Pass \`stickyHeader={ false }\` or \`stickyFooter={ false }\` on
\`AlertDialog.Popup\` to opt out — the toggles in this story drive both props
independently.`,displayName:`Scrollable`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{R.__docgenInfo={description:`The \`AlertDialog.Trigger\` element is not necessary when the open state is
controlled externally. This is useful when the dialog needs to be opened
from code or from a non-standard trigger element.`,displayName:`Controlled`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/alert-dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<AlertDialog.Trigger key="trigger">
                Move to trash
            </AlertDialog.Trigger>, <AlertDialog.Popup title="Move to trash?" description="This post will be moved to trash. You can restore it later." key="popup" />]
  }
}`,...A.parameters?.docs?.source},description:{story:`Standard confirmation dialog for reversible actions. The dialog can be
dismissed via Escape key or the cancel/confirm buttons. Backdrop click
is blocked.`,...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<AlertDialog.Trigger key="trigger">
                Delete permanently
            </AlertDialog.Trigger>, <AlertDialog.Popup intent="irreversible" title="Delete permanently?" description="This action cannot be undone. All data will be lost." confirmButtonText="Delete permanently" key="popup" />]
  }
}`,...j.parameters?.docs?.source},description:{story:`Confirmation dialog for irreversible actions that cannot be undone.
The confirm button uses error/danger coloring.`,...j.parameters?.docs?.description}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<AlertDialog.Trigger key="trigger">
                Send feedback
            </AlertDialog.Trigger>, <AlertDialog.Popup title="Send feedback?" description="Your feedback helps us improve. Would you like to send it now?" confirmButtonText="Send feedback" cancelButtonText="Not now" key="popup" />]
  }
}`,...M.parameters?.docs?.source},description:{story:`Example with custom button labels for both confirm and cancel buttons.`,...M.parameters?.docs?.description}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<AlertDialog.Trigger key="trigger">
                Remove pages
            </AlertDialog.Trigger>, <AlertDialog.Popup title="Remove 3 pages?" description="These pages will be moved to trash." confirmButtonText="Delete pages" key="popup">
                <ul style={{
        margin: 'var(--wpds-dimension-gap-sm) 0 0',
        paddingInlineStart: 'var(--wpds-dimension-gap-lg)'
      }}>
                    <Text render={<li />}>About us</Text>
                    <Text render={<li />}>Contact</Text>
                    <Text render={<li />}>Privacy policy</Text>
                </ul>
            </AlertDialog.Popup>]
  }
}`,...N.parameters?.docs?.source},description:{story:"Use `children` to render custom content between the description and the\naction buttons. The `description` should be self-contained for\naccessibility (`aria-describedby`); `children` adds supplementary detail.",...N.parameters?.docs?.description}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    children: [<AlertDialog.Trigger key="trigger">
                Move to trash
            </AlertDialog.Trigger>, <AlertDialog.Popup title="Move to trash?" description="This post will be moved to trash. You can restore it later." portal={<AlertDialog.Portal style={{
      '--wp-ui-dialog-z-index': '9999'
    }} />} key="popup" />]
  }
}`,...P.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where an alert dialog renders below another popover when\nyou want it above.\n\n`AlertDialog` reuses `Dialog`'s styles, so the same\n`--wp-ui-dialog-z-index` CSS variable controls the z-index of the alert\ndialog's backdrop and popup. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  dialog and alert dialog in the page), or\n- **Per instance**, by passing an `AlertDialog.Portal` with a `style` (or\n  `className`) to `AlertDialog.Popup`'s `portal` prop. The variable\n  cascades from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    return <AlertDialog.Root open={dialogOpen} onOpenChange={setDialogOpen} onConfirm={() => action('onConfirm')()}>
                <Menu.Root>
                    <Menu.Trigger>Actions ▾</Menu.Trigger>
                    <Menu.Popup>
                        <Menu.Item>
                            <Menu.ItemLabel>Edit</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item onClick={() => setDialogOpen(true)}>
                            <Menu.ItemLabel>Delete…</Menu.ItemLabel>
                        </Menu.Item>
                    </Menu.Popup>
                </Menu.Root>
                <AlertDialog.Popup intent="irreversible" title="Delete permanently?" description="This action cannot be undone. All data will be lost." confirmButtonText="Delete permanently" />
            </AlertDialog.Root>;
  }
}`,...F.parameters?.docs?.source},description:{story:`Control the alert dialog when opening it from a menu item. This lets the
menu close before the dialog opens and keeps the dialog mounted while the
menu popup unmounts.`,...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  render: function AsyncConfirmRender(args) {
    const [shouldFail, setShouldFail] = useState(false);
    const successId = useId();
    const failureId = useId();
    return <>
                <fieldset>
                    <legend>Async task outcome</legend>
                    <label htmlFor={successId}>
                        <input id={successId} type="radio" name="async-outcome" checked={!shouldFail} onChange={() => setShouldFail(false)} />
                        Success (closes dialog)
                    </label>
                    <label htmlFor={failureId} style={{
          marginInlineStart: 12
        }}>
                        <input id={failureId} type="radio" name="async-outcome" checked={shouldFail} onChange={() => setShouldFail(true)} />
                        Failure (dialog stays open, shows error)
                    </label>
                </fieldset>
                <br />
                <AlertDialog.Root {...args} onConfirm={async () => {
        action('onConfirm')();
        try {
          await sleep(2000);
          if (shouldFail) {
            throw new Error('Task failed');
          }
        } catch {
          return {
            close: false,
            error: 'Something went wrong. Please try again.'
          };
        }
        return undefined;
      }}>
                    <AlertDialog.Trigger>
                        Delete permanently
                    </AlertDialog.Trigger>
                    <AlertDialog.Popup intent="irreversible" title="Delete permanently?" description="This action cannot be undone. All data will be lost." confirmButtonText="Delete permanently" />
                </AlertDialog.Root>
            </>;
  }
}`,...I.parameters?.docs?.source},description:{story:`Async confirm flow. The consumer returns a promise from \`onConfirm\`.
The dialog automatically manages the pending state: buttons are disabled
and a spinner appears on the confirm button. Toggle between success and
failure to test both outcomes.

On failure, the consumer catches the error and returns
\`{ close: false, error: '...' }\`. The component displays the message
below the action buttons and announces it to screen readers. The error
is automatically cleared on the next confirm attempt or when the dialog
reopens.`,...I.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    children: <ScrollableContent />
  }
}`,...L.parameters?.docs?.source},description:{story:`When the dialog's body overflows the available height, the title/description
area stays pinned to the top of the popup and the action buttons stay pinned
to the bottom so users keep sight of the context and primary actions while
scrolling. Separator borders appear only when there is off-screen content
above or below. Pass \`stickyHeader={ false }\` or \`stickyFooter={ false }\` on
\`AlertDialog.Popup\` to opt out — the toggles in this story drive both props
independently.`,...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  render: function ControlledRender(args) {
    const [isOpen, setIsOpen] = useState(false);
    return <>
                <button onClick={() => setIsOpen(true)}>Open Dialog</button>
                <AlertDialog.Root {...args} open={isOpen} onOpenChange={(open, eventDetails) => {
        setIsOpen(open);
        args.onOpenChange?.(open, eventDetails);
      }}>
                    <AlertDialog.Popup title="Move to trash?" description="This post will be moved to trash. You can restore it later." />
                </AlertDialog.Root>
            </>;
  }
}`,...R.parameters?.docs?.source},description:{story:`The \`AlertDialog.Trigger\` element is not necessary when the open state is
controlled externally. This is useful when the dialog needs to be opened
from code or from a non-standard trigger element.`,...R.parameters?.docs?.description}}}})))()}init_index_story();export{I as AsyncConfirm,R as Controlled,M as CustomLabels,A as Default,j as Irreversible,F as MenuTrigger,L as Scrollable,N as WithCustomContent,P as WithCustomZIndex,k as default};