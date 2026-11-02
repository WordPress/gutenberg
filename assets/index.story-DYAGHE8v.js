import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./control-with-error-DtSIRiMV.js";import{n as o,t as s}from"./input-control-vskh_K_W.js";import{i as c,r as l}from"./shared-CtChWZpH.js";var u,d,f,p;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o(),c(),u=t(),d={title:`Components/@wordpress-ui/Form/Primitives/ControlWithError`,id:`design-system-components-form-primitives-controlwitherror`,component:a,argTypes:{children:{control:!1},getValidityTarget:{control:!1},customValidity:{control:!1}},decorators:[l],parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:`APIs and behavior are still prone to change.`}}},f={args:{required:!0},render:function Template(e){let t=(0,r.useRef)(null),[n,i]=(0,r.useState)(``);return(0,u.jsx)(a,{...e,getValidityTarget:()=>t.current,children:(0,u.jsx)(s,{ref:t,label:`Text`,value:n,onValueChange:e=>i(e??``)})})}},p={render:function Template(e){let t=(0,r.useRef)(null),[n,i]=(0,r.useState)(``);return(0,u.jsx)(a,{...e,customValidity:n.toLowerCase()===`error`?{type:`invalid`,message:`The word "error" is not allowed.`}:void 0,getValidityTarget:()=>t.current,children:(0,u.jsx)(s,{ref:t,label:`Text`,description:`The word 'error' will trigger an error.`,value:n,onValueChange:e=>i(e??``)})})}};try{f.__docgenInfo={description:"Native constraint validation (here, `required`) is reported inline when the\ncontrol is blurred or the form is submitted.",displayName:`Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/control-with-error/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{p.__docgenInfo={description:'Consumer-driven validation results are passed through the `customValidity`\nprop. Type the word "error" and blur the field to trigger the custom error.',displayName:`WithCustomValidity`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/control-with-error/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    required: true
  },
  render: function Template(args) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');
    return <ControlWithError {...args} getValidityTarget={() => inputRef.current}>
                <InputControl ref={inputRef} label="Text" value={value} onValueChange={next => setValue(next ?? '')} />
            </ControlWithError>;
  }
}`,...f.parameters?.docs?.source},description:{story:"Native constraint validation (here, `required`) is reported inline when the\ncontrol is blurred or the form is submitted.",...f.parameters?.docs?.description}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState('');
    return <ControlWithError {...args} customValidity={value.toLowerCase() === 'error' ? {
      type: 'invalid',
      message: 'The word "error" is not allowed.'
    } : undefined} getValidityTarget={() => inputRef.current}>
                <InputControl ref={inputRef} label="Text" description="The word 'error' will trigger an error." value={value} onValueChange={next => setValue(next ?? '')} />
            </ControlWithError>;
  }
}`,...p.parameters?.docs?.source},description:{story:'Consumer-driven validation results are passed through the `customValidity`\nprop. Type the word "error" and blur the field to trigger the custom error.',...p.parameters?.docs?.description}}}})))()}init_index_story();export{f as Default,p as WithCustomValidity,d as default};