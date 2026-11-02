import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{S as ee,_ as r,a as i,b as a,c as o,d as s,f as c,g as l,h as u,i as d,l as f,m as p,n as m,o as te,p as h,r as g,s as _,t as v,u as y,v as b,x,y as S}from"./trigger-CEf9n-Zn.js";import{a as C,i as w,o as T}from"./shared-CtChWZpH.js";var E=t({Compact:()=>M,Default:()=>j,Disabled:()=>G,Grouped:()=>F,Labeling:()=>B,Minimal:()=>N,PopupWidth:()=>$,WithCustomPlaceholder:()=>L,WithCustomTriggerAndItem:()=>Y,WithCustomZIndex:()=>Q,WithDisabledItem:()=>q,WithItemDescription:()=>Z,WithLongList:()=>W,WithNullValueOption:()=>z,WithOverflow:()=>H,WithSeparator:()=>I,default:()=>O}),D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{te(),m(),c(),y(),o(),ee(),a(),p(),l(),b(),d(),w(),D=n(),O={tags:[`manifest`],title:`Components/@wordpress-ui/Form/Primitives/Select`,id:`design-system-components-form-primitives-select`,component:i,subcomponents:{"Select.Trigger":v,"Select.Portal":s,"Select.Positioner":f,"Select.Popup":_,"Select.Group":x,"Select.GroupLabel":S,"Select.Item":h,"Select.ItemLabel":u,"Select.ItemDescription":r,"Select.Separator":g},argTypes:{onValueChange:{action:`onValueChange`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},k=Array.from({length:6},(e,t)=>({value:`item-${t+1}`,label:`Item ${t+1}`})),A=[{value:`apple`,label:`Apple`},{value:`banana`,label:`Banana`},{value:`other`,label:`Other`}],j={args:{items:k,children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:k.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)]}},M={args:{...j.args,children:[(0,D.jsx)(v,{size:`compact`,"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:k.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)]}},N={args:{children:[(0,D.jsx)(v,{size:`small`,variant:`minimal`,"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{width:`content`,children:Array.from({length:6},(e,t)=>(0,D.jsx)(h,{value:`${t+1}`,size:`small`,children:(0,D.jsx)(u,{children:`${t+1}`})},t))},`popup`)],defaultValue:`1`}},P=[{label:`Common`,items:[{value:`apple`,label:`Apple`},{value:`banana`,label:`Banana`},{value:`orange`,label:`Orange`}]},{label:`Berries`,items:[{value:`strawberry`,label:`Strawberry`},{value:`blueberry`,label:`Blueberry`},{value:`raspberry`,label:`Raspberry`}]},{label:`Tropical`,items:[{value:`mango`,label:`Mango`},{value:`pineapple`,label:`Pineapple`},{value:`papaya`,label:`Papaya`}]}],F={args:{items:P.flatMap(e=>e.items),children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:P.map(e=>(0,D.jsxs)(x,{children:[(0,D.jsx)(S,{children:e.label}),e.items.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))]},e.label))},`popup`)]}},I={args:{items:A,children:[(0,D.jsx)(v,{"aria-label":`Fruit`},`trigger`),(0,D.jsxs)(_,{children:[A.slice(0,2).map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value)),(0,D.jsx)(g,{}),(0,D.jsx)(h,{value:A[2],children:(0,D.jsx)(u,{children:`Other`})})]},`popup`)]}},L={args:{items:k,children:[(0,D.jsx)(v,{placeholder:`Choose an item`,"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:k.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)]}},R=[{value:null,label:`Select theme`},{value:`system`,label:`System default`},{value:`light`,label:`Light`},{value:`dark`,label:`Dark`}],z={args:{items:R,children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:R.map(e=>(0,D.jsx)(h,{value:e.value,children:(0,D.jsx)(u,{children:e.label})},e.value??`null`))},`popup`)]}},B={args:{...j.args,children:[(0,D.jsx)(v,{"aria-label":`User role`},`trigger`),(0,D.jsx)(_,{children:k.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)]}},V=[{value:`long-item`,label:`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`},{value:`item-2`,label:`Item 2`}],H={args:{items:V,children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:V.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)],defaultValue:V[0]}},U=Array.from({length:30},(e,t)=>({value:`item-${t+1}`,label:`Item ${t+1}`})),W={args:{items:U,defaultValue:U[17],children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:U.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)]}},G={args:{...j.args,children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:k.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)],defaultValue:k[0],disabled:!0}},K=[{value:`item-1`,label:`Item 1`},{value:`item-2`,label:`Item 2`,disabled:!0}],q={args:{items:K,children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:K.map(e=>(0,D.jsx)(h,{value:e,disabled:e.disabled,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)],defaultValue:K[0]}},J=[{value:`user-1`,label:`User 1 (Admin)`},{value:`user-2`,label:`User 2 (Editor)`}],Y={args:{items:J,children:[(0,D.jsx)(v,{"aria-label":`Item`,children:e=>(0,D.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,D.jsx)(`img`,{src:`https://gravatar.com/avatar/?d=initials&name=${e.value}`,alt:``,width:`20`,style:{borderRadius:`50%`}}),e.label]})},`trigger`),(0,D.jsx)(_,{children:J.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)],defaultValue:J[0]}},X=[{value:`apple`,label:`Apple`,description:`99 in stock. Ships in two to three business days.`},{value:`banana`,label:`Banana`,description:`12 in stock. Restock expected next week.`}],Z={args:{items:X,children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{children:X.map(e=>(0,D.jsxs)(h,{value:e,children:[(0,D.jsx)(u,{children:e.label}),(0,D.jsx)(r,{children:e.description})]},e.value))},`popup`)]}},Q={name:`With Custom z-index`,args:{...j.args,children:[(0,D.jsx)(v,{"aria-label":`Item`},`trigger`),(0,D.jsx)(_,{portal:(0,D.jsx)(s,{style:{"--wp-ui-select-z-index":`9999`}}),children:k.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))},`popup`)]}},$={decorators:[T],args:{items:C},render:e=>(0,D.jsxs)(i,{...e,children:[(0,D.jsx)(v,{"aria-label":`Label`}),(0,D.jsx)(_,{width:`sm`,children:C.map(e=>(0,D.jsx)(h,{value:e,children:(0,D.jsx)(u,{children:e.label})},e.value))})]})};try{N.__docgenInfo={description:"The `minimal` variant must be used judiciously, because in many\ncontexts it can be unclear to users that it is a select trigger.\n\nCombined with the `small` size, `minimal` can be used to create a\nvery low-profile `Select`, intended for rare use cases like\na pagination control.",displayName:`Minimal`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{F.__docgenInfo={description:"Options can be organized into labeled groups with `Select.Group`\nand `Select.GroupLabel`.",displayName:`Grouped`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{I.__docgenInfo={description:"Use `Select.Separator` to set choices apart from each other.",displayName:`WithSeparator`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{L.__docgenInfo={description:'Use the `placeholder` prop on `Select.Trigger` to show text when no\nvalue is selected. The default placeholder is `"Select"`.',displayName:`WithCustomPlaceholder`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:"Use a `null` item when users should be able to clear the selected value from\nthe popup. When `items` includes a `null` item, its label is used as the\nplaceholder text.",displayName:`WithNullValueOption`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{B.__docgenInfo={description:"When accessibly labeling a `Select`, note that the label must be associated with the `Select.Trigger`,\nnot the `Select.Root`.\n\nWhether labeling with `aria-label`, `htmlFor`, or `aria-labelledby`, the association must be made to the `Select.Trigger`.",displayName:`Labeling`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:"For custom needs, a `Select.Trigger` can take a custom render function as its\nchildren. Put custom item content inside `Select.ItemLabel`.",displayName:`WithCustomTriggerAndItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Use `Select.ItemDescription` for supplementary text that should be\nannounced as a description rather than part of the item name.",displayName:`WithItemDescription`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a select popup renders below another popover when\nyou want it above.\n\nThe `--wp-ui-select-z-index` CSS variable controls the z-index of the\n`Select` positioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  `Select` popover in the page), or\n- **Per instance**, by passing a `Select.Portal` with a `style` (or\n  `className`) to `Select.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:"Use `width` on `Select.Popup` to constrain the popup relative to a narrow anchor.",displayName:`PopupWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/select/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    items: defaultItems,
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {defaultItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [<Select.Trigger size="compact" aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {defaultItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Select.Trigger size="small" variant="minimal" aria-label="Item" key="trigger" />, <Select.Popup width="content" key="popup">
                {Array.from({
        length: 6
      }, (_, index) => <Select.Item key={index} value={\`\${index + 1}\`} size="small">
                        <Select.ItemLabel>{\`\${index + 1}\`}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>],
    defaultValue: '1'
  }
}`,...N.parameters?.docs?.source},description:{story:"The `minimal` variant must be used judiciously, because in many\ncontexts it can be unclear to users that it is a select trigger.\n\nCombined with the `small` size, `minimal` can be used to create a\nvery low-profile `Select`, intended for rare use cases like\na pagination control.",...N.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    items: groupedItems.flatMap(group => group.items),
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {groupedItems.map(group => <Select.Group key={group.label}>
                        <Select.GroupLabel>{group.label}</Select.GroupLabel>
                        {group.items.map(item => <Select.Item key={item.value} value={item}>
                                <Select.ItemLabel>
                                    {item.label}
                                </Select.ItemLabel>
                            </Select.Item>)}
                    </Select.Group>)}
            </Select.Popup>]
  }
}`,...F.parameters?.docs?.source},description:{story:"Options can be organized into labeled groups with `Select.Group`\nand `Select.GroupLabel`.",...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    items: separatorItems,
    children: [<Select.Trigger aria-label="Fruit" key="trigger" />, <Select.Popup key="popup">
                {separatorItems.slice(0, 2).map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
                <Select.Separator />
                <Select.Item value={separatorItems[2]}>
                    <Select.ItemLabel>Other</Select.ItemLabel>
                </Select.Item>
            </Select.Popup>]
  }
}`,...I.parameters?.docs?.source},description:{story:"Use `Select.Separator` to set choices apart from each other.",...I.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    items: defaultItems,
    children: [<Select.Trigger placeholder="Choose an item" aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {defaultItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...L.parameters?.docs?.source},description:{story:'Use the `placeholder` prop on `Select.Trigger` to show text when no\nvalue is selected. The default placeholder is `"Select"`.',...L.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    items: nullValueOptionItems,
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {nullValueOptionItems.map(item => <Select.Item key={item.value ?? 'null'} value={item.value}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...z.parameters?.docs?.source},description:{story:"Use a `null` item when users should be able to clear the selected value from\nthe popup. When `items` includes a `null` item, its label is used as the\nplaceholder text.",...z.parameters?.docs?.description}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [<Select.Trigger aria-label="User role" key="trigger" />, <Select.Popup key="popup">
                {defaultItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...B.parameters?.docs?.source},description:{story:"When accessibly labeling a `Select`, note that the label must be associated with the `Select.Trigger`,\nnot the `Select.Root`.\n\nWhether labeling with `aria-label`, `htmlFor`, or `aria-labelledby`, the association must be made to the `Select.Trigger`.",...B.parameters?.docs?.description}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    items: overflowItems,
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {overflowItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>],
    defaultValue: overflowItems[0]
  }
}`,...H.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    items: longListItems,
    defaultValue: longListItems[17],
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {longListItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {defaultItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>],
    defaultValue: defaultItems[0],
    disabled: true
  }
}`,...G.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    items: disabledItemItems,
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {disabledItemItems.map(item => <Select.Item key={item.value} value={item} disabled={item.disabled}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>],
    defaultValue: disabledItemItems[0]
  }
}`,...q.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    items: customOptions,
    children: [<Select.Trigger aria-label="Item" key="trigger">
                {item => <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
                        <img src={\`https://gravatar.com/avatar/?d=initials&name=\${item.value}\`} alt="" width="20" style={{
          borderRadius: '50%'
        }} />

                        {item.label}
                    </span>}
            </Select.Trigger>, <Select.Popup key="popup">
                {customOptions.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>],
    defaultValue: customOptions[0]
  }
}`,...Y.parameters?.docs?.source},description:{story:"For custom needs, a `Select.Trigger` can take a custom render function as its\nchildren. Put custom item content inside `Select.ItemLabel`.",...Y.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: {
    items: stockItems,
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup key="popup">
                {stockItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                        <Select.ItemDescription>
                            {item.description}
                        </Select.ItemDescription>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...Z.parameters?.docs?.source},description:{story:"Use `Select.ItemDescription` for supplementary text that should be\nannounced as a description rather than part of the item name.",...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    ...Default.args,
    children: [<Select.Trigger aria-label="Item" key="trigger" />, <Select.Popup portal={<Select.Portal style={{
      '--wp-ui-select-z-index': '9999'
    }} />} key="popup">
                {defaultItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>]
  }
}`,...Q.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a select popup renders below another popover when\nyou want it above.\n\nThe `--wp-ui-select-z-index` CSS variable controls the z-index of the\n`Select` positioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  `Select` popover in the page), or\n- **Per instance**, by passing a `Select.Portal` with a `style` (or\n  `className`) to `Select.Popup`'s `portal` prop. The variable cascades\n  from the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  decorators: [narrowContainerDecorator],
  args: {
    items: longLabelPopupItems
  },
  render: args => <Select.Root {...args}>
            <Select.Trigger aria-label="Label" />
            <Select.Popup width="sm">
                {longLabelPopupItems.map(item => <Select.Item key={item.value} value={item}>
                        <Select.ItemLabel>{item.label}</Select.ItemLabel>
                    </Select.Item>)}
            </Select.Popup>
        </Select.Root>
}`,...$.parameters?.docs?.source},description:{story:"Use `width` on `Select.Popup` to constrain the popup relative to a narrow anchor.",...$.parameters?.docs?.description}}}})))()}export{E as n,init_index_story as r,N as t};