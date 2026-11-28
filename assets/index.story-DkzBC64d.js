import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{Ii as i,In as a,Rr as o,Sn as s,Wi as c,bi as l,bn as u,ls as d,m as f,n as p}from"./build-module-trvfBEgq.js";import{n as m,t as h}from"./icon-nCBDzTY0.js";import{n as g,t as _}from"./icon-button-CBzT9dub.js";import{n as v,t as y}from"./input-layout-WXkwNGQi.js";import{n as b,t as x}from"./stack-CA2zwZtU.js";import{n as S,t as C}from"./input-control-C0GsDm9O.js";import{i as w,n as T,t as E}from"./shared-CF9BtuxX.js";import{i as D,n as O,t as k}from"./index.story-Dlq_37g2.js";var A;function init_style_module(){return(init_style_module=e((()=>{A={"search-icon":`_search-icon_1kjnr_2`}})))()}var j,M,N,P,F,I,L,R,z,B,V,H,U,W,G;function init_index_story(){return(init_index_story=e((()=>{n(),p(),S(),m(),g(),v(),b(),D(),w(),init_style_module(),j=t(),M={tags:[`manifest`],title:`Components/@wordpress-ui/Form/InputControl`,id:`design-system-components-form-inputcontrol`,component:C,argTypes:{defaultValue:{control:!1},onValueChange:{action:`onValueChange`},value:{control:!1},type:{control:`text`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},N={args:{label:`Label`,description:`This is the description.`,placeholder:`Placeholder`}},P={args:{...N.args,hideLabelFromVision:!0}},F={parameters:{docs:{description:{story:T}}},args:{...N.args,description:void 0,details:E}},I={args:{...k.args,ref:void 0,...N.args}},L={args:{...O.args,ref:void 0,...N.args},parameters:{a11y:{test:`error`}}},R={render:function Template(e){let[t,n]=(0,r.useState)(!1);return(0,j.jsx)(C,{...e,type:t?`text`:`password`,prefix:(0,j.jsx)(y.Slot,{padding:`minimal`,children:(0,j.jsx)(h,{icon:i})}),suffix:(0,j.jsx)(y.Slot,{padding:`minimal`,children:(0,j.jsx)(_,{label:t?`Hide password`:`Show password`,onClick:()=>n(!t),icon:t?f:u,size:`small`,variant:`minimal`})})})},args:{...N.args,label:`Password`,description:void 0,placeholder:void 0,autoComplete:`current-password`,defaultValue:`password`}},z={args:{...N.args,type:`date`}},B={args:{...N.args,placeholder:`0`,type:`number`}},V={render:function Template(e){let[t,n]=(0,r.useState)(0);return(0,j.jsx)(C,{...e,value:t,onValueChange:e=>n(parseInt(e,10)),suffix:(0,j.jsx)(y.Slot,{padding:`minimal`,children:(0,j.jsxs)(x,{direction:`row`,gap:`xs`,children:[(0,j.jsx)(_,{label:`Increment`,icon:o,onClick:()=>n(t+1),size:`small`,variant:`minimal`}),(0,j.jsx)(_,{label:`Decrement`,icon:a,onClick:()=>n(t-1),size:`small`,variant:`minimal`})]})})})},args:{...B.args,type:`number`}},H={render:function Template(e){return(0,j.jsxs)(x,{direction:`column`,gap:`lg`,children:[(0,j.jsx)(C,{...e,label:`Email`,placeholder:`name@example.com`,type:`email`,autoComplete:`email`,prefix:(0,j.jsx)(y.Slot,{padding:`minimal`,children:(0,j.jsx)(h,{icon:d})})}),(0,j.jsx)(C,{...e,label:`Phone number`,placeholder:`+1 555 0100`,type:`tel`,autoComplete:`tel`,prefix:(0,j.jsx)(y.Slot,{padding:`minimal`,children:(0,j.jsx)(h,{icon:l})})}),(0,j.jsx)(C,{...e,label:`Website`,placeholder:`https://example.com`,type:`url`,autoComplete:`url`,prefix:(0,j.jsx)(y.Slot,{padding:`minimal`,children:(0,j.jsx)(h,{icon:c})})})]})}},U={args:{label:`Search`,hideLabelFromVision:!0,placeholder:`Search`,type:`search`,defaultValue:`Pizza`,prefix:(0,j.jsx)(y.Slot,{padding:`minimal`,children:(0,j.jsx)(h,{icon:s,className:A[`search-icon`]})})}},W={args:{...N.args,defaultValue:`Disabled value`,disabled:!0}},G={args:{...N.args,defaultValue:`Read-only value`,readOnly:!0}};try{H.__docgenInfo={description:'Common field types can show an icon in the prefix. The icon is decorative:\nthe label already names the field, so `Icon` is hidden from assistive\ntechnologies.\n\nSet `type` by the kind of value, and choose `autoComplete` by the field\'s\npurpose. For example, an email address used to sign in can use\n`type="email"` with `autoComplete="username"`.',displayName:`WithPrefixIcon`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/input-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{U.__docgenInfo={description:'A search field uses `type="search"`. Some browsers show a native button to\nclear the query, and clear it on Escape.',displayName:`Search`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/input-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Label',
    description: 'This is the description.',
    placeholder: 'Placeholder'
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    hideLabelFromVision: true
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
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
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    ...InputWithPrefix.args,
    ref: undefined,
    ...Default.args
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [show, setShow] = useState(false);
    return <InputControl {...args} type={show ? 'text' : 'password'} prefix={<InputLayout.Slot padding="minimal">
                        <Icon icon={lock} />
                    </InputLayout.Slot>} suffix={<InputLayout.Slot padding="minimal">
                        <IconButton label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} icon={show ? unseen : seen} size="small" variant="minimal" />
                    </InputLayout.Slot>} />;
  },
  args: {
    ...Default.args,
    label: 'Password',
    description: undefined,
    placeholder: undefined,
    autoComplete: 'current-password',
    defaultValue: 'password'
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    type: 'date'
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    placeholder: '0',
    type: 'number'
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    return <Stack direction="column" gap="lg">
                <InputControl {...args} label="Email" placeholder="name@example.com" type="email" autoComplete="email" prefix={<InputLayout.Slot padding="minimal">
                            <Icon icon={envelope} />
                        </InputLayout.Slot>} />
                <InputControl {...args} label="Phone number" placeholder="+1 555 0100" type="tel" autoComplete="tel" prefix={<InputLayout.Slot padding="minimal">
                            <Icon icon={mobile} />
                        </InputLayout.Slot>} />
                <InputControl {...args} label="Website" placeholder="https://example.com" type="url" autoComplete="url" prefix={<InputLayout.Slot padding="minimal">
                            <Icon icon={link} />
                        </InputLayout.Slot>} />
            </Stack>;
  }
}`,...H.parameters?.docs?.source},description:{story:'Common field types can show an icon in the prefix. The icon is decorative:\nthe label already names the field, so `Icon` is hidden from assistive\ntechnologies.\n\nSet `type` by the kind of value, and choose `autoComplete` by the field\'s\npurpose. For example, an email address used to sign in can use\n`type="email"` with `autoComplete="username"`.',...H.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Search',
    hideLabelFromVision: true,
    placeholder: 'Search',
    type: 'search',
    defaultValue: 'Pizza',
    prefix: <InputLayout.Slot padding="minimal">
                <Icon icon={search} className={styles['search-icon']} />
            </InputLayout.Slot>
  }
}`,...U.parameters?.docs?.source},description:{story:'A search field uses `type="search"`. Some browsers show a native button to\nclear the query, and clear it on Escape.',...U.parameters?.docs?.description}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    defaultValue: 'Disabled value',
    disabled: true
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    defaultValue: 'Read-only value',
    readOnly: true
  }
}`,...G.parameters?.docs?.source}}}})))()}init_index_story();export{z as Date,N as Default,W as Disabled,B as Number,V as NumberWithSteppers,R as Password,G as ReadOnly,U as Search,P as VisuallyHiddenLabel,F as WithDetails,I as WithPrefix,H as WithPrefixIcon,L as WithSuffixControl,M as default};