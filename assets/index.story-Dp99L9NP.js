import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./text-C_0Rw7Zg.js";import{n as s,t as c}from"./stack-CzK5c0hq.js";import{n as l,t as u}from"./select-control-DKNfkUy1.js";import{a as d,i as f,n as p,o as m,t as h}from"./shared-OZzGz5W1.js";var g=t({Default:()=>x,Grouped:()=>P,PopupWidth:()=>z,VisuallyHiddenLabel:()=>k,WithCustomItems:()=>I,WithCustomPlaceholder:()=>C,WithCustomTrigger:()=>E,WithDetails:()=>A,WithDisabledOption:()=>M,WithEmptyStringValue:()=>w,WithItemDescription:()=>R,WithItemsArrayAndPartialCustomization:()=>L,WithNullValueOption:()=>O,WithSeparator:()=>F,default:()=>y}),_,v,y,b,x,S,C,w,T,User,E,D,O,k,A,j,M,N,P,F,I,L,R,z;function init_index_story(){return(init_index_story=e((()=>{r(),l(),s(),a(),f(),_=n(),{action:v}=__STORYBOOK_MODULE_ACTIONS__,y={tags:[`manifest`],title:`Components/@wordpress-ui/Form/SelectControl`,id:`design-system-components-form-selectcontrol`,component:u,subcomponents:{"SelectControl.Trigger":u.Trigger,"SelectControl.Group":u.Group,"SelectControl.GroupLabel":u.GroupLabel,"SelectControl.Item":u.Item,"SelectControl.ItemLabel":u.ItemLabel,"SelectControl.ItemDescription":u.ItemDescription,"SelectControl.Separator":u.Separator},argTypes:{onValueChange:{action:`onValueChange`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},b=[{value:`1`,label:`Item 1`},{value:`2`,label:`Item 2`}],x={args:{items:b,label:`Label`,description:`This is the description.`}},S=[{value:`apple`,label:`Apple`},{value:`banana`,label:`Banana`},{value:`other`,label:`Other`}],C={args:{...x.args,placeholder:`Choose an item`}},w={args:{label:`Position`,items:[{value:``,label:`Default`},{value:`sticky`,label:`Sticky`}],itemToStringValue:e=>e.value===null?``:`option:${e.value}`},argTypes:{value:{control:!1},defaultValue:{control:!1}},render:function Template(e){let[t,n]=(0,i.useState)(``);return(0,_.jsxs)(c,{direction:`column`,gap:`sm`,align:`start`,children:[(0,_.jsx)(u,{...e,value:e.items?.find(e=>e.value===t)??null,onValueChange:(t,r)=>{t&&t.value!==null&&n(t.value),e.onValueChange?.(t,r)}}),(0,_.jsxs)(o,{children:[`Stored value: `,(0,_.jsx)(`code`,{children:JSON.stringify(t)})]})]})}},T=[{value:`1`,label:`User 1 (Admin)`},{value:`2`,label:`User 2 (Editor)`},{value:`3`,label:`User 3 (Author)`}],User=({user:e})=>(0,_.jsxs)(`span`,{style:{display:`flex`,alignItems:`center`,gap:8},children:[(0,_.jsx)(`img`,{src:`https://gravatar.com/avatar/?d=initials&name=${e.value??`null`}`,alt:``,width:`20`,style:{borderRadius:`50%`}}),e.label]}),E={args:{...x.args,items:T,defaultValue:T[0],trigger:(0,_.jsx)(u.Trigger,{onFocus:v(`onFocus`),onBlur:v(`onBlur`),children:e=>(0,_.jsx)(User,{user:e})})}},D=[{value:null,label:`Select theme`},{value:`system`,label:`System default`},{value:`light`,label:`Light`},{value:`dark`,label:`Dark`}],O={args:{items:D,label:`Theme`,description:`Choose a theme preference.`,defaultValue:D[0]}},k={args:{...x.args,hideLabelFromVision:!0}},A={parameters:{docs:{description:{story:p}}},args:{...x.args,description:void 0,details:h}},j=[{value:`1`,label:`Item 1`},{value:`2`,label:`Item 2`,disabled:!0}],M={args:{items:j,label:`Label`,description:`This is the description.`,defaultValue:j[0]}},N=[{label:`Common`,items:[{value:`apple`,label:`Apple`},{value:`banana`,label:`Banana`},{value:`orange`,label:`Orange`}]},{label:`Berries`,items:[{value:`strawberry`,label:`Strawberry`},{value:`blueberry`,label:`Blueberry`},{value:`raspberry`,label:`Raspberry`}]},{label:`Tropical`,items:[{value:`mango`,label:`Mango`},{value:`pineapple`,label:`Pineapple`},{value:`papaya`,label:`Papaya`}]}],P={args:{label:`Fruit`,description:`Choose a fruit.`,items:N.flatMap(e=>e.items),children:[N.map(e=>(0,_.jsxs)(u.Group,{children:[(0,_.jsx)(u.GroupLabel,{children:e.label}),e.items.map(e=>(0,_.jsx)(u.Item,{value:e,label:e.label,children:(0,_.jsx)(u.ItemLabel,{children:e.label})},e.value))]},e.label))]}},F={args:{label:`Fruit`,items:S,children:[...S.slice(0,2).map(e=>(0,_.jsx)(u.Item,{value:e,label:e.label,children:(0,_.jsx)(u.ItemLabel,{children:e.label})},e.value)),(0,_.jsx)(u.Separator,{},`separator`),(0,_.jsx)(u.Item,{value:S[2],label:`Other`,children:(0,_.jsx)(u.ItemLabel,{children:`Other`})},`other`)]}},I={args:{items:T,label:`Label`,description:`This is the description.`,children:[T.map(e=>(0,_.jsx)(u.Item,{value:e,label:e.label,children:(0,_.jsx)(u.ItemLabel,{children:(0,_.jsx)(User,{user:e})})},e.value))],defaultValue:T[0]}},L={args:{...x.args,children:[x.args?.items?.map(e=>(0,_.jsx)(u.Item,{value:e,label:e.label,disabled:e.disabled,children:(0,_.jsxs)(u.ItemLabel,{children:[`✨ `,e.label]})},e.value??`null`))]}},R={args:{label:`Fruit`,items:[{value:`apple`,label:`Apple`,description:`99 in stock. Ships in two to three business days.`},{value:`banana`,label:`Banana`,description:`12 in stock. Restock expected next week.`}]}},z={decorators:[m],args:{label:`Label`,items:d,popupWidth:`content`}};try{C.__docgenInfo={description:`When no value is selected, the trigger shows the default placeholder text.

