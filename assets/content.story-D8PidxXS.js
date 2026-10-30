import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./stack-yNRxuGKo.js";import{i as s,n as c,r as l,t as u}from"./dataform-Dw4PbK6V.js";var d=t({HelpText:()=>h,HighLevelHelpText:()=>_,Labels:()=>m,Placeholders:()=>v,ValidationMessages:()=>g,default:()=>p}),f,p,m,h,g,_,v;function init_content_story(){return(init_content_story=e((()=>{r(),a(),c(),l(),f=n(),p={id:`dataviews-dataform-content`,title:`Design System/DataViews/DataForm/Content`,component:u,parameters:{controls:{disable:!0}},tags:[`!dev`,`manifest`]},m={render:()=>{let[e,t]=(0,i.useState)({name:``,email:``,phone:``}),n=(0,i.useMemo)(()=>[{id:`name`,label:`Name`,type:`text`},{id:`email`,label:`Email`,type:`email`},{id:`phone`,label:`Phone number`,type:`telephone`}],[]),r=(0,i.useMemo)(()=>({layout:{type:`regular`},fields:[`name`,`email`,`phone`]}),[]);return(0,f.jsx)(o,{direction:`column`,gap:`lg`,children:(0,f.jsx)(u,{data:e,fields:n,form:r,onChange:e=>t(t=>({...t,...e}))})})}},h={render:()=>{let[e,t]=(0,i.useState)({name:``,email:``,phone:``}),n=(0,i.useMemo)(()=>[{id:`name`,label:`Name`,type:`text`,placeholder:`Jane Doe`,description:`Enter your full legal name as it appears on official documents.`},{id:`email`,label:`Email`,type:`email`,placeholder:`you@example.com`,description:`We will use this to send you important account notifications and updates.`},{id:`phone`,label:`Phone number`,type:`telephone`,placeholder:`+1 (555) 123-4567`,description:`Include your country code. This number will be used for account verification.`}],[]),r=(0,i.useMemo)(()=>({layout:{type:`regular`},fields:[`name`,`email`,`phone`]}),[]);return(0,f.jsx)(o,{direction:`column`,gap:`lg`,children:(0,f.jsx)(u,{data:e,fields:n,form:r,onChange:e=>t(t=>({...t,...e}))})})}},g={render:()=>{let[e,t]=(0,i.useState)({name:``,email:`invalid-email`,phone:`123`}),n=(0,i.useMemo)(()=>[{id:`name`,label:`Name`,type:`text`,placeholder:`Jane Doe`,isValid:{required:!0}},{id:`email`,label:`Email`,type:`email`,placeholder:`you@example.com`,isValid:{required:!0,custom:e=>e.email?e.email.includes(`@`)?null:`Please enter a valid email address.`:null}},{id:`phone`,label:`Phone number`,type:`telephone`,placeholder:`+1 (555) 123-4567`,isValid:{required:!0,custom:e=>e.phone&&e.phone.length<10?`Phone number must be at least 10 digits long.`:null}}],[]),r=(0,i.useMemo)(()=>({layout:{type:`regular`},fields:[`name`,`email`,`phone`]}),[]),{validity:a}=s(e,n,r),c=(0,i.useRef)(null);return(0,i.useEffect)(()=>{a&&c.current&&c.current.querySelectorAll(`input`).forEach(e=>{e.dispatchEvent(new Event(`invalid`,{bubbles:!1}))})},[a]),(0,f.jsx)(`div`,{ref:c,children:(0,f.jsx)(o,{direction:`column`,gap:`xl`,children:(0,f.jsx)(u,{data:e,fields:n,form:r,validity:a,onChange:e=>t(t=>({...t,...e}))})})})}},_={render:()=>{let[e,t]=(0,i.useState)({name:``,email:``,phone:``}),n=(0,i.useMemo)(()=>[{id:`name`,label:`Name`,type:`text`},{id:`email`,label:`Email`,type:`email`},{id:`phone`,label:`Phone number`,type:`telephone`}],[]),r=(0,i.useMemo)(()=>({layout:{type:`regular`},fields:[{id:`accountForm`,label:`Account information`,description:`We collect this information to create your account and provide personalized services. Your data will be kept secure and used only for account management and service improvements.`,children:[`name`,`email`,`phone`],layout:{isCollapsible:!1,summary:`account-form`,type:`card`,withHeader:!0}}]}),[]);return(0,f.jsx)(o,{direction:`column`,gap:`lg`,children:(0,f.jsx)(u,{data:e,fields:n,form:r,onChange:e=>t(t=>({...t,...e}))})})}},v={render:()=>{let[e,t]=(0,i.useState)({name:``,email:``,phone:``}),n=(0,i.useMemo)(()=>[{id:`name`,label:`Name`,type:`text`,placeholder:`Jane Doe`},{id:`email`,label:`Email`,type:`email`,placeholder:`you@example.com`},{id:`phone`,label:`Phone number`,type:`telephone`,placeholder:`+1 (555) 123-4567`}],[]),r=(0,i.useMemo)(()=>({layout:{type:`regular`},fields:[`name`,`email`,`phone`]}),[]);return(0,f.jsx)(o,{direction:`column`,gap:`lg`,children:(0,f.jsx)(u,{data:e,fields:n,form:r,onChange:e=>t(t=>({...t,...e}))})})}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [data, setData] = useState<SampleData>({
      name: '',
      email: '',
      phone: ''
    });
    const fields: Field<SampleData>[] = useMemo(() => [{
      id: 'name',
      label: 'Name',
      type: 'text'
    }, {
      id: 'email',
      label: 'Email',
      type: 'email'
    }, {
      id: 'phone',
      label: 'Phone number',
      type: 'telephone'
    }], []);
    const form: Form = useMemo(() => ({
      layout: {
        type: 'regular'
      },
      fields: ['name', 'email', 'phone']
    }), []);
    return <Stack direction="column" gap="lg">
                <DataForm<SampleData> data={data} fields={fields} form={form} onChange={edits => setData(prev => ({
        ...prev,
        ...edits
      }))} />
            </Stack>;
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [data, setData] = useState<HelpTextData>({
      name: '',
      email: '',
      phone: ''
    });
    const fields: Field<HelpTextData>[] = useMemo(() => [{
      id: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Jane Doe',
      description: 'Enter your full legal name as it appears on official documents.'
    }, {
      id: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@example.com',
      description: 'We will use this to send you important account notifications and updates.'
    }, {
      id: 'phone',
      label: 'Phone number',
      type: 'telephone',
      placeholder: '+1 (555) 123-4567',
      description: 'Include your country code. This number will be used for account verification.'
    }], []);
    const form: Form = useMemo(() => ({
      layout: {
        type: 'regular'
      },
      fields: ['name', 'email', 'phone']
    }), []);
    return <Stack direction="column" gap="lg">
                <DataForm<HelpTextData> data={data} fields={fields} form={form} onChange={edits => setData(prev => ({
        ...prev,
        ...edits
      }))} />
            </Stack>;
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [data, setData] = useState<ValidationMessagesData>({
      name: '',
      email: 'invalid-email',
      phone: '123'
    });
    const fields: Field<ValidationMessagesData>[] = useMemo(() => [{
      id: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Jane Doe',
      isValid: {
        required: true
      }
    }, {
      id: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@example.com',
      isValid: {
        required: true,
        custom: item => {
          if (!item.email) {
            return null;
          }
          if (!item.email.includes('@')) {
            return 'Please enter a valid email address.';
          }
          return null;
        }
      }
    }, {
      id: 'phone',
      label: 'Phone number',
      type: 'telephone',
      placeholder: '+1 (555) 123-4567',
      isValid: {
        required: true,
        custom: item => {
          if (!item.phone) {
            return null;
          }
          if (item.phone.length < 10) {
            return 'Phone number must be at least 10 digits long.';
          }
          return null;
        }
      }
    }], []);
    const form: Form = useMemo(() => ({
      layout: {
        type: 'regular'
      },
      fields: ['name', 'email', 'phone']
    }), []);
    const {
      validity
    } = useFormValidity(data, fields, form);
    const containerRef = useRef<HTMLDivElement>(null);

    // Show validation messages on load without focusing
    useEffect(() => {
      if (validity && containerRef.current) {
        const inputs = containerRef.current.querySelectorAll('input');
        inputs.forEach(input => {
          // Dispatch 'invalid' event to trigger the validation message display
          input.dispatchEvent(new Event('invalid', {
            bubbles: false
          }));
        });
      }
    }, [validity]);
    return <div ref={containerRef}>
                <Stack direction="column" gap="xl">
                    <DataForm<ValidationMessagesData> data={data} fields={fields} form={form} validity={validity} onChange={edits => setData(prev => ({
          ...prev,
          ...edits
        }))} />
                </Stack>
            </div>;
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [data, setData] = useState<HighLevelHelpTextData>({
      name: '',
      email: '',
      phone: ''
    });
    const fields: Field<HighLevelHelpTextData>[] = useMemo(() => [{
      id: 'name',
      label: 'Name',
      type: 'text'
    }, {
      id: 'email',
      label: 'Email',
      type: 'email'
    }, {
      id: 'phone',
      label: 'Phone number',
      type: 'telephone'
    }], []);
    const form: Form = useMemo(() => ({
      layout: {
        type: 'regular'
      },
      fields: [{
        id: 'accountForm',
        label: 'Account information',
        description: 'We collect this information to create your account and provide personalized services. Your data will be kept secure and used only for account management and service improvements.',
        children: ['name', 'email', 'phone'],
        layout: {
          isCollapsible: false,
          summary: 'account-form',
          type: 'card',
          withHeader: true
        }
      }]
    }), []);
    return <Stack direction="column" gap="lg">
                <DataForm<HighLevelHelpTextData> data={data} fields={fields} form={form} onChange={edits => setData(prev => ({
        ...prev,
        ...edits
      }))} />
            </Stack>;
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [data, setData] = useState<PlaceholdersData>({
      name: '',
      email: '',
      phone: ''
    });
    const fields: Field<PlaceholdersData>[] = useMemo(() => [{
      id: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Jane Doe'
    }, {
      id: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'you@example.com'
    }, {
      id: 'phone',
      label: 'Phone number',
      type: 'telephone',
      placeholder: '+1 (555) 123-4567'
    }], []);
    const form: Form = useMemo(() => ({
      layout: {
        type: 'regular'
      },
      fields: ['name', 'email', 'phone']
    }), []);
    return <Stack direction="column" gap="lg">
                <DataForm<PlaceholdersData> data={data} fields={fields} form={form} onChange={edits => setData(prev => ({
        ...prev,
        ...edits
      }))} />
            </Stack>;
  }
}`,...v.parameters?.docs?.source}}}})))()}export{g as a,v as i,_ as n,d as o,m as r,init_content_story as s,h as t};