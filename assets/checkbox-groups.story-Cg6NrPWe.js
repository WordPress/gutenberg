import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./checkbox-group-C2Yz8pI3.js";import{a as s,i as c,n as l,o as u,r as d,t as f}from"./description-DejWxhpl.js";import{n as p,t as m}from"./checkbox-control-BtOLpMMg.js";var h=t({GroupingCheckboxes:()=>v,MultipleGroups:()=>b,Nesting:()=>y,default:()=>_}),g,_,v,y,b;function init_checkbox_groups_story(){return(init_checkbox_groups_story=e((()=>{r(),p(),a(),u(),c(),l(),g=n(),_={title:`Components/@wordpress-ui/Form/Checkbox Groups`,id:`design-system-components-form-checkbox-groups`,tags:[`!autodocs`,`!dev`],parameters:{controls:{disable:!0}}},v={render:function Template(){return(0,g.jsxs)(s,{render:(0,g.jsx)(o,{defaultValue:[`1`]}),children:[(0,g.jsx)(d,{children:`Notifications`}),(0,g.jsx)(f,{children:`Choose which updates you want to receive.`}),(0,g.jsx)(m,{value:`1`,label:`Comments`,description:`Notify me when someone comments.`}),(0,g.jsx)(m,{value:`2`,label:`Mentions`,description:`Notify me when someone mentions me.`}),(0,g.jsx)(m,{value:`3`,label:`Follows`,description:`Notify me when someone follows me.`})]})}},y={render:function Template(){let[e,t]=(0,i.useState)([`apple`]);return(0,g.jsxs)(s,{render:(0,g.jsx)(o,{value:e,onValueChange:t,allValues:[`apple`,`orange`,`banana`]}),children:[(0,g.jsx)(d,{children:`Fruit`}),(0,g.jsx)(f,{children:`Select the fruit you want.`}),(0,g.jsx)(m,{parent:!0,value:`fruit`,label:`All fruit`}),(0,g.jsxs)(o.NestedItems,{children:[(0,g.jsx)(m,{value:`apple`,label:`Apple`}),(0,g.jsx)(m,{value:`orange`,label:`Orange`}),(0,g.jsx)(m,{value:`banana`,label:`Banana`})]})]})}},b={render:function Template(){let[e,t]=(0,i.useState)([`apple`]),[n,r]=(0,i.useState)([]);return(0,g.jsxs)(s,{children:[(0,g.jsx)(d,{children:`Produce`}),(0,g.jsx)(f,{children:`Select the fruit and vegetables you want.`}),(0,g.jsxs)(o,{value:e,onValueChange:t,allValues:[`apple`,`orange`,`banana`],"aria-label":`Fruit`,children:[(0,g.jsx)(m,{parent:!0,value:`fruit`,label:`All fruit`}),(0,g.jsxs)(o.NestedItems,{children:[(0,g.jsx)(m,{value:`apple`,label:`Apple`}),(0,g.jsx)(m,{value:`orange`,label:`Orange`}),(0,g.jsx)(m,{value:`banana`,label:`Banana`})]})]}),(0,g.jsxs)(o,{value:n,onValueChange:r,allValues:[`carrot`,`lettuce`,`pepper`],"aria-label":`Vegetables`,children:[(0,g.jsx)(m,{parent:!0,value:`vegetable`,label:`All vegetables`}),(0,g.jsxs)(o.NestedItems,{children:[(0,g.jsx)(m,{value:`carrot`,label:`Carrot`}),(0,g.jsx)(m,{value:`lettuce`,label:`Lettuce`}),(0,g.jsx)(m,{value:`pepper`,label:`Pepper`})]})]})]})}};try{v.__docgenInfo={description:"Compose checkbox groups from `CheckboxGroup` and `CheckboxControl`.\n\nThis example composes `Fieldset.Root` and `CheckboxGroup` on one element.\nThe fieldset legend gives the group its accessible name.\n\nControl checked state through `value` or `defaultValue` and `onValueChange`.",displayName:`GroupingCheckboxes`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/stories/checkbox-groups.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{y.__docgenInfo={description:"To control a group from a parent checkbox:\n\n1. Use `CheckboxGroup` in controlled mode.\n2. Pass the child checkbox values to `allValues`.\n3. Mark the parent checkbox with the `parent` prop.\n\nPass `CheckboxGroup` to `Fieldset.Root`'s `render` prop so `Fieldset.Legend`\ngives the group its accessible name.\n\n`CheckboxGroup.NestedItems` adds standard indentation to nested items.\n\nLimit nesting to one level to keep groups accessible to screen reader users.",displayName:`Nesting`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/stories/checkbox-groups.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{b.__docgenInfo={description:"For multiple groups in one `Fieldset`, render each `CheckboxGroup` inside the\nfieldset and give it its own accessible name with `aria-label` or\n`aria-labelledby`.\n\nEach group manages its own selection and parent checkbox.",displayName:`MultipleGroups`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/stories/checkbox-groups.story.tsx`,methods:[],props:{},tags:{}}}catch{}v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: function Template() {
    return <Fieldset.Root render={<CheckboxGroup defaultValue={['1']} />}>
                <Fieldset.Legend>Notifications</Fieldset.Legend>
                <Fieldset.Description>
                    Choose which updates you want to receive.
                </Fieldset.Description>
                <CheckboxControl value="1" label="Comments" description="Notify me when someone comments." />
                <CheckboxControl value="2" label="Mentions" description="Notify me when someone mentions me." />
                <CheckboxControl value="3" label="Follows" description="Notify me when someone follows me." />
            </Fieldset.Root>;
  }
}`,...v.parameters?.docs?.source},description:{story:"Compose checkbox groups from `CheckboxGroup` and `CheckboxControl`.\n\nThis example composes `Fieldset.Root` and `CheckboxGroup` on one element.\nThe fieldset legend gives the group its accessible name.\n\nControl checked state through `value` or `defaultValue` and `onValueChange`.",...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: function Template() {
    const [value, setValue] = useState(['apple']);
    return <Fieldset.Root render={<CheckboxGroup value={value} onValueChange={setValue} allValues={['apple', 'orange', 'banana']} />}>
                <Fieldset.Legend>Fruit</Fieldset.Legend>
                <Fieldset.Description>
                    Select the fruit you want.
                </Fieldset.Description>
                <CheckboxControl parent value="fruit" label="All fruit" />
                <CheckboxGroup.NestedItems>
                    <CheckboxControl value="apple" label="Apple" />
                    <CheckboxControl value="orange" label="Orange" />
                    <CheckboxControl value="banana" label="Banana" />
                </CheckboxGroup.NestedItems>
            </Fieldset.Root>;
  }
}`,...y.parameters?.docs?.source},description:{story:"To control a group from a parent checkbox:\n\n1. Use `CheckboxGroup` in controlled mode.\n2. Pass the child checkbox values to `allValues`.\n3. Mark the parent checkbox with the `parent` prop.\n\nPass `CheckboxGroup` to `Fieldset.Root`'s `render` prop so `Fieldset.Legend`\ngives the group its accessible name.\n\n`CheckboxGroup.NestedItems` adds standard indentation to nested items.\n\nLimit nesting to one level to keep groups accessible to screen reader users.",...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: function Template() {
    const [fruitValue, setFruitValue] = useState(['apple']);
    const [vegetableValue, setVegetableValue] = useState<string[]>([]);
    return <Fieldset.Root>
                <Fieldset.Legend>Produce</Fieldset.Legend>
                <Fieldset.Description>
                    Select the fruit and vegetables you want.
                </Fieldset.Description>
                <CheckboxGroup value={fruitValue} onValueChange={setFruitValue} allValues={['apple', 'orange', 'banana']} aria-label="Fruit">
                    <CheckboxControl parent value="fruit" label="All fruit" />
                    <CheckboxGroup.NestedItems>
                        <CheckboxControl value="apple" label="Apple" />
                        <CheckboxControl value="orange" label="Orange" />
                        <CheckboxControl value="banana" label="Banana" />
                    </CheckboxGroup.NestedItems>
                </CheckboxGroup>
                <CheckboxGroup value={vegetableValue} onValueChange={setVegetableValue} allValues={['carrot', 'lettuce', 'pepper']} aria-label="Vegetables">
                    <CheckboxControl parent value="vegetable" label="All vegetables" />
                    <CheckboxGroup.NestedItems>
                        <CheckboxControl value="carrot" label="Carrot" />
                        <CheckboxControl value="lettuce" label="Lettuce" />
                        <CheckboxControl value="pepper" label="Pepper" />
                    </CheckboxGroup.NestedItems>
                </CheckboxGroup>
            </Fieldset.Root>;
  }
}`,...b.parameters?.docs?.source},description:{story:"For multiple groups in one `Fieldset`, render each `CheckboxGroup` inside the\nfieldset and give it its own accessible name with `aria-label` or\n`aria-labelledby`.\n\nEach group manages its own selection and parent checkbox.",...b.parameters?.docs?.description}}}})))()}export{init_checkbox_groups_story as n,h as t};