Use the \`placeholder\` prop to customize text shown.
Prefer a concise label without a trailing ellipsis.`,displayName:`WithCustomPlaceholder`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{w.__docgenInfo={description:`Preserve an empty string in application state by giving each choice a unique,
non-empty serialization. The callback still receives the original item.
This \`itemToStringValue\` serializer also changes the value submitted with a form.`,displayName:`WithEmptyStringValue`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{E.__docgenInfo={description:"Pass a `SelectControl.Trigger` element to `trigger` to customize the button's\nprops, including focus and blur handlers. Trigger props override the control's\n`size` and `placeholder`. Children can be a render function receiving the\nselected item. The popup keeps the standard item rendering.",displayName:`WithCustomTrigger`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{O.__docgenInfo={description:"Use a `null` item value when users should be able to clear the selected value\nfrom the popup.",displayName:`WithNullValueOption`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{P.__docgenInfo={description:"Options can be organized into labeled groups with `SelectControl.Group`\nand `SelectControl.GroupLabel`. Pass a flat `items` array for trigger label\nresolution, and use `children` to render the grouped popup content.",displayName:`Grouped`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{F.__docgenInfo={description:"Use `SelectControl.Separator` to set choices apart from each other.",displayName:`WithSeparator`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{I.__docgenInfo={description:"Customize the item list by passing an array of\n`SelectControl.Item` as children. Note that the `label` prop of a `SelectControl.Item`\nis used as the string to match against in the typeahead functionality, while the\nitem content is determined by `children`.",displayName:`WithCustomItems`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{L.__docgenInfo={description:"By default, the `items` array is used to render both the Trigger\nand the Item list. Passing a custom `trigger` or `children` in addition\nto `items` will override that particular aspect of the behavior.\nIn other words, if you pass both an `items` array and a custom `trigger`,\nthe Item list in the popover will still be rendered based on the `items` array.",displayName:`WithItemsArrayAndPartialCustomization`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{R.__docgenInfo={description:"Pass `description` on an `items` entry for supplementary text.\nIt is announced as a description rather than part of the item name.\nCompose `SelectControl.Item` children when you need multiple\ndescriptions or custom markup.",displayName:`WithItemDescription`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{z.__docgenInfo={description:"Use `popupWidth` to control how the popup width is constrained relative to\nits anchor. Defaults to `content` so static option lists can grow with their\nlabels.",displayName:`PopupWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/select-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    items: defaultItems,
    label: 'Label',
    description: 'This is the description.'
  }
}`,...x.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    placeholder: 'Choose an item'
  }
}`,...C.parameters?.docs?.source},description:{story:`When no value is selected, the trigger shows the default placeholder text.

Use the \`placeholder\` prop to customize text shown.
Prefer a concise label without a trailing ellipsis.`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source},description:{story:`Preserve an empty string in application state by giving each choice a unique,
non-empty serialization. The callback still receives the original item.
This \`itemToStringValue\` serializer also changes the value submitted with a form.`,...w.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    items: userOptions,
    defaultValue: userOptions[0],
    trigger: <SelectControl.Trigger onFocus={action('onFocus')} onBlur={action('onBlur')}>
                {item => <User user={item} />}
            </SelectControl.Trigger>
  }
}`,...E.parameters?.docs?.source},description:{story:"Pass a `SelectControl.Trigger` element to `trigger` to customize the button's\nprops, including focus and blur handlers. Trigger props override the control's\n`size` and `placeholder`. Children can be a render function receiving the\nselected item. The popup keeps the standard item rendering.",...E.parameters?.docs?.description}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    items: nullValueOptionItems,
    label: 'Theme',
    description: 'Choose a theme preference.',
    defaultValue: nullValueOptionItems[0]
  }
}`,...O.parameters?.docs?.source},description:{story:"Use a `null` item value when users should be able to clear the selected value\nfrom the popup.",...O.parameters?.docs?.description}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    hideLabelFromVision: true
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
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
}`,...A.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    items: disabledOptionItems,
    label: 'Label',
    description: 'This is the description.',
    defaultValue: disabledOptionItems[0]
  }
}`,...M.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source},description:{story:"Options can be organized into labeled groups with `SelectControl.Group`\nand `SelectControl.GroupLabel`. Pass a flat `items` array for trigger label\nresolution, and use `children` to render the grouped popup content.",...P.parameters?.docs?.description}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
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
}`,...F.parameters?.docs?.source},description:{story:"Use `SelectControl.Separator` to set choices apart from each other.",...F.parameters?.docs?.description}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source},description:{story:"Customize the item list by passing an array of\n`SelectControl.Item` as children. Note that the `label` prop of a `SelectControl.Item`\nis used as the string to match against in the typeahead functionality, while the\nitem content is determined by `children`.",...I.parameters?.docs?.description}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: [Default.args?.items?.map(item => <SelectControl.Item key={item.value ?? 'null'} value={item} label={item.label} disabled={item.disabled}>
                    <SelectControl.ItemLabel>
                        ✨ {item.label}
                    </SelectControl.ItemLabel>
                </SelectControl.Item>)]
  }
}`,...L.parameters?.docs?.source},description:{story:"By default, the `items` array is used to render both the Trigger\nand the Item list. Passing a custom `trigger` or `children` in addition\nto `items` will override that particular aspect of the behavior.\nIn other words, if you pass both an `items` array and a custom `trigger`,\nthe Item list in the popover will still be rendered based on the `items` array.",...L.parameters?.docs?.description}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source},description:{story:"Pass `description` on an `items` entry for supplementary text.\nIt is announced as a description rather than part of the item name.\nCompose `SelectControl.Item` children when you need multiple\ndescriptions or custom markup.",...R.parameters?.docs?.description}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  decorators: [narrowContainerDecorator],
  args: {
    label: 'Label',
    items: longLabelPopupItems,
    popupWidth: 'content'
  }
}`,...z.parameters?.docs?.source},description:{story:"Use `popupWidth` to control how the popup width is constrained relative to\nits anchor. Defaults to `content` so static option lists can grow with their\nlabels.",...z.parameters?.docs?.description}}}})))()}export{g as a,O as i,E as n,init_index_story as o,w as r,C as t};