import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{a as r,c as i,n as a,o,s,t as ee}from"./popup-Dm_wZh14.js";import{_ as te,a as ne,b as re,c as ie,d as ae,f as c,g as l,h as u,i as d,m as f,n as p,o as m,p as h,r as g,s as _,t as v,v as y,y as b}from"./trigger-BTI1-NIA.js";import{n as x,t as S}from"./stack-BwmLRIE8.js";import{a as C,i as w,o as T,r as E}from"./description-QbEutRc0.js";import{n as D,t as O}from"./textarea-CDuxlc7z.js";import{a as k,c as A,i as oe,l as j,n as M,o as N,r as P,s as F,t as I,u as L}from"./trigger-DetnP3K5.js";import{a as R,d as z,f as B,i as V,l as H,n as U,o as W,r as G,t as K,u as q}from"./title-qcGP2LEQ.js";import{n as se,t as J}from"./input-control-vskh_K_W.js";var ce=t({AlertDialogForDeliberateInterruption:()=>Q,DialogForFocusedTask:()=>Z,DrawerForContextualEditing:()=>$,default:()=>X}),Y,X,Z,Q,$;function init_usage_guidelines_story(){return(init_usage_guidelines_story=e((()=>{i(),o(),a(),m(),p(),ie(),c(),d(),y(),l(),f(),re(),se(),T(),w(),D(),x(),V(),M(),W(),q(),U(),A(),B(),N(),oe(),L(),Y=n(),X={title:`Components/@wordpress-ui/Dialog/Usage Guidelines`,id:`design-system-components-dialog-usage-guidelines`,parameters:{controls:{disable:!0}},tags:[`!dev`]},Z={render:()=>(0,Y.jsxs)(G,{children:[(0,Y.jsx)(I,{children:`Add tax rate`}),(0,Y.jsxs)(R,{size:`small`,children:[(0,Y.jsxs)(H,{children:[(0,Y.jsx)(K,{children:`Add tax rate`}),(0,Y.jsx)(F,{})]}),(0,Y.jsx)(z,{children:(0,Y.jsxs)(S,{direction:`column`,gap:`sm`,children:[(0,Y.jsx)(k,{children:`Enter a name and percentage for the new tax rate.`}),(0,Y.jsx)(J,{label:`Name`,defaultValue:`Standard rate`}),(0,Y.jsx)(J,{label:`Rate (%)`,type:`number`,defaultValue:`8.5`})]})}),(0,Y.jsxs)(P,{children:[(0,Y.jsx)(j,{variant:`outline`,children:`Cancel`}),(0,Y.jsx)(j,{children:`Add tax rate`})]})]})]})},Q={render:()=>(0,Y.jsxs)(s,{children:[(0,Y.jsx)(r,{children:`Remove customer`}),(0,Y.jsx)(ee,{intent:`irreversible`,title:`Remove customer?`,description:`This customer will lose access to their account. This action cannot be undone.`,confirmButtonText:`Remove customer`})]})},$={render:()=>(0,Y.jsxs)(ne,{modal:!1,swipeDirection:`right`,children:[(0,Y.jsx)(v,{children:`Edit order details`}),(0,Y.jsxs)(_,{size:`medium`,children:[(0,Y.jsxs)(ae,{children:[(0,Y.jsx)(g,{children:`Order details`}),(0,Y.jsx)(te,{})]}),(0,Y.jsx)(u,{children:(0,Y.jsxs)(S,{direction:`column`,gap:`md`,children:[(0,Y.jsx)(J,{label:`Customer name`,defaultValue:`Alex Rivera`}),(0,Y.jsxs)(C,{children:[(0,Y.jsx)(E,{children:`Shipping address`}),(0,Y.jsx)(O,{defaultValue:`123 Market Street
San Francisco, CA 94103`,rows:3})]}),(0,Y.jsxs)(C,{children:[(0,Y.jsx)(E,{children:`Internal note`}),(0,Y.jsx)(O,{defaultValue:`Gift wrap requested.`,rows:2})]})]})}),(0,Y.jsxs)(h,{children:[(0,Y.jsx)(b,{variant:`outline`,children:`Cancel`}),(0,Y.jsx)(b,{children:`Save changes`})]})]})]})};try{Z.__docgenInfo={description:`Dialog works well for a focused task with one primary action that can be
opened from many places without needing surrounding page context.`,displayName:`DialogForFocusedTask`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:`AlertDialog is appropriate when the overlay is a deliberate interruption,
such as confirming a destructive action.`,displayName:`AlertDialogForDeliberateInterruption`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:`Drawer fits contextual editing where the user benefits from keeping the
underlying page visible while working through multiple fields or sections.`,displayName:`DrawerForContextualEditing`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/dialog/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: () => <Dialog.Root>
            <Dialog.Trigger>Add tax rate</Dialog.Trigger>
            <Dialog.Popup size="small">
                <Dialog.Header>
                    <Dialog.Title>Add tax rate</Dialog.Title>
                    <Dialog.CloseIconButton />
                </Dialog.Header>
                <Dialog.Content>
                    <Stack direction="column" gap="sm">
                        <Dialog.Description>
                            Enter a name and percentage for the new tax rate.
                        </Dialog.Description>
                        <InputControl label="Name" defaultValue="Standard rate" />
                        <InputControl label="Rate (%)" type="number" defaultValue="8.5" />
                    </Stack>
                </Dialog.Content>
                <Dialog.Footer>
                    <Dialog.Action variant="outline">Cancel</Dialog.Action>
                    <Dialog.Action>Add tax rate</Dialog.Action>
                </Dialog.Footer>
            </Dialog.Popup>
        </Dialog.Root>
}`,...Z.parameters?.docs?.source},description:{story:`Dialog works well for a focused task with one primary action that can be
opened from many places without needing surrounding page context.`,...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  render: () => <AlertDialog.Root>
            <AlertDialog.Trigger>Remove customer</AlertDialog.Trigger>
            <AlertDialog.Popup intent="irreversible" title="Remove customer?" description="This customer will lose access to their account. This action cannot be undone." confirmButtonText="Remove customer" />
        </AlertDialog.Root>
}`,...Q.parameters?.docs?.source},description:{story:`AlertDialog is appropriate when the overlay is a deliberate interruption,
such as confirming a destructive action.`,...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: () => <Drawer.Root modal={false} swipeDirection="right">
            <Drawer.Trigger>Edit order details</Drawer.Trigger>
            <Drawer.Popup size="medium">
                <Drawer.Header>
                    <Drawer.Title>Order details</Drawer.Title>
                    <Drawer.CloseIconButton />
                </Drawer.Header>
                <Drawer.Content>
                    <Stack direction="column" gap="md">
                        <InputControl label="Customer name" defaultValue="Alex Rivera" />
                        <Field.Root>
                            <Field.Label>Shipping address</Field.Label>
                            <Textarea defaultValue={'123 Market Street\\nSan Francisco, CA 94103'} rows={3} />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Internal note</Field.Label>
                            <Textarea defaultValue="Gift wrap requested." rows={2} />
                        </Field.Root>
                    </Stack>
                </Drawer.Content>
                <Drawer.Footer>
                    <Drawer.Action variant="outline">Cancel</Drawer.Action>
                    <Drawer.Action>Save changes</Drawer.Action>
                </Drawer.Footer>
            </Drawer.Popup>
        </Drawer.Root>
}`,...$.parameters?.docs?.source},description:{story:`Drawer fits contextual editing where the user benefits from keeping the
underlying page visible while working through multiple fields or sections.`,...$.parameters?.docs?.description}}}})))()}export{ce as a,init_usage_guidelines_story as i,Z as n,$ as r,Q as t};