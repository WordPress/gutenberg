import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./avatar-DkjtsTBF.js";import{n as s,t as c}from"./text-ia3Avk5-.js";import{n as l,t as u}from"./stack-CA2zwZtU.js";import{n as d,t as f}from"./select-control-BZms1cmm.js";import{a as p,i as m,n as h,o as g,t as _}from"./shared-CF9BtuxX.js";var v=t({Default:()=>C,Grouped:()=>I,PopupWidth:()=>V,VisuallyHiddenLabel:()=>j,WithCustomItems:()=>R,WithCustomPlaceholder:()=>T,WithCustomTrigger:()=>O,WithDetails:()=>M,WithDisabledOption:()=>P,WithEmptyStringValue:()=>E,WithItemDescription:()=>B,WithItemsArrayAndPartialCustomization:()=>z,WithNullValueOption:()=>A,WithSeparator:()=>L,default:()=>x}),y,b,x,S,C,w,T,E,D,User,O,k,A,j,M,N,P,F,I,L,R,z,B,V;function init_index_story(){return(init_index_story=e((()=>{r(),d(),a(),l(),s(),m(),y=n(),{action:b}=__STORYBOOK_MODULE_ACTIONS__,x={tags:[`manifest`],title:`Components/@wordpress-ui/Form/SelectControl`,id:`design-system-components-form-selectcontrol`,component:f,subcomponents:{"SelectControl.Trigger":f.Trigger,"SelectControl.Group":f.Group,"SelectControl.GroupLabel":f.GroupLabel,"SelectControl.Item":f.Item,"SelectControl.ItemLabel":f.ItemLabel,"SelectControl.ItemDescription":f.ItemDescription,"SelectControl.Separator":f.Separator},argTypes:{onValueChange:{action:`onValueChange`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},S=[{value:`1`,label:`Item 1`},{value:`2`,label:`Item 2`}],C={args:{items:S,label:`Label`,description:`This is the description.`}},w=[{value:`apple`,label:`Apple`},{value:`banana`,label:`Banana`},{value:`other`,label:`Other`}],T={args:{...C.args,placeholder:`Choose an item`}},E={args:{label:`Position`,items:[{value:``,label:`Default`},{value:`sticky`,label:`Sticky`}],itemToStringValue:e=>e.value===null?``:`option:${e.value}`},argTypes:{value:{control:!1},defaultValue:{control:!1}},render:function Template(e){let[t,n]=(0,i.useState)(``);return(0,y.jsxs)(u,{direction:`column`,gap:`sm`,align:`start`,children:[(0,y.jsx)(f,{...e,value:e.items?.find(e=>e.value===t)??null,onValueChange:(t,r)=>{t&&t.value!==null&&n(t.value),e.onValueChange?.(t,r)}}),(0,y.jsxs)(c,{children:[`Stored value: `,(0,y.jsx)(`code`,{children:JSON.stringify(t)})]})]})}},D=[{value:`1`,label:`User 1 (Admin)`},{value:`2`,label:`User 2 (Editor)`},{value:`3`,label:`User 3 (Author)`}],User=({user:e})=>(0,y.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,y.jsx)(o,{name:e.value??`null`,size:`xs`,"aria-hidden":!0}),e.label]}),O={args:{...C.args,items:D,defaultValue:D[0],trigger:(0,y.jsx)(f.Trigger,{onFocus:b(`onFocus`),onBlur:b(`onBlur`),children:e=>(0,y.jsx)(User,{user:e})})}},k=[{value:null,label:`Select theme`},{value:`system`,label:`System default`},{value:`light`,label:`Light`},{value:`dark`,label:`Dark`}],A={args:{items:k,label:`Theme`,description:`Choose a theme preference.`,defaultValue:k[0]}},j={args:{...C.args,hideLabelFromVision:!0}},M={parameters:{docs:{description:{story:h}}},args:{...C.args,description:void 0,details:_}},N=[{value:`1`,label:`Item 1`},{value:`2`,label:`Item 2`,disabled:!0}],P={args:{items:N,label:`Label`,description:`This is the description.`,defaultValue:N[0]}},F=[{label:`Common`,items:[{value:`apple`,label:`Apple`},{value:`banana`,label:`Banana`},{value:`orange`,label:`Orange`}]},{label:`Berries`,items:[{value:`strawberry`,label:`Strawberry`},{value:`blueberry`,label:`Blueberry`},{value:`raspberry`,label:`Raspberry`}]},{label:`Tropical`,items:[{value:`mango`,label:`Mango`},{value:`pineapple`,label:`Pineapple`},{value:`papaya`,label:`Papaya`}]}],I={args:{label:`Fruit`,description:`Choose a fruit.`,items:F.flatMap(e=>e.items),children:[F.map(e=>(0,y.jsxs)(f.Group,{children:[(0,y.jsx)(f.GroupLabel,{children:e.label}),e.items.map(e=>(0,y.jsx)(f.Item,{value:e,label:e.label,children:(0,y.jsx)(f.ItemLabel,{children:e.label})},e.value))]},e.label))]}},L={args:{label:`Fruit`,items:w,children:[...w.slice(0,2).map(e=>(0,y.jsx)(f.Item,{value:e,label:e.label,children:(0,y.jsx)(f.ItemLabel,{children:e.label})},e.value)),(0,y.jsx)(f.Separator,{},`separator`),(0,y.jsx)(f.Item,{value:w[2],label:`Other`,children:(0,y.jsx)(f.ItemLabel,{children:`Other`})},`other`)]}},R={args:{items:D,label:`Label`,description:`This is the description.`,children:[D.map(e=>(0,y.jsx)(f.Item,{value:e,label:e.label,children:(0,y.jsx)(f.ItemLabel,{children:(0,y.jsx)(User,{user:e})})},e.value))],defaultValue:D[0]}},z={args:{...C.args,children:[C.args?.items?.map(e=>(0,y.jsx)(f.Item,{value:e,label:e.label,disabled:e.disabled,children:(0,y.jsxs)(f.ItemLabel,{children:[`✨ `,e.label]})},e.value??`null`))]}},B={args:{label:`Fruit`,items:[{value:`apple`,label:`Apple`,description:`99 in stock. Ships in two to three business days.`},{value:`banana`,label:`Banana`,description:`12 in stock. Restock expected next week.`}]}},V={decorators:[g],args:{label:`Label`,items:p,popupWidth:`content`}};try{T.__docgenInfo={description:`When no value is selected, the trigger shows the default placeholder text.

