import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./number-control-Cqq2vfHm.js";var o,s,Template,c;function init_index_story(){return(init_index_story=e((()=>{n(),i(),o=t(),s={title:`Components/@wordpress-components/Selection & Input/Common/NumberControl`,id:`components-numbercontrol`,component:a,argTypes:{onChange:{action:`onChange`},prefix:{control:{type:`text`}},step:{control:{type:`text`}},suffix:{control:{type:`text`}},type:{control:{type:`text`}},value:{control:!1}},tags:[`status-experimental`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:'For new use cases, use [`InputControl`](?path=/docs/design-system-components-form-inputcontrol--docs) with `type="number"` from `@wordpress/ui` instead. Existing usages should migrate with caution, due to significant differences in behavior. See the [migration guide](?path=/docs/components-inputcontrol--migration-guide).'}}},Template=({onChange:e,...t})=>{let[n,i]=(0,r.useState)(`0`),[s,c]=(0,r.useState)(!0);return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(a,{...t,value:n,onChange:(t,n)=>{i(t),c(n.event.target.validity.valid),e?.(t,n)}}),(0,o.jsxs)(`p`,{children:[`Is valid? `,s?`Yes`:`No`]})]})},c=Template.bind({}),c.args={label:`Value`},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`({
  onChange,
  ...props
}) => {
  const [value, setValue] = useState<string | undefined>('0');
  const [isValidValue, setIsValidValue] = useState(true);
  return <>
            <NumberControl {...props} value={value} onChange={(v, extra) => {
      setValue(v);
      setIsValidValue((extra.event.target as HTMLInputElement).validity.valid);
      onChange?.(v, extra);
    }} />
            <p>Is valid? {isValidValue ? 'Yes' : 'No'}</p>
        </>;
}`,...c.parameters?.docs?.source}}}})))()}init_index_story();export{c as Default,s as default};