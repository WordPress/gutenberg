import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./button-lq-dgQsp.js";import{n as o,t as s}from"./visually-hidden-BD0tKS3_.js";import{n as c,t as l}from"./stack-CzK5c0hq.js";import{a as u,c as d,i as f,l as p,n as m,o as h,r as g,s as _,t as v,u as y}from"./trigger-Dz6v4SeN.js";import{a as b,c as x,d as S,f as C,i as w,l as T,n as E,o as D,r as O,s as k,t as A,u as j}from"./title-Rs5YSOVK.js";function SizeSelector({value:e,onChange:t}){let n=(0,r.useId)();return(0,M.jsxs)(l,{direction:`row`,gap:`sm`,align:`center`,children:[(0,M.jsx)(`label`,{htmlFor:n,children:`Dialog size preset`}),(0,M.jsx)(`select`,{id:n,value:e,onChange:e=>t(e.target.value),children:F.map(e=>(0,M.jsxs)(`option`,{value:e,children:[e,e===`medium`?` (default)`:``]},e))})]})}function SizePlaygroundContent(){let[e,t]=(0,r.useState)(`medium`);return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsxs)(l,{direction:`column`,gap:`lg`,align:`start`,children:[(0,M.jsx)(SizeSelector,{value:e,onChange:t}),(0,M.jsx)(v,{children:`Open Dialog`})]}),(0,M.jsxs)(b,{size:e,children:[(0,M.jsxs)(T,{children:[(0,M.jsx)(A,{children:`Size Playground`}),(0,M.jsx)(_,{})]}),(0,M.jsx)(S,{children:(0,M.jsxs)(l,{direction:`column`,gap:`lg`,align:`start`,children:[(0,M.jsx)(SizeSelector,{value:e,onChange:t}),(0,M.jsx)(`p`,{style:{margin:0},children:`Use the dropdown above (or outside the dialog) to change the popup size. Both controls stay in sync.`})]})}),(0,M.jsx)(g,{children:(0,M.jsx)(p,{children:`Got it`})})]})]})}function AutoSizeContent(){let e=[200,450,750,1600],[t,n]=(0,r.useState)(0);return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(v,{children:`Open content-sized dialog`}),(0,M.jsxs)(b,{size:`auto`,children:[(0,M.jsxs)(T,{children:[(0,M.jsx)(A,{children:`Content width`}),(0,M.jsx)(_,{})]}),(0,M.jsx)(S,{children:(0,M.jsxs)(`div`,{style:{width:e[t],maxWidth:`100%`},children:[(0,M.jsxs)(`p`,{children:[`Content width: `,e[t],`px`]}),(0,M.jsx)(a,{onClick:()=>n((t+1)%e.length),children:`Next content width`})]})})]})]})}function StickyToggle({stickyHeader:e,stickyFooter:t,onStickyHeaderChange:n,onStickyFooterChange:i}){let a=(0,r.useId)(),o=(0,r.useId)();return(0,M.jsxs)(l,{direction:`row`,gap:`md`,align:`center`,children:[(0,M.jsxs)(l,{direction:`row`,gap:`xs`,align:`center`,children:[(0,M.jsx)(`input`,{id:a,type:`checkbox`,checked:e,onChange:e=>n(e.target.checked)}),(0,M.jsx)(`label`,{htmlFor:a,children:`Sticky header`})]}),(0,M.jsxs)(l,{direction:`row`,gap:`xs`,align:`center`,children:[(0,M.jsx)(`input`,{id:o,type:`checkbox`,checked:t,onChange:e=>i(e.target.checked)}),(0,M.jsx)(`label`,{htmlFor:o,children:`Sticky footer`})]})]})}function ScrollableContent(){let[e,t]=(0,r.useState)(`medium`),[n,i]=(0,r.useState)(!0),[a,o]=(0,r.useState)(!0),s=(0,M.jsxs)(T,{children:[(0,M.jsx)(A,{children:`Terms of service`}),(0,M.jsx)(_,{})]}),c=(0,M.jsxs)(g,{children:[(0,M.jsx)(p,{variant:`outline`,children:`Decline`}),(0,M.jsx)(p,{children:`Accept`})]}),u=(0,M.jsxs)(l,{direction:`column`,gap:`sm`,align:`start`,children:[(0,M.jsx)(SizeSelector,{value:e,onChange:t}),(0,M.jsx)(StickyToggle,{stickyHeader:n,stickyFooter:a,onStickyHeaderChange:i,onStickyFooterChange:o})]});return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsxs)(l,{direction:`column`,gap:`lg`,align:`start`,children:[u,(0,M.jsx)(v,{children:`Open Dialog`})]}),(0,M.jsxs)(b,{size:e,children:[n&&s,(0,M.jsxs)(S,{children:[!n&&s,(0,M.jsxs)(l,{direction:`column`,gap:`lg`,children:[u,Array.from({length:20}).map((e,t)=>(0,M.jsxs)(`p`,{style:{margin:0},children:[`Paragraph `,t+1,`: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`]},t))]}),!a&&c]}),a&&c]})]})}var M,N,P,F,I,L,R,z,B;function init_index_story(){return(init_index_story=e((()=>{n(),c(),i(),o(),w(),m(),x(),D(),j(),E(),h(),C(),d(),y(),f(),M=t(),N={title:`Components/@wordpress-ui/Dialog`,id:`design-system-components-dialog`,component:O,subcomponents:{"Dialog.Trigger":v,"Dialog.Portal":k,"Dialog.Popup":b,"Dialog.Header":T,"Dialog.Title":A,"Dialog.Description":u,"Dialog.Content":S,"Dialog.CloseIconButton":_,"Dialog.Action":p,"Dialog.Footer":g},argTypes:{modal:{control:`inline-radio`,options:[!0,!1,`trap-focus`]}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},P={args:{children:[(0,M.jsx)(v,{children:`Open Dialog`},`trigger`),(0,M.jsxs)(b,{children:[(0,M.jsxs)(T,{children:[(0,M.jsx)(A,{children:`Welcome`}),(0,M.jsx)(_,{})]}),(0,M.jsx)(S,{children:(0,M.jsx)(u,{children:`This dialog demonstrates best practices for informational dialogs. It includes a close icon because dismissing it is safe and expected.`})}),(0,M.jsx)(g,{children:(0,M.jsx)(p,{children:`Got it`})})]},`popup`)]}},F=Object.keys({small:!0,medium:!0,large:!0,stretch:!0,full:!0,auto:!0}),I={args:{children:(0,M.jsx)(SizePlaygroundContent,{})}},L={args:{children:(0,M.jsx)(AutoSizeContent,{})}},R={name:`With Custom z-index`,args:{children:[(0,M.jsx)(v,{children:`Open Dialog`},`trigger`),(0,M.jsxs)(b,{portal:(0,M.jsx)(k,{style:{"--wp-ui-dialog-z-index":`9999`}}),children:[(0,M.jsxs)(T,{children:[(0,M.jsx)(A,{children:`Custom z-index`}),(0,M.jsx)(_,{})]}),(0,M.jsx)(S,{children:(0,M.jsx)(u,{children:"The backdrop and popup render at `z-index: 9999` via the `--wp-ui-dialog-z-index` CSS custom property, set on `Dialog.Portal` through the `portal` prop."})}),(0,M.jsx)(g,{children:(0,M.jsx)(p,{children:`Got it`})})]},`popup`)]}},z={args:{children:(0,M.jsx)(ScrollableContent,{})}},B={args:{children:[(0,M.jsx)(v,{children:`Open Dialog`},`trigger`),(0,M.jsxs)(b,{children:[(0,M.jsxs)(T,{children:[(0,M.jsx)(s,{render:(0,M.jsx)(A,{}),children:`Accessible dialog heading`}),(0,M.jsx)(_,{})]}),(0,M.jsx)(S,{children:(0,M.jsx)(`p`,{style:{margin:0},children:`This dialog has a visually hidden title. Inspect the DOM or use a screen reader to verify the heading is present.`})}),(0,M.jsx)(g,{children:(0,M.jsx)(p,{children:`Got it`})})]},`popup`)]}};try{P.__docgenInfo={description:`An informational dialog with a close icon, where there is no ambiguity on
what happens when clicking the close icon.`,displayName:`_Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{L.__docgenInfo={description:`Fits changing content widths while retaining the responsive minimum and
viewport inset. Wide content must also be constrained to the content area.`,displayName:`AutoSize`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{R.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a dialog renders below another popover when you\nwant it above.\n\nThe `--wp-ui-dialog-z-index` CSS variable controls the z-index of the\ndialog's backdrop and popup. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  dialog in the page), or\n- **Per instance**, by passing a `Dialog.Portal` with a `style` (or\n  `className`) to `Dialog.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:`When dialog content overflows the available height, \`Dialog.Content\`
scrolls while \`Dialog.Header\` and \`Dialog.Footer\` stay pinned to the
popup's top and bottom edges. Separator lines appear only when there
is off-screen content above the header or below the footer.

To let the header or footer scroll with the body instead of staying
pinned, render it *inside* \`Dialog.Content\` rather than as a sibling.
The inline "Sticky header / Sticky footer" checkboxes toggle exactly
that placement at runtime.

Use the inline controls to change the popup \`size\` and the sticky
placement. The same controls render both outside and inside the
dialog and stay in sync.`,displayName:`Scrollable`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{B.__docgenInfo={description:"A dialog with a visually hidden title. The title is still present in the\nDOM for `aria-labelledby`, but is not visible to sighted users.\n\nUse `<VisuallyHidden render={ <Dialog.Title /> }>` so that `Dialog.Title`\nkeeps its `<h2>` element while being visually hidden.",displayName:`WithVisuallyHiddenTitle`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Dialog.Trigger key="trigger">Open Dialog</Dialog.Trigger>, <Dialog.Popup key="popup">
                <Dialog.Header>
                    <Dialog.Title>Welcome</Dialog.Title>
                    <Dialog.CloseIconButton />
                </Dialog.Header>
                <Dialog.Content>
                    <Dialog.Description>
                        This dialog demonstrates best practices for
                        informational dialogs. It includes a close icon because
                        dismissing it is safe and expected.
                    </Dialog.Description>
                </Dialog.Content>
                <Dialog.Footer>
                    <Dialog.Action>Got it</Dialog.Action>
                </Dialog.Footer>
            </Dialog.Popup>]
  }
}`,...P.parameters?.docs?.source},description:{story:`An informational dialog with a close icon, where there is no ambiguity on
what happens when clicking the close icon.`,...P.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    children: <SizePlaygroundContent />
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    children: <AutoSizeContent />
  }
}`,...L.parameters?.docs?.source},description:{story:`Fits changing content widths while retaining the responsive minimum and
viewport inset. Wide content must also be constrained to the content area.`,...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    children: [<Dialog.Trigger key="trigger">Open Dialog</Dialog.Trigger>, <Dialog.Popup portal={<Dialog.Portal style={{
      '--wp-ui-dialog-z-index': '9999'
    }} />} key="popup">
                <Dialog.Header>
                    <Dialog.Title>Custom z-index</Dialog.Title>
                    <Dialog.CloseIconButton />
                </Dialog.Header>
                <Dialog.Content>
                    <Dialog.Description>
                        The backdrop and popup render at \`z-index: 9999\` via the
                        \`--wp-ui-dialog-z-index\` CSS custom property, set on
                        \`Dialog.Portal\` through the \`portal\` prop.
                    </Dialog.Description>
                </Dialog.Content>
                <Dialog.Footer>
                    <Dialog.Action>Got it</Dialog.Action>
                </Dialog.Footer>
            </Dialog.Popup>]
  }
}`,...R.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a dialog renders below another popover when you\nwant it above.\n\nThe `--wp-ui-dialog-z-index` CSS variable controls the z-index of the\ndialog's backdrop and popup. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  dialog in the page), or\n- **Per instance**, by passing a `Dialog.Portal` with a `style` (or\n  `className`) to `Dialog.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",...R.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    children: <ScrollableContent />
  }
}`,...z.parameters?.docs?.source},description:{story:`When dialog content overflows the available height, \`Dialog.Content\`
scrolls while \`Dialog.Header\` and \`Dialog.Footer\` stay pinned to the
popup's top and bottom edges. Separator lines appear only when there
is off-screen content above the header or below the footer.

To let the header or footer scroll with the body instead of staying
pinned, render it *inside* \`Dialog.Content\` rather than as a sibling.
The inline "Sticky header / Sticky footer" checkboxes toggle exactly
that placement at runtime.

Use the inline controls to change the popup \`size\` and the sticky
placement. The same controls render both outside and inside the
dialog and stay in sync.`,...z.parameters?.docs?.description}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Dialog.Trigger key="trigger">Open Dialog</Dialog.Trigger>, <Dialog.Popup key="popup">
                <Dialog.Header>
                    <VisuallyHidden render={<Dialog.Title />}>
                        Accessible dialog heading
                    </VisuallyHidden>
                    <Dialog.CloseIconButton />
                </Dialog.Header>
                <Dialog.Content>
                    <p style={{
          margin: 0
        }}>
                        This dialog has a visually hidden title. Inspect the DOM
                        or use a screen reader to verify the heading is present.
                    </p>
                </Dialog.Content>
                <Dialog.Footer>
                    <Dialog.Action>Got it</Dialog.Action>
                </Dialog.Footer>
            </Dialog.Popup>]
  }
}`,...B.parameters?.docs?.source},description:{story:"A dialog with a visually hidden title. The title is still present in the\nDOM for `aria-labelledby`, but is not visible to sighted users.\n\nUse `<VisuallyHidden render={ <Dialog.Title /> }>` so that `Dialog.Title`\nkeeps its `<h2>` element while being visually hidden.",...B.parameters?.docs?.description}}}})))()}init_index_story();export{I as AllSizes,L as AutoSize,z as Scrollable,R as WithCustomZIndex,B as WithVisuallyHiddenTitle,P as _Default,N as default};