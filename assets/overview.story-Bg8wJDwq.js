import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./debounce-YHVHjWU7.js";import{n as s,t as c}from"./button-lq-dgQsp.js";import{n as l,t as u}from"./stack-CzK5c0hq.js";import{a as d,d as f,f as p,i as m,l as h,n as g,o as _,r as v,t as y,u as b}from"./title-Rs5YSOVK.js";import{n as x,t as S}from"./validated-input-control-DTNyeIuD.js";import{l as C,r as w,s as T,t as E,y as D}from"./popover-DgIRy3p9.js";import{i as O,r as k}from"./shared-OZzGz5W1.js";var A=t({AsyncValidation:()=>R,CustomErrorsOnSubmit:()=>z,ShowingErrorsAtArbitraryTimes:()=>B,ShowingErrorsWithoutMovingFocus:()=>V,ValidateInModal:()=>H,ValidateOnPopoverClose:()=>U,WithMultipleControls:()=>L,default:()=>I}),j,M,N,P,F,I,L,R,z,B,V,H,U;function init_overview_story(){return(init_overview_story=e((()=>{r(),a(),s(),m(),_(),b(),g(),p(),E(),l(),O(),x(),j=n(),{expect:M,userEvent:N,waitFor:P,within:F}=__STORYBOOK_MODULE_TEST__,I={title:`Components/@wordpress-ui/Form/With Validation/Overview`,id:`design-system-form-with-validation-overview`,parameters:{controls:{disable:!0}}},L={decorators:[k],render:function Template(){let[e,t]=(0,i.useState)(``),[n,r]=(0,i.useState)(``);return(0,j.jsxs)(j.Fragment,{children:[(0,j.jsx)(S,{label:`Text`,required:!0,value:e,description:`The word 'error' will trigger an error.`,onValueChange:e=>t(e??``),customValidity:e.toLowerCase()===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0}),(0,j.jsx)(S,{label:`Text`,required:!0,value:n,description:`The word 'error' will trigger an error.`,onValueChange:e=>r(e??``),customValidity:n.toLowerCase()===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0})]})}},R={decorators:[k],render:function Template({...e}){let[t,n]=(0,i.useState)(``),[r,a]=(0,i.useState)(void 0),s=(0,i.useRef)(void 0),c=(0,i.useCallback)(o(e=>{e!==``&&(a({type:`validating`,message:`Validating...`}),s.current=setTimeout(()=>{e?.toString().toLowerCase()===`error`?a({type:`invalid`,message:`The word "error" is not allowed.`}):a({type:`valid`,message:`Validated`})},1500))},500),[]);return(0,j.jsx)(S,{...e,value:t,onValueChange:e=>{n(e??``),a(void 0),clearTimeout(s.current),c(e)},customValidity:r})},args:{label:`Text`,description:`The word "error" will trigger an error asynchronously.`,required:!0}},{...R},z={decorators:[k],args:{label:`Text`,required:!0,description:`The word "error" will trigger an error.`},render:function Template({...e}){let[t,n]=(0,i.useState)(`error`);return(0,j.jsx)(S,{...e,value:t,onValueChange:e=>n(e??``),customValidity:t===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0})}},B={args:{label:`Text`,required:!0,description:`The word "error" will trigger an error.`},decorators:[],render:function Template({...e}){let[t,n]=(0,i.useState)(`error`),r=(0,i.useRef)(null);return(0,j.jsxs)(u,{direction:`column`,gap:`md`,align:`start`,children:[(0,j.jsx)(S,{ref:r,...e,value:t,onValueChange:e=>n(e??``),customValidity:t===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0}),(0,j.jsx)(c,{variant:`outline`,onClick:()=>r.current?.reportValidity(),children:`Report validity`})]})}},V={args:{label:`Text`,required:!0,description:`The word "error" will trigger an error.`},decorators:[],render:function Template({...e}){let[t,n]=(0,i.useState)(`error`),r=(0,i.useRef)(null);return(0,j.jsxs)(u,{direction:`column`,gap:`md`,align:`start`,children:[(0,j.jsx)(S,{ref:r,...e,value:t,onValueChange:e=>n(e??``),customValidity:t===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0}),(0,j.jsx)(c,{variant:`outline`,onClick:()=>r.current?.dispatchEvent(new Event(`invalid`,{cancelable:!0})),children:`Show errors`})]})}},H={render:function Template({...e}){let[t,n]=(0,i.useState)(!1),[r,a]=(0,i.useState)(``);return(0,j.jsxs)(j.Fragment,{children:[(0,j.jsx)(c,{variant:`outline`,onClick:()=>n(!0),children:`Open in modal`}),(0,j.jsx)(v,{open:t,disablePointerDismissal:!0,onOpenChange:(e,t)=>{!e&&t.reason===`escape-key`?t.cancel():n(e)},children:(0,j.jsxs)(d,{children:[(0,j.jsx)(h,{children:(0,j.jsx)(y,{children:`Dialog title`})}),(0,j.jsx)(f,{children:(0,j.jsx)(`form`,{onSubmit:e=>{e.preventDefault(),n(!1)},children:(0,j.jsxs)(u,{direction:`column`,gap:`sm`,children:[(0,j.jsx)(S,{...e,value:r,onValueChange:e=>a(e??``),customValidity:r===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0}),(0,j.jsxs)(u,{direction:`row`,gap:`sm`,justify:`flex-end`,children:[(0,j.jsx)(c,{variant:`outline`,type:`button`,onClick:()=>n(!1),children:`Cancel`}),(0,j.jsx)(c,{type:`submit`,children:`Save`})]})]})})})]})})]})},args:{label:`Text`,required:!0,description:`The word "error" will trigger an error.`}},U={render:function Template({...e}){let[t,n]=(0,i.useState)(!1),r=(0,i.useRef)(null),[a,o]=(0,i.useState)(``);return(0,j.jsxs)(T,{open:t,onOpenChange:e=>{if(e)n(!0);else{let e=r.current?.reportValidity()??!0;n(!e)}},children:[(0,j.jsx)(w,{render:(0,j.jsx)(c,{variant:`outline`}),children:`Open in popover`}),(0,j.jsxs)(C,{children:[(0,j.jsx)(D,{}),(0,j.jsx)(`form`,{ref:r,style:{width:200},onSubmit:e=>{e.preventDefault(),n(!1)},children:(0,j.jsx)(S,{...e,value:a,onValueChange:e=>o(e??``),customValidity:a===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0})})]})]})},args:{label:`Text`,description:`The word "error" will trigger an error.`,required:!0}};try{L.__docgenInfo={description:`When there are multiple controls with errors, attempting to submit will
move focus to the first control with an error.`,displayName:`WithMultipleControls`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/stories/overview.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{R.__docgenInfo={description:`To provide feedback from server-side validation, the \`customValidity\` prop can be used
to show additional status indicators while waiting for the server response,
and after the response is received.

These indicators are intended for asynchronous validation calls that may take more than 1 second to complete.
They may be unnecessary when responses are generally quick.`,displayName:`AsyncValidation`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/stories/overview.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:`Custom validity errors are effective immediately, even when they are not yet visible
to the user. For example, in this form where the initial value is already invalid,
the error message will be shown to the user once the submit button is clicked,
even if the input has never been interacted with.`,displayName:`CustomErrorsOnSubmit`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/stories/overview.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{B.__docgenInfo={description:'While it is recommended to rely on the built-in behavior for showing errors by\nusing a `form` element and `type="submit"` button around validated fields,\nit is also possible to show errors at arbitrary times.\nThis can be done by calling the [`reportValidity()` method](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity)\non a ref of the field itself, or the wrapping `form` element.',displayName:`ShowingErrorsAtArbitraryTimes`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/stories/overview.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{V.__docgenInfo={description:"A synthetic `invalid` event can be dispatched to reveal an existing error\nwithout moving focus.",displayName:`ShowingErrorsWithoutMovingFocus`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/stories/overview.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{H.__docgenInfo={description:'A `form` wrapper and `type="submit"` button can be used to force validation when\nthe user tries to commit their changes, while still allowing the dialog to be\nclosed by canceling.\n\nOptionally, `disablePointerDismissal` on `Dialog.Root` and blocking dismissal\non Escape in `onOpenChange` can force users to more explicitly signal whether\nthey are trying to "submit close" or "cancel close" the dialog, as well as\npreventing data loss on accidental closures.',displayName:`ValidateInModal`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/stories/overview.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{U.__docgenInfo={description:`[Form methods](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement#instance_methods) like
\`reportValidity()\` can be used to validate the fields when a popover is about to be closed,
and prevent the closing of the popover when invalid.`,displayName:`ValidateOnPopoverClose`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/stories/overview.story.tsx`,methods:[],props:{},tags:{}}}catch{}L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  decorators: [formDecorator],
  render: function Template() {
    const [text, setText] = useState('');
    const [text2, setText2] = useState('');
    return <>
                <ValidatedInputControl label="Text" required value={text} description="The word 'error' will trigger an error." onValueChange={next => setText(next ?? '')} customValidity={text.toLowerCase() === 'error' ? {
        type: 'invalid',
        message: 'The word "error" is not allowed.'
      } : undefined} />
                <ValidatedInputControl label="Text" required value={text2} description="The word 'error' will trigger an error." onValueChange={next => setText2(next ?? '')} customValidity={text2.toLowerCase() === 'error' ? {
        type: 'invalid',
        message: 'The word "error" is not allowed.'
      } : undefined} />
            </>;
  }
}`,...L.parameters?.docs?.source},description:{story:`When there are multiple controls with errors, attempting to submit will
move focus to the first control with an error.`,...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  decorators: [formDecorator],
  render: function Template({
    ...args
  }) {
    const [text, setText] = useState('');
    const [customValidity, setCustomValidity] = useState<React.ComponentProps<typeof ValidatedInputControl>['customValidity']>(undefined);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedValidate = useCallback(debounce(v => {
      if (v === '') {
        return;
      }
      setCustomValidity({
        type: 'validating',
        message: 'Validating...'
      });
      timeoutRef.current = setTimeout(() => {
        if (v?.toString().toLowerCase() === 'error') {
          setCustomValidity({
            type: 'invalid',
            message: 'The word "error" is not allowed.'
          });
        } else {
          setCustomValidity({
            type: 'valid',
            message: 'Validated'
          });
        }
      }, 1500);
    }, 500), []);
    return <ValidatedInputControl {...args} value={text} onValueChange={newValue => {
      setText(newValue ?? '');
      setCustomValidity(undefined);
      clearTimeout(timeoutRef.current);
      debouncedValidate(newValue);
    }} customValidity={customValidity} />;
  },
  args: {
    label: 'Text',
    description: 'The word "error" will trigger an error asynchronously.',
    required: true
  }
}`,...R.parameters?.docs?.source},description:{story:`To provide feedback from server-side validation, the \`customValidity\` prop can be used
to show additional status indicators while waiting for the server response,
and after the response is received.

These indicators are intended for asynchronous validation calls that may take more than 1 second to complete.
They may be unnecessary when responses are generally quick.`,...R.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  decorators: [formDecorator],
  args: {
    label: 'Text',
    required: true,
    description: 'The word "error" will trigger an error.'
  },
  render: function Template({
    ...args
  }) {
    const [text, setText] = useState('error');
    return <ValidatedInputControl {...args} value={text} onValueChange={next => setText(next ?? '')} customValidity={text === 'error' ? {
      type: 'invalid',
      message: 'The word "error" is not allowed.'
    } : undefined} />;
  }
}`,...z.parameters?.docs?.source},description:{story:`Custom validity errors are effective immediately, even when they are not yet visible
to the user. For example, in this form where the initial value is already invalid,
the error message will be shown to the user once the submit button is clicked,
even if the input has never been interacted with.`,...z.parameters?.docs?.description}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Text',
    required: true,
    description: 'The word "error" will trigger an error.'
  },
  decorators: [],
  render: function Template({
    ...args
  }) {
    const [text, setText] = useState('error');
    const ref = useRef<HTMLInputElement>(null);
    return <Stack direction="column" gap="md" align="start">
                <ValidatedInputControl ref={ref} {...args} value={text} onValueChange={next => setText(next ?? '')} customValidity={text === 'error' ? {
        type: 'invalid',
        message: 'The word "error" is not allowed.'
      } : undefined} />
                <Button variant="outline" onClick={() => ref.current?.reportValidity()}>
                    Report validity
                </Button>
            </Stack>;
  }
}`,...B.parameters?.docs?.source},description:{story:'While it is recommended to rely on the built-in behavior for showing errors by\nusing a `form` element and `type="submit"` button around validated fields,\nit is also possible to show errors at arbitrary times.\nThis can be done by calling the [`reportValidity()` method](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity)\non a ref of the field itself, or the wrapping `form` element.',...B.parameters?.docs?.description}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Text',
    required: true,
    description: 'The word "error" will trigger an error.'
  },
  decorators: [],
  render: function Template({
    ...args
  }) {
    const [text, setText] = useState('error');
    const ref = useRef<HTMLInputElement>(null);
    return <Stack direction="column" gap="md" align="start">
                <ValidatedInputControl ref={ref} {...args} value={text} onValueChange={next => setText(next ?? '')} customValidity={text === 'error' ? {
        type: 'invalid',
        message: 'The word "error" is not allowed.'
      } : undefined} />
                <Button variant="outline" onClick={() => ref.current?.dispatchEvent(new Event('invalid', {
        cancelable: true
      }))}>
                    Show errors
                </Button>
            </Stack>;
  }
}`,...V.parameters?.docs?.source},description:{story:"A synthetic `invalid` event can be dispatched to reveal an existing error\nwithout moving focus.",...V.parameters?.docs?.description}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  render: function Template({
    ...args
  }) {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    return <>
                <Button variant="outline" onClick={() => setIsOpen(true)}>
                    Open in modal
                </Button>
                <Dialog.Root open={isOpen} disablePointerDismissal onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && eventDetails.reason === 'escape-key') {
          eventDetails.cancel();
          return;
        }
        setIsOpen(nextOpen);
      }}>
                    <Dialog.Popup>
                        <Dialog.Header>
                            <Dialog.Title>Dialog title</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Content>
                            <form onSubmit={event => {
              event.preventDefault();
              setIsOpen(false);
            }}>
                                <Stack direction="column" gap="sm">
                                    <ValidatedInputControl {...args} value={text} onValueChange={next => setText(next ?? '')} customValidity={text === 'error' ? {
                  type: 'invalid',
                  message: 'The word "error" is not allowed.'
                } : undefined} />
                                    <Stack direction="row" gap="sm" justify="flex-end">
                                        <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">Save</Button>
                                    </Stack>
                                </Stack>
                            </form>
                        </Dialog.Content>
                    </Dialog.Popup>
                </Dialog.Root>
            </>;
  },
  args: {
    label: 'Text',
    required: true,
    description: 'The word "error" will trigger an error.'
  }
}`,...H.parameters?.docs?.source},description:{story:'A `form` wrapper and `type="submit"` button can be used to force validation when\nthe user tries to commit their changes, while still allowing the dialog to be\nclosed by canceling.\n\nOptionally, `disablePointerDismissal` on `Dialog.Root` and blocking dismissal\non Escape in `onOpenChange` can force users to more explicitly signal whether\nthey are trying to "submit close" or "cancel close" the dialog, as well as\npreventing data loss on accidental closures.',...H.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  render: function Template({
    ...args
  }) {
    const [isOpen, setIsOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [text, setText] = useState('');
    return <Popover.Root open={isOpen} onOpenChange={nextOpen => {
      if (!nextOpen) {
        const isValid = formRef.current?.reportValidity() ?? true;
        setIsOpen(!isValid);
        return;
      }
      setIsOpen(true);
    }}>
                    <Popover.Trigger render={<Button variant="outline" />}>
                        Open in popover
                    </Popover.Trigger>
                    <Popover.Popup>
                        <Popover.Arrow />
                        <form ref={formRef} style={{
          width: 200
        }} onSubmit={event => {
          event.preventDefault();
          setIsOpen(false);
        }}>
                            <ValidatedInputControl {...args} value={text} onValueChange={next => setText(next ?? '')} customValidity={text === 'error' ? {
            type: 'invalid',
            message: 'The word "error" is not allowed.'
          } : undefined} />
                        </form>
                    </Popover.Popup>
                </Popover.Root>;
  },
  args: {
    label: 'Text',
    description: 'The word "error" will trigger an error.',
    required: true
  }
}`,...U.parameters?.docs?.source},description:{story:`[Form methods](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement#instance_methods) like
\`reportValidity()\` can be used to validate the fields when a popover is about to be closed,
and prevent the closing of the popover when invalid.`,...U.parameters?.docs?.description}}}})))()}export{A as n,init_overview_story as t};