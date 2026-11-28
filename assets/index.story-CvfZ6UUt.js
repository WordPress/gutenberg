import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./avatar-DkjtsTBF.js";import{n as s,t as c}from"./visually-hidden-BD0tKS3_.js";import{a as l,c as u,i as ee,l as te,n as ne,o as re,r as ie,s as d,t as f,u as ae}from"./value-BvwLOEGi.js";import{A as p,B as m,C as oe,D as se,E as h,F as ce,I as g,L as le,M as _,N as ue,O as v,P as y,R as b,S as x,T as S,V as de,_ as C,a as w,b as T,c as E,d as fe,f as D,g as pe,h as me,i as he,j as ge,k as O,l as k,m as A,n as j,o as M,p as N,r as P,s as F,t as I,u as L,v as R,w as z,x as _e,y as ve,z as ye}from"./fixtures-j-ZIJgYw.js";import{n as be,t as B}from"./trigger-C8YUv8Qc.js";import{a as xe,i as Se,o as Ce}from"./shared-CF9BtuxX.js";var we=t({AsyncItems:()=>J,Compact:()=>G,Creatable:()=>q,Default:()=>W,DetachedInline:()=>K,Grouped:()=>X,PopupWidth:()=>$,WithCustomTriggerAndItem:()=>Y,WithCustomZIndex:()=>Q,WithSeparator:()=>Z,default:()=>H});function HiddenResultCount(){let e=w().length;return e===0?null:(0,V.jsx)(c,{children:e===1?`1 result found.`:`${e} results found.`})}var V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{r(),fe(),ve(),be(),C(),me(),N(),ee(),ue(),S(),oe(),_e(),de(),le(),ce(),se(),O(),ge(),k(),ne(),ae(),u(),ye(),F(),re(),he(),a(),s(),P(),Se(),V=n(),H={title:`Components/@wordpress-ui/Form/Primitives/Combobox`,id:`design-system-components-form-primitives-combobox`,component:L,subcomponents:{"Combobox.LoadingIndicator":R,"Combobox.Trigger":B,"Combobox.Portal":pe,"Combobox.Positioner":A,"Combobox.Popup":D,"Combobox.InputGroup":ie,"Combobox.Input":_,"Combobox.List":z,"Combobox.ListBody":x,"Combobox.ListFooter":T,"Combobox.Collection":m,"Combobox.Group":g,"Combobox.GroupLabel":y,"Combobox.Item":h,"Combobox.ItemLabel":v,"Combobox.ItemDescription":p,"Combobox.Separator":E,"Combobox.Value":f,"Combobox.Chips":te,"Combobox.ChipWithRemove":d,"Combobox.Empty":b,"Combobox.Status":M,"Combobox.Clear":l},argTypes:{onValueChange:{action:`onValueChange`}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},U={padding:`var(--wpds-dimension-padding-sm, 8px) var(--wpds-dimension-padding-sm, 8px) var(--wpds-dimension-padding-xs, 4px)`},W={args:{items:j,children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(b,{children:`No results found.`}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})})})]},`popup`)]}},G={args:{defaultValue:j[0],items:j,children:[(0,V.jsx)(B,{size:`compact`,"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(b,{children:`No results found.`}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})})})]},`popup`)]}},K={parameters:{a11y:{config:{rules:[{id:`scrollable-region-focusable`,enabled:!1},{id:`aria-required-children`,enabled:!1}]}}},args:{items:j,multiple:!0,inline:!0,open:!0,children:[(0,V.jsx)(_,{"aria-label":`Search items`,placeholder:`Search items`},`input`),(0,V.jsxs)(`div`,{style:{marginTop:8},children:[(0,V.jsx)(b,{children:`No results found.`}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{style:{maxHeight:200,scrollbarGutter:`stable`,paddingInlineEnd:`var(--wpds-dimension-padding-xs, 4px)`},children:(0,V.jsx)(m,{children:e=>(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})})})]},`div`)]}},q={render:function Template(e){let[t,n]=(0,i.useState)(``),[r,a]=(0,i.useState)(j[0]),o=t.length>0&&!j.some(e=>e.label===t.trim()),s={value:`create`,label:`Create new item`+(t?`: ${t}`:``)};return(0,V.jsxs)(L,{...e,inputValue:t,onInputValueChange:n,value:r,onValueChange:(t,n)=>{let r=t;r.value===`create`?alert(`Show dialog to create new item!`):a(r),e.onValueChange?.(t,n)},items:!t||o?[...j,s]:j,children:[(0,V.jsx)(B,{"aria-label":`Fruit`}),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(b,{children:`No results found.`}),(0,V.jsxs)(z,{children:[(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>e.value!==s.value&&(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})}),(0,V.jsx)(T,{children:(0,V.jsx)(h,{variant:`creatable`,value:s,children:(0,V.jsx)(v,{children:s.label})},s.value)})]})]})]})}},J={render:function Template(e){let[t,n]=(0,i.useState)(!1),[r,a]=(0,i.useState)([]),[o,s]=(0,i.useState)(),[c,l]=(0,i.useState)(!1),u=(0,i.useRef)(null);return(0,V.jsxs)(L,{...e,items:r,value:o,open:c,onValueChange:(t,...n)=>{s(t??void 0),e.onValueChange?.(t,...n)},onOpenChange:e=>{u.current&&clearTimeout(u.current),l(e),e&&(n(!0),a([]),u.current=setTimeout(()=>{a(j),s(e=>e??j[0]),n(!1)},2e3))},children:[(0,V.jsx)(B,{"aria-label":`Fruit`}),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(M,{children:t?(0,V.jsx)(R,{}):(0,V.jsx)(HiddenResultCount,{})}),(0,V.jsx)(b,{children:t?null:`No results found.`}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})})})]})]})}},Y={args:{items:j,defaultValue:j[0],children:[(0,V.jsx)(B,{"aria-label":`Fruit`,children:e=>(0,V.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,V.jsx)(o,{name:e.label,size:`xs`,"aria-hidden":!0}),e.label]})},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>(0,V.jsxs)(h,{value:e,children:[(0,V.jsx)(v,{children:e.label}),(0,V.jsx)(p,{children:`99 in stock`})]},e.value)})})})]},`popup`)]}},X={args:{items:I,children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(b,{children:`No results found.`}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>(0,V.jsxs)(g,{items:e.items,children:[(0,V.jsx)(y,{children:e.label}),(0,V.jsx)(m,{children:e=>(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})]},e.label)})})})]},`popup`)]}},Z={args:{items:[...j.slice(0,3),{value:`other`,label:`Other`}],children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:(e,t)=>(0,V.jsxs)(i.Fragment,{children:[e.value===`other`&&t>0&&(0,V.jsx)(E,{}),(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})})]},e.value)})})})]},`popup`)]}},Q={name:`With Custom z-index`,args:{defaultValue:j[0],items:j,children:[(0,V.jsx)(B,{"aria-label":`Fruit`},`trigger`),(0,V.jsxs)(D,{"aria-label":`Fruit`,positioner:(0,V.jsx)(A,{style:{"--wp-ui-combobox-z-index":`9999`}}),children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})})})]},`popup`)]}},$={decorators:[Ce],args:{items:xe},render:e=>(0,V.jsxs)(L,{...e,children:[(0,V.jsx)(B,{"aria-label":`Label`}),(0,V.jsxs)(D,{"aria-label":`Label`,width:`sm`,children:[(0,V.jsx)(`div`,{style:U,children:(0,V.jsx)(_,{"aria-label":`Search`,placeholder:`Search`})}),(0,V.jsx)(z,{children:(0,V.jsx)(x,{children:(0,V.jsx)(m,{children:e=>(0,V.jsx)(h,{value:e,children:(0,V.jsx)(v,{children:e.label})},e.value)})})})]})]})};try{K.__docgenInfo={description:"For certain multiple select use cases, it may be better to design a custom\nselection state UI, rather than using a chip-based selection state UI like `SearchableChipSelect`.\nIn such cases, the selector UI can be detached and inlined into a modal dialog, for example.\n\nTo do this, omit the `Popup` and enable the `inline` prop on the `Root`.\n\nTo keep the items clear of a classic scrollbar, give `Combobox.ListBody` an\ninline-end padding. Also set `scrollbar-gutter: stable` on it, so that the\nitems keep their width when the scrollbar appears or disappears.",displayName:`DetachedInline`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{J.__docgenInfo={description:"Render `Combobox.LoadingIndicator` inside `Combobox.Status` while fetching\nitems. Pass `children` to customize its message. After loading, render a\nvisually hidden result count inside `Status` to announce it. Use `Empty`\nfor no results.",displayName:`AsyncItems`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:"For custom needs, a `Combobox.Trigger` can take a custom render function as its children,\nwhile `Combobox.Item` can take arbitrary content as children.\nWrap that content in `Combobox.ItemLabel`, followed by optional `Combobox.ItemDescription` components.\n\nIn this example, some extra information is added to each list item as an ARIA description.",displayName:`WithCustomTriggerAndItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:"Options can be organized into labeled groups with `Combobox.Group`\nand `Combobox.GroupLabel`.",displayName:`Grouped`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Use `Combobox.Separator` to set choices apart from each other.",displayName:`WithSeparator`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can create\nsituations where a popover renders below another popover, when you want it to be rendered above.\n\nThe `--wp-ui-combobox-z-index` CSS variable controls the z-index of the\n`Combobox` positioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  `Combobox` popup in the page), or\n- **Per instance**, by passing a `Combobox.Positioner` with a `style` (or\n  `className`) to `Combobox.Popup`'s `positioner` prop.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:"Use `width` on `Combobox.Popup` to constrain the popup relative to a narrow anchor.",displayName:`PopupWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/combobox/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
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
        },
        // axe flags the focusable ListBody, which is a generic wrapper.
        // The listbox still owns its options.
        {
          id: 'aria-required-children',
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
      marginTop: 8
    }} key="div">
                <Combobox.Empty>No results found.</Combobox.Empty>
                <Combobox.List>
                    <Combobox.ListBody style={{
          maxHeight: 200,
          scrollbarGutter: 'stable',
          paddingInlineEnd: 'var(--wpds-dimension-padding-xs)'
        }}>
                        <Combobox.Collection>
                            {(item: FixtureItem) => <Combobox.Item key={item.value} value={item}>
                                    <Combobox.ItemLabel>
                                        {item.label}
                                    </Combobox.ItemLabel>
                                </Combobox.Item>}
                        </Combobox.Collection>
                    </Combobox.ListBody>
                </Combobox.List>
            </div>]
  }
}`,...K.parameters?.docs?.source},description:{story:"For certain multiple select use cases, it may be better to design a custom\nselection state UI, rather than using a chip-based selection state UI like `SearchableChipSelect`.\nIn such cases, the selector UI can be detached and inlined into a modal dialog, for example.\n\nTo do this, omit the `Popup` and enable the `inline` prop on the `Root`.\n\nTo keep the items clear of a classic scrollbar, give `Combobox.ListBody` an\ninline-end padding. Also set `scrollbar-gutter: stable` on it, so that the\nitems keep their width when the scrollbar appears or disappears.",...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
      }, 2000);
    }}>
                <Combobox.Trigger aria-label="Fruit" />
                <Combobox.Popup aria-label="Fruit">
                    <div style={inputWrapperStyle}>
                        <Combobox.Input aria-label="Search" placeholder="Search" />
                    </div>
                    <Combobox.Status>
                        {loading ? <Combobox.LoadingIndicator /> : <HiddenResultCount />}
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
}`,...J.parameters?.docs?.source},description:{story:"Render `Combobox.LoadingIndicator` inside `Combobox.Status` while fetching\nitems. Pass `children` to customize its message. After loading, render a\nvisually hidden result count inside `Status` to announce it. Use `Empty`\nfor no results.",...J.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    items: ITEMS,
    defaultValue: ITEMS[0],
    children: [<Combobox.Trigger aria-label="Fruit" key="trigger">
                {(item: FixtureItem) => <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
                        <Avatar name={item.label} size="xs" aria-hidden />

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