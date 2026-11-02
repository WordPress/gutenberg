import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./checkbox-group-DvFp-VLB.js";import{a as s,i as c,n as l,o as u,r as d,t as f}from"./description-DjlOrFzr.js";import{n as p,t as m}from"./checkbox-control-BLro4Gzn.js";var h=t({GroupingCheckboxes:()=>v,Nesting:()=>y,default:()=>_}),g,_,v,y;function init_checkbox_groups_story(){return(init_checkbox_groups_story=e((()=>{r(),p(),a(),u(),c(),l(),g=n(),_={title:`Components/@wordpress-ui/Form/Checkbox Groups`,id:`design-system-components-form-checkbox-groups`,tags:[`!autodocs`,`!dev`],parameters:{controls:{disable:!0}}},v={render:function Template(){return(0,g.jsxs)(s,{render:(0,g.jsx)(o,{defaultValue:[`1`]}),children:[(0,g.jsx)(d,{children:`Notifications`}),(0,g.jsx)(f,{children:`Choose which updates you want to receive.`}),(0,g.jsx)(m,{value:`1`,label:`Comments`,description:`Notify me when someone comments.`}),(0,g.jsx)(m,{value:`2`,label:`Mentions`,description:`Notify me when someone mentions me.`}),(0,g.jsx)(m,{value:`3`,label:`Follows`,description:`Notify me when someone follows me.`})]})}},y={render:function Template(){let[e,t]=(0,i.useState)([`apple`]),[n,r]=(0,i.useState)([]);return(0,g.jsxs)(s,{children:[(0,g.jsx)(d,{children:`Produce`}),(0,g.jsx)(f,{children:`Select the fruit and vegetables you want.`}),(0,g.jsxs)(o,{value:e,onValueChange:t,allValues:[`apple`,`orange`,`banana`],"aria-label":`Fruit`,children:[(0,g.jsx)(m,{parent:!0,value:`fruit`,label:`Fruit`}),(0,g.jsxs)(o.NestedItems,{children:[(0,g.jsx)(m,{value:`apple`,label:`Apple`}),(0,g.jsx)(m,{value:`orange`,label:`Orange`}),(0,g.jsx)(m,{value:`banana`,label:`Banana`})]})]}),(0,g.jsxs)(o,{value:n,onValueChange:r,allValues:[`carrot`,`lettuce`,`pepper`],"aria-label":`Vegetable`,children:[(0,g.jsx)(m,{parent:!0,value:`vegetable`,label:`Vegetable`}),(0,g.jsxs)(o.NestedItems,{children:[(0,g.jsx)(m,{value:`carrot`,label:`Carrot`}),(0,g.jsx)(m,{value:`lettuce`,label:`Lettuce`}),(0,g.jsx)(m,{value:`pepper`,label:`Pepper`})]})]})]})}};try{v.__docgenInfo={description:"Compose checkbox groups from `CheckboxGroup` and `CheckboxControl`.\n\nThis example composes `Fieldset.Root` and `CheckboxGroup` on one element.\nThe fieldset legend gives the group its accessible name.\n\nControl checked state through `value` or `defaultValue` and `onValueChange`.",displayName:`GroupingCheckboxes`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/stories/checkbox-groups.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{y.__docgenInfo={description:"To control a group from a parent checkbox:\n\n1. Use `CheckboxGroup` in controlled mode.\n2. Pass the child checkbox values to `allValues`.\n3. Mark the parent checkbox with the `parent` prop.\n\n`CheckboxGroup.NestedItems` adds standard indentation to nested items.\n\nThis example uses two `CheckboxGroup`s in one `Fieldset`. Do not nest more\nthan one level for screen readers.",displayName:`Nesting`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/stories/checkbox-groups.story.tsx`,methods:[],props:{},tags:{}}}catch{}v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
    const [fruitValue, setFruitValue] = useState(['apple']);
    const [vegetableValue, setVegetableValue] = useState<string[]>([]);
    return <Fieldset.Root>
                <Fieldset.Legend>Produce</Fieldset.Legend>
                <Fieldset.Description>
                    Select the fruit and vegetables you want.
                </Fieldset.Description>
                <CheckboxGroup value={fruitValue} onValueChange={setFruitValue} allValues={['apple', 'orange', 'banana']} aria-label="Fruit">
                    <CheckboxControl parent value="fruit" label="Fruit" />
                    <CheckboxGroup.NestedItems>
                        <CheckboxControl value="apple" label="Apple" />
                        <CheckboxControl value="orange" label="Orange" />
                        <CheckboxControl value="banana" label="Banana" />
                    </CheckboxGroup.NestedItems>
                </CheckboxGroup>
                <CheckboxGroup value={vegetableValue} onValueChange={setVegetableValue} allValues={['carrot', 'lettuce', 'pepper']} aria-label="Vegetable">
                    <CheckboxControl parent value="vegetable" label="Vegetable" />
                    <CheckboxGroup.NestedItems>
                        <CheckboxControl value="carrot" label="Carrot" />
                        <CheckboxControl value="lettuce" label="Lettuce" />
                        <CheckboxControl value="pepper" label="Pepper" />
                    </CheckboxGroup.NestedItems>
                </CheckboxGroup>
            </Fieldset.Root>;
  }
}`,...y.parameters?.docs?.source},description:{story:"To control a group from a parent checkbox:\n\n1. Use `CheckboxGroup` in controlled mode.\n2. Pass the child checkbox values to `allValues`.\n3. Mark the parent checkbox with the `parent` prop.\n\n`CheckboxGroup.NestedItems` adds standard indentation to nested items.\n\nThis example uses two `CheckboxGroup`s in one `Fieldset`. Do not nest more\nthan one level for screen readers.",...y.parameters?.docs?.description}}}})))()}export{init_checkbox_groups_story as n,h as t};