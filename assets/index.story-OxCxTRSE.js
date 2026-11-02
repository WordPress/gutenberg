import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{bn as i,m as a,n as o}from"./build-module-CPA2Y5FH.js";import{n as s,t as c}from"./icon-button-zoK6WFAm.js";import{n as l,t as u}from"./input-layout-DO96qrfd.js";import{n as d,t as f}from"./validated-input-control-B49-l2cs.js";import{i as p,r as m}from"./shared-CtChWZpH.js";var h,g,_,v,y;function init_index_story(){return(init_index_story=e((()=>{n(),o(),d(),s(),l(),p(),h=t(),g={title:`Components/@wordpress-ui/Form/With Validation/ValidatedInputControl`,id:`design-system-components-form-with-validation-validatedinputcontrol`,component:f,argTypes:{customValidity:{control:!1},defaultValue:{control:!1},onValueChange:{action:`onValueChange`},prefix:{control:!1},suffix:{control:!1},type:{control:`text`},value:{control:!1}},decorators:[m],parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:`APIs and behavior are still prone to change.`}}},_={args:{label:`Text`,required:!0}},v={render:function Template(e){let[t,n]=(0,r.useState)(``);return(0,h.jsx)(f,{...e,value:t,onValueChange:e=>n(e??``),customValidity:t.toLowerCase()===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0})},args:{label:`Text`,description:`The word 'error' will trigger an error.`}},y={render:function Template(e){let[t,n]=(0,r.useState)(``),[o,s]=(0,r.useState)(!1);return(0,h.jsx)(f,{...e,type:o?`text`:`password`,suffix:(0,h.jsx)(u.Slot,{padding:`minimal`,children:(0,h.jsx)(c,{label:o?`Hide password`:`Show password`,icon:o?a:i,onClick:()=>s(e=>!e),size:`small`,variant:`minimal`})}),value:t,onValueChange:e=>n(e??``),customValidity:(()=>{if(t){if(!/\d/.test(t))return{type:`invalid`,message:`Password must include at least one number.`};if(!/[A-Z]/.test(t))return{type:`invalid`,message:`Password must include at least one capital letter.`}}})()})},args:{label:`Password`,description:`Minimum 8 characters, include a number and a capital letter.`,minLength:8,required:!0}};try{_.__docgenInfo={description:"Native constraint validation (here, `required`) is reported inline when the\ncontrol is blurred or the form is submitted.",displayName:`Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/validated-input-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{v.__docgenInfo={description:'Consumer-driven validation results are passed through the `customValidity`\nprop. Type the word "error" and blur the field to trigger the custom error.',displayName:`WithCustomValidity`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/validated-input-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{y.__docgenInfo={description:`This demonstrates how password validation would work with the standard
implementation.`,displayName:`Password`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/with-validation/validated-input-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Text',
    required: true
  }
}`,..._.parameters?.docs?.source},description:{story:"Native constraint validation (here, `required`) is reported inline when the\ncontrol is blurred or the form is submitted.",..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [value, setValue] = useState('');
    return <ValidatedInputControl {...args} value={value} onValueChange={next => setValue(next ?? '')} customValidity={value.toLowerCase() === 'error' ? {
      type: 'invalid',
      message: 'The word "error" is not allowed.'
    } : undefined} />;
  },
  args: {
    label: 'Text',
    description: "The word 'error' will trigger an error."
  }
}`,...v.parameters?.docs?.source},description:{story:'Consumer-driven validation results are passed through the `customValidity`\nprop. Type the word "error" and blur the field to trigger the custom error.',...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [value, setValue] = useState('');
    const [visible, setVisible] = useState(false);
    return <ValidatedInputControl {...args} type={visible ? 'text' : 'password'} suffix={<InputLayout.Slot padding="minimal">
                        <IconButton label={visible ? 'Hide password' : 'Show password'} icon={visible ? unseen : seen} onClick={() => setVisible(v => !v)} size="small" variant="minimal" />
                    </InputLayout.Slot>} value={value} onValueChange={next => setValue(next ?? '')} customValidity={(() => {
      if (!value) {
        return undefined;
      }
      if (!/\\d/.test(value)) {
        return {
          type: 'invalid' as const,
          message: 'Password must include at least one number.'
        };
      }
      if (!/[A-Z]/.test(value)) {
        return {
          type: 'invalid' as const,
          message: 'Password must include at least one capital letter.'
        };
      }
      return undefined;
    })()} />;
  },
  args: {
    label: 'Password',
    description: 'Minimum 8 characters, include a number and a capital letter.',
    minLength: 8,
    required: true
  }
}`,...y.parameters?.docs?.source},description:{story:`This demonstrates how password validation would work with the standard
implementation.`,...y.parameters?.docs?.description}}}})))()}init_index_story();export{_ as Default,y as Password,v as WithCustomValidity,g as default};