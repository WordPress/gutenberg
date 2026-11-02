import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./visually-hidden-Bafg0_Jr.js";import{a as s,c,i as l,l as u,n as d,o as f,r as p,s as m,t as h,u as g}from"./trigger-BHTKJuRR.js";import{a as _,i as v,o as y,r as b}from"./description-COF9Jorc.js";import{n as x,t as S}from"./select-control-DcLyiK47.js";var C=t({SelectedHints:()=>D,SmallSize:()=>O,StoredValue:()=>E,default:()=>T}),w,T,E,D,O;function init_migration_story(){return(init_migration_story=e((()=>{r(),y(),v(),l(),d(),f(),c(),g(),x(),a(),w=n(),T={title:`Components/@wordpress-components/Selection & Input/Common/CustomSelectControl/Migration examples`,id:`components-customselectcontrol-migration-examples`,component:S,tags:[`docs-only`]},E={render:function Render(){let e=[{value:`thumbnail`,label:`Thumbnail`,description:`150 × 150`},{value:`medium`,label:`Medium`,description:`300 × 300`},{value:`full`,label:`Full size`,description:`Original dimensions`}],[t,n]=(0,i.useState)(`medium`),r=e.find(e=>e.value===t)??null;return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(S,{label:`Image size`,items:e,value:r,onValueChange:e=>n(e?.value??null)}),(0,w.jsxs)(`p`,{children:[`Stored value: `,(0,w.jsx)(`code`,{children:JSON.stringify(t)})]})]})}},D={render:function Render(){let e=[{key:`serif`,name:`Serif`,hint:`Traditional`,style:{fontFamily:`serif`},className:`font-preview`},{key:`sans-serif`,name:`Sans serif`,hint:`Modern`,style:{fontFamily:`sans-serif`},className:`font-preview`}],[t,n]=(0,i.useState)(`serif`),r=e.map(e=>({value:e.key,label:e.name,description:e.hint,style:e.style,className:e.className})),a=r.find(e=>e.value===t)??null,s=a?.description,c=(0,i.useId)(),l=[s,`Choose a font for the heading.`].filter(Boolean).join(` `);return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsx)(S,{label:`Font`,items:r,value:a,onValueChange:e=>{e&&n(e.value)},trigger:(0,w.jsx)(S.Trigger,{"aria-describedby":c,children:a?(0,w.jsxs)(w.Fragment,{children:[a.label,s&&(0,w.jsxs)(`span`,{"aria-hidden":`true`,children:[` `,`(`,s,`)`]})]}):void 0}),children:r.map(e=>(0,w.jsxs)(S.Item,{value:e,label:e.label,className:e.className,children:[(0,w.jsx)(S.ItemLabel,{style:e.style,children:e.label}),(0,w.jsx)(S.ItemDescription,{children:e.description})]},e.value))}),(0,w.jsx)(o,{id:c,children:l}),(0,w.jsxs)(`p`,{children:[`Stored value: `,(0,w.jsx)(`code`,{children:JSON.stringify(t)})]})]})}},O={render:function Render(){let e=[{value:`10`,label:`10`},{value:`20`,label:`20`},{value:`50`,label:`50`}],[t,n]=(0,i.useState)(`20`);return(0,w.jsxs)(w.Fragment,{children:[(0,w.jsxs)(_,{children:[(0,w.jsx)(b,{children:`Items per page`}),(0,w.jsxs)(p,{items:e,value:t,onValueChange:n,children:[(0,w.jsx)(h,{size:`small`}),(0,w.jsx)(s,{width:`content`,children:e.map(e=>(0,w.jsx)(m,{value:e.value,size:`small`,children:(0,w.jsx)(u,{children:e.label})},e.value))})]})]}),(0,w.jsxs)(`p`,{children:[`Stored value: `,(0,w.jsx)(`code`,{children:JSON.stringify(t)})]})]})}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const items = [{
      value: 'thumbnail',
      label: 'Thumbnail',
      description: '150 × 150'
    }, {
      value: 'medium',
      label: 'Medium',
      description: '300 × 300'
    }, {
      value: 'full',
      label: 'Full size',
      description: 'Original dimensions'
    }];
    const [imageSize, setImageSize] = useState<string | null>('medium');
    const selectedItem = items.find(item => item.value === imageSize) ?? null;
    return <>
                <SelectControl label="Image size" items={items} value={selectedItem} onValueChange={item => setImageSize(item?.value ?? null)} />
                <p>
                    Stored value: <code>{JSON.stringify(imageSize)}</code>
                </p>
            </>;
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const options = [{
      key: 'serif',
      name: 'Serif',
      hint: 'Traditional',
      style: {
        fontFamily: 'serif'
      },
      className: 'font-preview'
    }, {
      key: 'sans-serif',
      name: 'Sans serif',
      hint: 'Modern',
      style: {
        fontFamily: 'sans-serif'
      },
      className: 'font-preview'
    }];
    const [font, setFont] = useState<string | null>('serif');
    const items = options.map(option => ({
      value: option.key,
      label: option.name,
      description: option.hint,
      style: option.style,
      className: option.className
    }));
    const selectedItem = items.find(item => item.value === font) ?? null;
    const selectedHint = selectedItem?.description;
    const descriptionId = useId();
    const describedBy = 'Choose a font for the heading.';
    const description = [selectedHint, describedBy].filter(Boolean).join(' ');
    return <>
                <SelectControl label="Font" items={items} value={selectedItem} onValueChange={item => {
        if (item) {
          setFont(item.value);
        }
      }} trigger={<SelectControl.Trigger aria-describedby={descriptionId}>
                            {selectedItem ? <>
                                    {selectedItem.label}
                                    {selectedHint && <span aria-hidden="true">
                                            {' '}
                                            ({selectedHint})
                                        </span>}
                                </> : undefined}
                        </SelectControl.Trigger>}>
                    {items.map(item => <SelectControl.Item key={item.value} value={item} label={item.label} className={item.className}>
                            <SelectControl.ItemLabel style={item.style}>
                                {item.label}
                            </SelectControl.ItemLabel>
                            <SelectControl.ItemDescription>
                                {item.description}
                            </SelectControl.ItemDescription>
                        </SelectControl.Item>)}
                </SelectControl>
                <VisuallyHidden id={descriptionId}>
                    {description}
                </VisuallyHidden>
                <p>
                    Stored value: <code>{JSON.stringify(font)}</code>
                </p>
            </>;
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const items = [{
      value: '10',
      label: '10'
    }, {
      value: '20',
      label: '20'
    }, {
      value: '50',
      label: '50'
    }];
    const [perPage, setPerPage] = useState<string | null>('20');
    return <>
                <Field.Root>
                    <Field.Label>Items per page</Field.Label>
                    <Select.Root items={items} value={perPage} onValueChange={setPerPage}>
                        <Select.Trigger size="small" />
                        <Select.Popup width="content">
                            {items.map(item => <Select.Item key={item.value} value={item.value} size="small">
                                    <Select.ItemLabel>
                                        {item.label}
                                    </Select.ItemLabel>
                                </Select.Item>)}
                        </Select.Popup>
                    </Select.Root>
                </Field.Root>
                <p>
                    Stored value: <code>{JSON.stringify(perPage)}</code>
                </p>
            </>;
  }
}`,...O.parameters?.docs?.source}}}})))()}export{C as a,init_migration_story as i,O as n,E as r,D as t};