import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./spinner-D5-Q2poR.js";import{n as s,t as c}from"./visually-hidden-BD0tKS3_.js";import{n as l,t as ee}from"./stack-CzK5c0hq.js";import{a as u,c as d,i as f,l as p,n as te,o as m,r as h,s as ne,t as re,u as ie}from"./value-D9yVcMBq.js";import{A as g,C as ae,D as oe,E as _,F as se,I as v,L as ce,M as y,N as le,O as b,P as x,R as S,S as C,T as ue,_ as de,a as w,b as T,c as E,d as fe,f as D,g as pe,h as me,i as he,j as ge,k as O,l as k,m as A,n as j,o as M,p as N,r as P,s as F,t as I,u as L,v as R,w as z,x as _e,y as ve,z as ye}from"./fixtures-7GEoeQBk.js";import{n as be,t as B}from"./trigger-Dus3JUcK.js";import{a as xe,i as Se,o as Ce}from"./shared-OZzGz5W1.js";var we=t({AsyncItems:()=>J,Compact:()=>G,Creatable:()=>q,Default:()=>W,DetachedInline:()=>K,Grouped:()=>X,PopupWidth:()=>$,WithCustomTriggerAndItem:()=>Y,WithCustomZIndex:()=>Q,WithSeparator:()=>Z,default:()=>H});function HiddenResultCount(){let e=w().length;return e===0?null:(0,V.jsx)(c,{children:e===1?`1 result found.`:`${e} results found.`})}var V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{r(),fe(),be(),de(),me(),N(),f(),ge(),ae(),_e(),ve(),ye(),se(),le(),ue(),oe(),O(),k(),te(),ie(),d(),ce(),F(),m(),he(),a(),l(),s(),P(),Se(),V=n(),H={title:`Components/@wordpress-ui/Form/Primitives/Combobox`,id:`design-system-components-form-primitives-combobox`,component:L,subcomponents:{"Combobox.Trigger":B,"Combobox.Portal":pe,"Combobox.Positioner":A,"Combobox.Popup":D,"Combobox.InputGroup":h,"Combobox.Input":g,"Combobox.List":C,"Combobox.ListBody":T,"Combobox.ListFooter":R,"Combobox.Collection":S,"Combobox.Group":x,"Combobox.GroupLabel":y,"Combobox.Item":z,"Combobox.ItemLabel":_,"Combobox.ItemDescription":b,"Combobox.Separator":E,"Combobox.Value":re,"Combobox.Chips":p,"Combobox.ChipWithRemove":ne,"Combobox.Empty":v,"Combobox.Status":M,"Combobox.Clear":u},argTypes:{onValueChange:{action:`onValueChange`}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},U={padding:`var(--wpds-dimension-padding-sm, 8px) var(--wpds-dimension-padding-sm, 8px) var(--wpds-dimension-padding-xs, 4px)`},W={args:{items:j,children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(v,{children:`No results found.`}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})})})]},`popup`)]}},G={args:{defaultValue:j[0],items:j,children:[(0,V.jsx)(B,{size:`compact`,"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(v,{children:`No results found.`}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})})})]},`popup`)]}},K={parameters:{a11y:{config:{rules:[{id:`scrollable-region-focusable`,enabled:!1}]}}},args:{items:j,multiple:!0,inline:!0,open:!0,children:[(0,V.jsx)(g,{"aria-label":`Search items`,placeholder:`Search items`},`input`),(0,V.jsxs)(`div`,{style:{minHeight:`200px`,maxHeight:`200px`,marginTop:8,overflow:`auto`},children:[(0,V.jsx)(v,{children:`No results found.`}),(0,V.jsx)(C,{children:(0,V.jsx)(S,{children:e=>(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})})]},`div`)]}},q={render:function Template(e){let[t,n]=(0,i.useState)(``),[r,a]=(0,i.useState)(j[0]),o=t.length>0&&!j.some(e=>e.label===t.trim()),s={value:`create`,label:`Create new item`+(t?`: ${t}`:``)};return(0,V.jsxs)(L,{...e,inputValue:t,onInputValueChange:n,value:r,onValueChange:(t,n)=>{let r=t;r.value===`create`?alert(`Show dialog to create new item!`):a(r),e.onValueChange?.(t,n)},items:!t||o?[...j,s]:j,children:[(0,V.jsx)(B,{"aria-label":`Fruit`}),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(v,{children:`No results found.`}),(0,V.jsxs)(C,{children:[(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>e.value!==s.value&&(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})}),(0,V.jsx)(R,{children:(0,V.jsx)(z,{variant:`creatable`,value:s,children:(0,V.jsx)(_,{children:s.label})},s.value)})]})]})]})}},J={render:function Template(e){let[t,n]=(0,i.useState)(!1),[r,a]=(0,i.useState)([]),[s,c]=(0,i.useState)(),[l,u]=(0,i.useState)(!1),d=(0,i.useRef)(null);return(0,V.jsxs)(L,{...e,items:r,value:s,open:l,onValueChange:(t,...n)=>{c(t??void 0),e.onValueChange?.(t,...n)},onOpenChange:e=>{d.current&&clearTimeout(d.current),u(e),e&&(n(!0),a([]),d.current=setTimeout(()=>{a(j),c(e=>e??j[0]),n(!1)},500))},children:[(0,V.jsx)(B,{"aria-label":`Fruit`}),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(M,{children:t?(0,V.jsxs)(ee,{direction:`row`,gap:`sm`,align:`center`,children:[(0,V.jsx)(o,{}),`Loading…`]}):(0,V.jsx)(HiddenResultCount,{})}),(0,V.jsx)(v,{children:t?null:`No results found.`}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})})})]})]})}},Y={args:{items:j,defaultValue:j[0],children:[(0,V.jsx)(B,{"aria-label":`Fruit`,children:e=>(0,V.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,V.jsx)(`img`,{src:`https://gravatar.com/avatar/?d=initials&name=${e.value}`,alt:``,width:`20`,style:{borderRadius:`50%`}}),e.label]})},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>(0,V.jsxs)(z,{value:e,children:[(0,V.jsx)(_,{children:e.label}),(0,V.jsx)(b,{children:`99 in stock`})]},e.value)})})})]},`popup`)]}},X={args:{items:I,children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(v,{children:`No results found.`}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>(0,V.jsxs)(x,{items:e.items,children:[(0,V.jsx)(y,{children:e.label}),(0,V.jsx)(S,{children:e=>(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})]},e.label)})})})]},`popup`)]}},Z={args:{items:[...j.slice(0,3),{value:`other`,label:`Other`}],children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:(e,t)=>(0,V.jsxs)(i.Fragment,{children:[e.value===`other`&&t>0&&(0,V.jsx)(E,{}),(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})})]},e.value)})})})]},`popup`)]}},Q={name:`With Custom z-index`,args:{defaultValue:j[0],items:j,children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,positioner:(0,V.jsx)(A,{style:{"--wp-ui-combobox-z-index":`9999`}}),children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})})})]},`popup`)]}},$={decorators:[Ce],args:{items:xe},render:e=>(0,V.jsxs)(L,{...e,children:[(0,V.jsx)(B,{"aria-label":`Label`}),(0,V.jsxs)(D,{"aria-label":`Label`,width:`sm`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(g,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(C,{children:(0,V.jsx)(T,{children:(0,V.jsx)(S,{children:e=>(0,V.jsx)(z,{value:e,children:(0,V.jsx)(_,{children:e.label})},e.value)})})})]})]})};try{K.__docgenInfo={description:"For certain multiple select use cases, it may be better to design a custom\nselection state UI, rather than using a chip-based selection state UI like `SearchableChipSelect`.\nIn such cases, the selector UI can be detached and inlined into a modal dialog, for example.\n\nTo do this, omit the `Popup` and enable the `inline` prop on the `Root`.",displayName:`DetachedInline`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{J.__docgenInfo={description:"Loads the item list asynchronously. `Status` shows loading, then a\nvisually hidden result count. Use `Empty` for no results.",displayName:`AsyncItems`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:"For custom needs, a `Combobox.Trigger` can take a custom render function as its children,\nwhile `Combobox.Item` can take arbitrary content as children.\nWrap that content in `Combobox.ItemLabel`, followed by optional `Combobox.ItemDescription` components.\n\nIn this example, some extra information is added to each list item as an ARIA description.",displayName:`WithCustomTriggerAndItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:"Options can be organized into labeled groups with `Combobox.Group`\nand `Combobox.GroupLabel`.",displayName:`Grouped`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Use `Combobox.Separator` to set choices apart from each other.",displayName:`WithSeparator`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can create\nsituations where a popover renders below another popover, when you want it to be rendered above.\n\nThe `--wp-ui-combobox-z-index` CSS variable controls the z-index of the\n`Combobox` positioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  `Combobox` popup in the page), or\n- **Per instance**, by passing a `Combobox.Positioner` with a `style` (or\n  `className`) to `Combobox.Popup`'s `positioner` prop.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:"Use `width` on `Combobox.Popup` to constrain the popup relative to a narrow anchor.",displayName:`PopupWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    children: [<Combobox.Trigger aria-label="Fruit" key="trigger" />, <Combobox.Popup aria-label="Fruit" key="popup">
                <div style={inputWrapperStyle}>
                    <Combobox.Input aria-label="Search" placeholder="Search" />
                </div>
                <Combobox.Empty>No results found.</Combobox.Empty>
                <Combobox.List>
                    <Combobox.ListBody>
                        <Combobox.Collection>
                            {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                    <Combobox.ItemLabel>
                                        {item.label}
                                    </Combobox.ItemLabel>
                                </Combobox.Item>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </Combobox.Popup>]
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: ITEMS[0],
    items: ITEMS,
    children: [<Combobox.Trigger size="compact" aria-label="Fruit" key="trigger" />, <Combobox.Popup aria-label="Fruit" key="popup">
                <div style={inputWrapperStyle}>
                    <Combobox.Input aria-label="Search" placeholder="Search" />
                </div>
                <Combobox.Empty>No results found.</Combobox.Empty>
                <Combobox.List>
                    <Combobox.ListBody>
                        <Combobox.Collection>
                            {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                    <Combobox.ItemLabel>
                                        {item.label}
                                    </Combobox.ItemLabel>
                                </Combobox.Item>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </Combobox.Popup>]
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  parameters: {
    // The input keeps focus and arrow keys move through the options, so
    // the scrollable list is reachable by keyboard.
    a11y: {
      config: {
        rules: [{
          id: 'scrollable-region-focusable',
          enabled: false
        }]
      }
    }
  },
  args: {
    items: ITEMS,
    multiple: true,
    inline: true,
    // \`inline\` requires \`open\` so the input references the visible list
    // with \`aria-controls\`.
    open: true,
    children: [<Combobox.Input aria-label="Search items" placeholder="Search items" key="input" />, <div style={{
      minHeight: '200px',
      maxHeight: '200px',
      marginTop: 8,
      overflow: 'auto'
    }} key="div">
                <Combobox.Empty>No results found.</Combobox.Empty>
                <Combobox.List>
                    <Combobox.Collection>
                        {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                <Combobox.ItemLabel>
                                    {item.label}
                                </Combobox.ItemLabel>
                            </Combobox.Item>}
                    </Combobox.Collection>
                </Combobox.List>
            </div>]
  }
}`,...K.parameters?.docs?.source},description:{story:"For certain multiple select use cases, it may be better to design a custom\nselection state UI, rather than using a chip-based selection state UI like `SearchableChipSelect`.\nIn such cases, the selector UI can be detached and inlined into a modal dialog, for example.\n\nTo do this, omit the `Popup` and enable the `inline` prop on the `Root`.",...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [inputValue, setInputValue] = useState('');
    const [value, setValue] = useState(ITEMS[0]);
    const hasNoExactMatch = inputValue.length > 0 && !ITEMS.some(item => item.label === inputValue.trim());
    const creatableItem = {
      value: 'create',
      label: 'Create new item' + (inputValue ? \`: \${inputValue}\` : '')
    };
    return <Combobox.Root {...args} inputValue={inputValue} onInputValueChange={setInputValue} value={value} onValueChange={(newValue, event) => {
      const typedValue = newValue as FixtureItem;
      if (typedValue.value === 'create') {
        // eslint-disable-next-line no-alert
        alert('Show dialog to create new item!');
      } else {
        setValue(typedValue);
      }
      args.onValueChange?.(newValue, event);
    }} items={!inputValue || hasNoExactMatch ? [...ITEMS, creatableItem] : ITEMS}>
                <Combobox.Trigger aria-label="Fruit" />
                <Combobox.Popup aria-label="Fruit">
                    <div style={inputWrapperStyle}>
                        <Combobox.Input aria-label="Search" placeholder="Search" />
                    </div>
                    <Combobox.Empty>No results found.</Combobox.Empty>
                    <Combobox.List>
                        <Combobox.ListBody>
                            <Combobox.Collection>
                                {(item: FixtureItem) => item.value !== creatableItem.value && <Combobox.Item key={item.value} value={item}>
                                            <Combobox.ItemLabel>
                                                {item.label}
                                            </Combobox.ItemLabel>
                                        </Combobox.Item>}
                            </Combobox.Collection>
                        </Combobox.ListBody>
                        <Combobox.ListFooter>
                            <Combobox.Item variant="creatable" value={creatableItem} key={creatableItem.value}>
                                <Combobox.ItemLabel>
                                    {creatableItem.label}
                                </Combobox.ItemLabel>
                            </Combobox.Item>
                        </Combobox.ListFooter>
                    </Combobox.List>
                </Combobox.Popup>
            </Combobox.Root>;
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<FixtureItem[]>([]);
    const [value, setValue] = useState<FixtureItem | undefined>();
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
    return <Combobox.Root {...args} items={items} value={value} open={open} onValueChange={(newValue, ...changeArgs) => {
      setValue((newValue ?? undefined) as FixtureItem | undefined);
      args.onValueChange?.(newValue, ...changeArgs);
    }} onOpenChange={nextOpen => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setOpen(nextOpen);
      if (!nextOpen) {
        return;
      }
      setLoading(true);
      setItems([]);
      timeoutRef.current = setTimeout(() => {
        setItems(ITEMS);
        setValue(current => current ?? ITEMS[0]);
        setLoading(false);
      }, 500);
    }}>
                <Combobox.Trigger aria-label="Fruit" />
                <Combobox.Popup aria-label="Fruit">
                    <div style={inputWrapperStyle}>
                        <Combobox.Input aria-label="Search" placeholder="Search" />
                    </div>
                    <Combobox.Status>
                        {loading ? <Stack direction="row" gap="sm" align="center">
                                <Spinner />
                                Loading…
                            </Stack> : <HiddenResultCount />}
                    </Combobox.Status>
                    <Combobox.Empty>
                        {loading ? null : 'No results found.'}
                    </Combobox.Empty>
                    <Combobox.List>
                        <Combobox.ListBody>
                            <Combobox.Collection>
                                {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                        <Combobox.ItemLabel>
                                            {item.label}
                                        </Combobox.ItemLabel>
                                    </Combobox.Item>}
                            </Combobox.Collection>
                        </Combobox.ListBody>
                    </Combobox.List>
                </Combobox.Popup>
            </Combobox.Root>;
  }
}`,...J.parameters?.docs?.source},description:{story:"Loads the item list asynchronously. `Status` shows loading, then a\nvisually hidden result count. Use `Empty` for no results.",...J.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    defaultValue: ITEMS[0],
    children: [<Combobox.Trigger aria-label="Fruit" key="trigger">
                {(item: FixtureItem) => <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
                        <img src={\`https://gravatar.com/avatar/?d=initials&name=\${item.value}\`} alt="" width="20" style={{
          borderRadius: '50%'
        }} />

                        {item.label}
                    </span>}
            </Combobox.Trigger>, <Combobox.Popup aria-label="Fruit" key="popup">
                <div style={inputWrapperStyle}>
                    <Combobox.Input aria-label="Search" placeholder="Search" />
                </div>
                <Combobox.List>
                    <Combobox.ListBody>
                        <Combobox.Collection>
                            {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                    <Combobox.ItemLabel>
                                        {item.label}
                                    </Combobox.ItemLabel>
                                    <Combobox.ItemDescription>
                                        99 in stock
                                    </Combobox.ItemDescription>
                                </Combobox.Item>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </Combobox.Popup>]
  }
}`,...Y.parameters?.docs?.source},description:{story:"For custom needs, a `Combobox.Trigger` can take a custom render function as its children,\nwhile `Combobox.Item` can take arbitrary content as children.\nWrap that content in `Combobox.ItemLabel`, followed by optional `Combobox.ItemDescription` components.\n\nIn this example, some extra information is added to each list item as an ARIA description.",...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    items: GROUPED_ITEMS,
    children: [<Combobox.Trigger aria-label="Fruit" key="trigger" />, <Combobox.Popup aria-label="Fruit" key="popup">
                <div style={inputWrapperStyle}>
                    <Combobox.Input aria-label="Search" placeholder="Search" />
                </div>
                <Combobox.Empty>No results found.</Combobox.Empty>
                <Combobox.List>
                    <Combobox.ListBody>
                        <Combobox.Collection>
                            {(group: FixtureGroup) => <Combobox.Group key={group.label} items={group.items}>
                                    <Combobox.GroupLabel>
                                        {group.label}
                                    </Combobox.GroupLabel>
                                    <Combobox.Collection>
                                        {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                                <Combobox.ItemLabel>
                                                    {item.label}
                                                </Combobox.ItemLabel>
                                            </Combobox.Item>}
                                    </Combobox.Collection>
                                </Combobox.Group>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </Combobox.Popup>]
  }
}`,...X.parameters?.docs?.source},description:{story:"Options can be organized into labeled groups with `Combobox.Group`\nand `Combobox.GroupLabel`.",...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: {
    items: [...ITEMS.slice(0, 3), {
      value: 'other',
      label: 'Other'
    }],
    children: [<Combobox.Trigger aria-label="Fruit" key="trigger" />, <Combobox.Popup aria-label="Fruit" key="popup">
                <div style={inputWrapperStyle}>
                    <Combobox.Input aria-label="Search" placeholder="Search" />
                </div>
                <Combobox.List>
                    <Combobox.ListBody>
                        <Combobox.Collection>
                            {(item: FixtureItem, index: number) => <Fragment key={item.value}>
                                    {item.value === 'other' && index > 0 && <Combobox.Separator />}
                                    <Combobox.Item value={item}>
                                        <Combobox.ItemLabel>
                                            {item.label}
                                        </Combobox.ItemLabel>
                                    </Combobox.Item>
                                </Fragment>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </Combobox.Popup>]
  }
}`,...Z.parameters?.docs?.source},description:{story:"Use `Combobox.Separator` to set choices apart from each other.",...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    defaultValue: ITEMS[0],
    items: ITEMS,
    children: [<Combobox.Trigger aria-label="Fruit" key="trigger" />, <Combobox.Popup aria-label="Fruit" positioner={<Combobox.Positioner style={{
      '--wp-ui-combobox-z-index': '9999'
    }} />} key="popup">
                <div style={inputWrapperStyle}>
                    <Combobox.Input aria-label="Search" placeholder="Search" />
                </div>
                <Combobox.List>
                    <Combobox.ListBody>
                        <Combobox.Collection>
                            {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                    <Combobox.ItemLabel>
                                        {item.label}
                                    </Combobox.ItemLabel>
                                </Combobox.Item>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </Combobox.Popup>]
  }
}`,...Q.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can create\nsituations where a popover renders below another popover, when you want it to be rendered above.\n\nThe `--wp-ui-combobox-z-index` CSS variable controls the z-index of the\n`Combobox` positioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  `Combobox` popup in the page), or\n- **Per instance**, by passing a `Combobox.Positioner` with a `style` (or\n  `className`) to `Combobox.Popup`'s `positioner` prop.\n\nThis story demonstrates the per-instance approach.",...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  decorators: [narrowContainerDecorator],
  args: {
    items: longLabelPopupItems
  },
  render: args => <Combobox.Root {...args}>
            <Combobox.Trigger aria-label="Label" />
            <Combobox.Popup aria-label="Label" width="sm">
                <div style={inputWrapperStyle}>
                    <Combobox.Input aria-label="Search" placeholder="Search" />
                </div>
                <Combobox.List>
                    <Combobox.ListBody>
                        <Combobox.Collection>
                            {(item: (typeof longLabelPopupItems)[number]) => <Combobox.Item key={item.value} value={item}>
                                    <Combobox.ItemLabel>
                                        {item.label}
                                    </Combobox.ItemLabel>
                                </Combobox.Item>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </Combobox.Popup>
        </Combobox.Root>
}`,...$.parameters?.docs?.source},description:{story:"Use `width` on `Combobox.Popup` to constrain the popup relative to a narrow anchor.",...$.parameters?.docs?.description}}}})))()}export{we as n,init_index_story as r,W as t};