Use the \`placeholder\` prop to customize text shown.
Prefer a concise label without a trailing ellipsis.`,displayName:`WithCustomPlaceholder`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{E.__docgenInfo={description:`Preserve an empty string in application state by giving each choice a unique,
non-empty serialization. The callback still receives the original item.
This \`itemToStringValue\` serializer also changes the value submitted with a form.`,displayName:`WithEmptyStringValue`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{O.__docgenInfo={description:"Pass a `SelectControl.Trigger` element to `trigger` to customize the button's\nprops, including focus and blur handlers. Trigger props override the control's\n`size` and `placeholder`. Children can be a render function receiving the\nselected item. The popup keeps the standard item rendering.",displayName:`WithCustomTrigger`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{A.__docgenInfo={description:"Use a `null` item value when users should be able to clear the selected value\nfrom the popup.",displayName:`WithNullValueOption`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{I.__docgenInfo={description:"Options can be organized into labeled groups with `SelectControl.Group`\nand `SelectControl.GroupLabel`. Pass a flat `items` array for trigger label\nresolution, and use `children` to render the grouped popup content.",displayName:`Grouped`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{L.__docgenInfo={description:"Use `SelectControl.Separator` to set choices apart from each other.",displayName:`WithSeparator`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{R.__docgenInfo={description:"Customize the item list by passing an array of\n`SelectControl.Item` as children. Note that the `label` prop of a `SelectControl.Item`\nis used as the string to match against in the typeahead functionality, while the\nitem content is determined by `children`.",displayName:`WithCustomItems`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:"By default, the `items` array is used to render both the Trigger\nand the Item list. Passing a custom `trigger` or `children` in addition\nto `items` will override that particular aspect of the behavior.\nIn other words, if you pass both an `items` array and a custom `trigger`,\nthe Item list in the popover will still be rendered based on the `items` array.",displayName:`WithItemsArrayAndPartialCustomization`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{B.__docgenInfo={description:"Pass `description` on an `items` entry for supplementary text.\nIt is announced as a description rather than part of the item name.\nCompose `SelectControl.Item` children when you need multiple\ndescriptions or custom markup.",displayName:`WithItemDescription`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{V.__docgenInfo={description:"Use `popupWidth` to control how the popup width is constrained relative to\nits anchor. Defaults to `content` so static option lists can grow with their\nlabels.",displayName:`PopupWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    items: defaultItems,
    label: 'Label',
    description: 'This is the description.'
  }
}`,...C.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    placeholder: 'Choose an item'
  }
}`,...T.parameters?.docs?.source},description:{story:`When no value is selected, the trigger shows the default placeholder text.

Use the \`placeholder\` prop to customize text shown.
Prefer a concise label without a trailing ellipsis.`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Position',
    items: [{
      value: '',
      label: 'Default'
    }, {
      value: 'sticky',
      label: 'Sticky'
    }],
    itemToStringValue: item => item.value === null ? '' : \`option:\${item.value}\`
  },
  argTypes: {
    value: {
      control: false
    },
    defaultValue: {
      control: false
    }
  },
  render: function Template(args) {
    const [position, setPosition] = useState('');
    return <Stack direction="column" gap="sm" align="start">
                <SelectControl {...args} value={args.items?.find(item => item.value === position) ?? null} onValueChange={(item, eventDetails) => {
        if (item && item.value !== null) {
          setPosition(item.value);
        }
        args.onValueChange?.(item, eventDetails);
      }} />
                <Text>
                    Stored value: <code>{JSON.stringify(position)}</code>
                </Text>
            </Stack>;
  }
}`,...E.parameters?.docs?.source},description:{story:`Preserve an empty string in application state by giving each choice a unique,
non-empty serialization. The callback still receives the original item.
This \`itemToStringValue\` serializer also changes the value submitted with a form.`,...E.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    items: userOptions,
    defaultValue: userOptions[0],
    trigger: <SelectControl.Trigger onFocus={action('onFocus')} onBlur={action('onBlur')}>
                {item => <User user={item} />}
            </SelectControl.Trigger>
  }
}`,...O.parameters?.docs?.source},description:{story:"Pass a `SelectControl.Trigger` element to `trigger` to customize the button's\nprops, including focus and blur handlers. Trigger props override the control's\n`size` and `placeholder`. Children can be a render function receiving the\nselected item. The popup keeps the standard item rendering.",...O.parameters?.docs?.description}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    items: nullValueOptionItems,
    label: 'Theme',
    description: 'Choose a theme preference.',
    defaultValue: nullValueOptionItems[0]
  }
}`,...A.parameters?.docs?.source},description:{story:"Use a `null` item value when users should be able to clear the selected value\nfrom the popup.",...A.parameters?.docs?.description}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    hideLabelFromVision: true
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: WITH_DETAILS_DESCRIPTION
      }
    }
  },
  args: {
    ...Default.args,
    description: undefined,
    details: DETAILS_EXAMPLE
  }
}`,...M.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    items: disabledOptionItems,
    label: 'Label',
    description: 'This is the description.',
    defaultValue: disabledOptionItems[0]
  }
}`,...P.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Fruit',
    description: 'Choose a fruit.',
    items: groupedItems.flatMap(group => group.items),
    children: [groupedItems.map(group => <SelectControl.Group key={group.label}>
                    <SelectControl.GroupLabel>
                        {group.label}
                    </SelectControl.GroupLabel>
                    {group.items.map(item => <SelectControl.Item key={item.value} value={item} label={item.label}>
                            <SelectControl.ItemLabel>
                                {item.label}
                            </SelectControl.ItemLabel>
                        </SelectControl.Item>)}
                </SelectControl.Group>)]
  }
}`,...I.parameters?.docs?.source},description:{story:"Options can be organized into labeled groups with `SelectControl.Group`\nand `SelectControl.GroupLabel`. Pass a flat `items` array for trigger label\nresolution, and use `children` to render the grouped popup content.",...I.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Fruit',
    items: separatorItems,
    children: [...separatorItems.slice(0, 2).map(item => <SelectControl.Item key={item.value} value={item} label={item.label}>
                    <SelectControl.ItemLabel>
                        {item.label}
                    </SelectControl.ItemLabel>
                </SelectControl.Item>), <SelectControl.Separator key="separator" />, <SelectControl.Item key="other" value={separatorItems[2]} label="Other">
                <SelectControl.ItemLabel>Other</SelectControl.ItemLabel>
            </SelectControl.Item>]
  }
}`,...L.parameters?.docs?.source},description:{story:"Use `SelectControl.Separator` to set choices apart from each other.",...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    items: userOptions,
    label: 'Label',
    description: 'This is the description.',
    children: [userOptions.map(item => <SelectControl.Item key={item.value} value={item} label={item.label}>
                    <SelectControl.ItemLabel>
                        <User user={item} />
                    </SelectControl.ItemLabel>
                </SelectControl.Item>)],
    defaultValue: userOptions[0]
  }
}`,...R.parameters?.docs?.source},description:{story:"Customize the item list by passing an array of\n`SelectControl.Item` as children. Note that the `label` prop of a `SelectControl.Item`\nis used as the string to match against in the typeahead functionality, while the\nitem content is determined by `children`.",...R.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [Default.args?.items?.map(item => <SelectControl.Item key={item.value ?? 'null'} value={item} label={item.label} disabled={item.disabled}>
                    <SelectControl.ItemLabel>
                        ✨ {item.label}
                    </SelectControl.ItemLabel>
                </SelectControl.Item>)]
  }
}`,...z.parameters?.docs?.source},description:{story:"By default, the `items` array is used to render both the Trigger\nand the Item list. Passing a custom `trigger` or `children` in addition\nto `items` will override that particular aspect of the behavior.\nIn other words, if you pass both an `items` array and a custom `trigger`,\nthe Item list in the popover will still be rendered based on the `items` array.",...z.parameters?.docs?.description}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Fruit',
    items: [{
      value: 'apple',
      label: 'Apple',
      description: '99 in stock. Ships in two to three business days.'
    }, {
      value: 'banana',
      label: 'Banana',
      description: '12 in stock. Restock expected next week.'
    }]
  }
}`,...B.parameters?.docs?.source},description:{story:"Pass `description` on an `items` entry for supplementary text.\nIt is announced as a description rather than part of the item name.\nCompose `SelectControl.Item` children when you need multiple\ndescriptions or custom markup.",...B.parameters?.docs?.description}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  decorators: [narrowContainerDecorator],
  args: {
    label: 'Label',
    items: longLabelPopupItems,
    popupWidth: 'content'
  }
}`,...V.parameters?.docs?.source},description:{story:"Use `popupWidth` to control how the popup width is constrained relative to\nits anchor. Defaults to `content` so static option lists can grow with their\nlabels.",...V.parameters?.docs?.description}}}})))()}export{v as a,A as i,O as n,init_index_story as o,E as r,T as t};