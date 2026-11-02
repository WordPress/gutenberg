import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{In as i,Rr as a,bn as o,m as s,n as c}from"./build-module-CPA2Y5FH.js";import{n as l,t as u}from"./icon-button-zoK6WFAm.js";import{n as d,t as f}from"./input-layout-DO96qrfd.js";import{n as p,t as m}from"./stack-BwmLRIE8.js";import{n as h,t as g}from"./input-control-vskh_K_W.js";import{i as _,n as v,t as y}from"./shared-CtChWZpH.js";import{i as b,n as x,t as S}from"./index.story-DVKnOTgP.js";var C,w,T,E,D,O,k,A,j,M,N,P;function init_index_story(){return(init_index_story=e((()=>{n(),c(),h(),l(),d(),p(),b(),_(),C=t(),w={tags:[`manifest`],title:`Components/@wordpress-ui/Form/InputControl`,id:`design-system-components-form-inputcontrol`,component:g,argTypes:{defaultValue:{control:!1},onValueChange:{action:`onValueChange`},value:{control:!1},type:{control:`text`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},T={args:{label:`Label`,description:`This is the description.`,placeholder:`Placeholder`}},E={args:{...T.args,hideLabelFromVision:!0}},D={parameters:{docs:{description:{story:v}}},args:{...T.args,description:void 0,details:y}},O={args:{...S.args,ref:void 0,...T.args}},k={args:{...x.args,ref:void 0,...T.args},parameters:{a11y:{test:`error`}}},A={render:function Template(e){let[t,n]=(0,r.useState)(!1);return(0,C.jsx)(g,{...e,type:t?`text`:`password`,suffix:(0,C.jsx)(f.Slot,{padding:`minimal`,children:(0,C.jsx)(u,{label:t?`Hide password`:`Show password`,onClick:()=>n(!t),icon:t?s:o,size:`small`,variant:`minimal`})})})},args:{...T.args,defaultValue:`password`}},j={args:{...T.args,type:`date`}},M={args:{...T.args,placeholder:`0`,type:`number`}},N={render:function Template(e){let[t,n]=(0,r.useState)(0);return(0,C.jsx)(g,{...e,value:t,onValueChange:e=>n(parseInt(e,10)),suffix:(0,C.jsx)(f.Slot,{padding:`minimal`,children:(0,C.jsxs)(m,{direction:`row`,gap:`xs`,children:[(0,C.jsx)(u,{label:`Increment`,icon:a,onClick:()=>n(t+1),size:`small`,variant:`minimal`}),(0,C.jsx)(u,{label:`Decrement`,icon:i,onClick:()=>n(t-1),size:`small`,variant:`minimal`})]})})})},args:{...M.args,type:`number`}},P={args:{...T.args,disabled:!0}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Label',
    description: 'This is the description.',
    placeholder: 'Placeholder'
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    hideLabelFromVision: true
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: WITH_DETAILS_DESCRIPTION
      }
    }
  },
  args: {
    ...Default.args,
    description: undefined,
    details: DETAILS_EXAMPLE
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    ...InputWithPrefix.args,
    ref: undefined,
    ...Default.args
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    ...InputWithSuffixControl.args,
    ref: undefined,
    ...Default.args
  },
  parameters: {
    a11y: {
      test: 'error'
    }
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [show, setShow] = useState(false);
    return <InputControl {...args} type={show ? 'text' : 'password'} suffix={<InputLayout.Slot padding="minimal">
                        <IconButton label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} icon={show ? unseen : seen} size="small" variant="minimal" />
                    </InputLayout.Slot>} />;
  },
  args: {
    ...Default.args,
    defaultValue: 'password'
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    type: 'date'
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    placeholder: '0',
    type: 'number'
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [value, setValue] = useState(0);
    return <InputControl {...args} value={value} onValueChange={v => setValue(parseInt(v, 10))} suffix={<InputLayout.Slot padding="minimal">
                        <Stack direction="row" gap="xs">
                            <IconButton label="Increment" icon={plus} onClick={() => setValue(value + 1)} size="small" variant="minimal" />
                            <IconButton label="Decrement" icon={reset} onClick={() => setValue(value - 1)} size="small" variant="minimal" />
                        </Stack>
                    </InputLayout.Slot>} />;
  },
  args: {
    ...Number.args,
    type: 'number'
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    disabled: true
  }
}`,...P.parameters?.docs?.source}}}})))()}init_index_story();export{j as Date,T as Default,P as Disabled,M as Number,N as NumberWithSteppers,A as Password,E as VisuallyHiddenLabel,D as WithDetails,O as WithPrefix,k as WithSuffixControl,w as default};