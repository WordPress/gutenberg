import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{a,c as o,n as s,o as c,s as l,t as u}from"./root-BH8P041S.js";var d=t({HierarchySelection:()=>m,default:()=>p}),f,p,m;function init_usage_guidelines_story(){return(init_usage_guidelines_story=e((()=>{r(),s(),o(),c(),f=n(),p={title:`Components/@wordpress-ui/Breadcrumb/Usage Guidelines`,id:`design-system-components-breadcrumb-usage-guidelines`,parameters:{controls:{disable:!0}},tags:[`!dev`]},m={render:function SelectionExample(){let[e,t]=(0,i.useState)(3),[n,r]=(0,i.useState)(420),[o,s]=(0,i.useState)(!1),c=(0,i.useRef)(null),d=[`Document`,`Outer group`,`Inner group`,`Paragraph`];return(0,f.jsxs)(`div`,{style:{display:`grid`,gap:`var(--wpds-dimension-gap-md, 12px)`},children:[(0,f.jsxs)(`label`,{htmlFor:`breadcrumb-width`,children:[`Trail width`,(0,f.jsx)(`input`,{id:`breadcrumb-width`,type:`range`,min:80,max:600,value:n,onChange:e=>r(Number(e.target.value))})]}),(0,f.jsxs)(`label`,{htmlFor:`breadcrumb-focus-editor`,children:[(0,f.jsx)(`input`,{id:`breadcrumb-focus-editor`,type:`checkbox`,checked:o,onChange:e=>s(e.target.checked)}),`Focus the editor on selection`]}),(0,f.jsxs)(u,{"aria-label":`Block hierarchy`,style:{width:n,maxWidth:`100%`},children:[d.slice(0,e).map((e,n)=>(0,f.jsx)(l,{onClick:()=>{t(n),o&&c.current?.focus()},children:e},e)),(0,f.jsx)(a,{"aria-current":`true`,children:d[e]},d[e])]}),(0,f.jsxs)(`label`,{htmlFor:`breadcrumb-editor`,children:[`Editor`,(0,f.jsx)(`textarea`,{id:`breadcrumb-editor`,ref:c,defaultValue:`Select an ancestor, or clear selection by choosing Document.`})]}),(0,f.jsx)(`button`,{onClick:()=>t(3),children:`Select Paragraph`})]})}};try{m.__docgenInfo={description:`Button ancestors select a position within one hierarchy. The consumer owns
selection and intentional focus moves. Set aria-current="true" on CurrentItem
to preserve selection-list semantics after the final ancestor is removed.`,displayName:`HierarchySelection`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/breadcrumb/stories/usage-guidelines.story.tsx`,methods:[],props:{},tags:{}}}catch{}m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: function SelectionExample() {
    const [selectedIndex, setSelectedIndex] = useState(3);
    const [width, setWidth] = useState(420);
    const [focusEditor, setFocusEditor] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const labels = ['Document', 'Outer group', 'Inner group', 'Paragraph'];
    return <div style={{
      display: 'grid',
      gap: 'var(--wpds-dimension-gap-md)'
    }}>
                <label htmlFor="breadcrumb-width">
                    Trail width
                    <input id="breadcrumb-width" type="range" min={80} max={600} value={width} onChange={event => setWidth(Number(event.target.value))} />
                </label>
                <label htmlFor="breadcrumb-focus-editor">
                    <input id="breadcrumb-focus-editor" type="checkbox" checked={focusEditor} onChange={event => setFocusEditor(event.target.checked)} />
                    Focus the editor on selection
                </label>
                <Breadcrumb.Root aria-label="Block hierarchy" style={{
        width,
        maxWidth: '100%'
      }}>
                    {labels.slice(0, selectedIndex).map((label, index) => <Breadcrumb.ButtonItem key={label} onClick={() => {
          setSelectedIndex(index);
          if (focusEditor) {
            editorRef.current?.focus();
          }
        }}>
                                {label}
                            </Breadcrumb.ButtonItem>)}
                    <Breadcrumb.CurrentItem aria-current="true" key={labels[selectedIndex]}>
                        {labels[selectedIndex]}
                    </Breadcrumb.CurrentItem>
                </Breadcrumb.Root>
                <label htmlFor="breadcrumb-editor">
                    Editor
                    <textarea id="breadcrumb-editor" ref={editorRef} defaultValue="Select an ancestor, or clear selection by choosing Document." />
                </label>
                <button onClick={() => setSelectedIndex(3)}>
                    Select Paragraph
                </button>
            </div>;
  }
}`,...m.parameters?.docs?.source},description:{story:`Button ancestors select a position within one hierarchy. The consumer owns
selection and intentional focus moves. Set aria-current="true" on CurrentItem
to preserve selection-list semantics after the final ancestor is removed.`,...m.parameters?.docs?.description}}}})))()}export{init_usage_guidelines_story as n,d as r,m as t};