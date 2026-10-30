import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./button-D2QAmS6r.js";import{i as s,n as c,r as l,t as u}from"./component-iH6Lsdlm.js";import{n as d,t as f}from"./dataform-BOxZdYyC.js";var p=t({SaveFormLayoutCard:()=>g,default:()=>h}),m,h,g;function init_save_and_submit_story(){return(init_save_and_submit_story=e((()=>{a(),s(),c(),d(),r(),m=n(),h={title:`Design System/Patterns/Save & Submit`,parameters:{controls:{disable:!0}},tags:[`docs-only`]},g={name:`Save form layout card`,render(){let[e,t]=(0,i.useState)({title:``});return(0,m.jsx)(`div`,{style:{maxWidth:`480px`},children:(0,m.jsx)(l,{size:{blockStart:`medium`,blockEnd:`medium`,inlineStart:`medium`,inlineEnd:`medium`},children:(0,m.jsxs)(u,{children:[(0,m.jsx)(f,{data:e,fields:[{id:`title`,label:`Title`,type:`text`}],form:{layout:{type:`regular`},fields:[`title`]},onChange:e=>t(t=>({...t,...e}))}),(0,m.jsx)(o,{variant:`primary`,isBusy:!0,style:{marginTop:`16px`},__next40pxDefaultSize:!0,children:`Save`})]})})})}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: 'Save form layout card',
  render() {
    const [data, setData] = useState({
      title: ''
    });
    return <div style={{
      maxWidth: '480px'
    }}>
                <WCCard size={{
        blockStart: 'medium',
        blockEnd: 'medium',
        inlineStart: 'medium',
        inlineEnd: 'medium'
      }}>
                    <CardBody>
                        <DataForm data={data} fields={[{
            id: 'title',
            label: 'Title',
            type: 'text'
          }]} form={{
            layout: {
              type: 'regular'
            },
            fields: ['title']
          }} onChange={edits => setData(previous => ({
            ...previous,
            ...edits
          }))} />
                        <Button variant="primary" isBusy style={{
            marginTop: '16px'
          }} __next40pxDefaultSize>
                            Save
                        </Button>
                    </CardBody>
                </WCCard>
            </div>;
  }
}`,...g.parameters?.docs?.source}}}})))()}export{init_save_and_submit_story as n,p as r,g as t};