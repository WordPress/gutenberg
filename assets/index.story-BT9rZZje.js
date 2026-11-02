import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./checkbox-group-DvFp-VLB.js";import{n as o,t as s}from"./checkbox-Dne3xa6K.js";var c,l,u,d;function init_index_story(){return(init_index_story=e((()=>{n(),o(),i(),c=t(),l={tags:[`manifest`],title:`Components/@wordpress-ui/Form/Primitives/CheckboxGroup`,id:`design-system-components-form-primitives-checkboxgroup`,component:a,subcomponents:{"CheckboxGroup.NestedItems":a.NestedItems},argTypes:{onValueChange:{action:`onValueChange`}},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},u={args:{defaultValue:[],"aria-label":`Fruit`},render:e=>(0,c.jsx)(a,{...e,children:[`Apple`,`Banana`,`Orange`].map(e=>(0,c.jsx)(s,{value:e,"aria-label":e},e))})},d={render:function Template(e){let[t,n]=(0,r.useState)([`apple`]);return(0,c.jsxs)(a,{value:t,onValueChange:(t,...r)=>{n(t),e.onValueChange?.(t,...r)},allValues:[`apple`,`orange`,`banana`],"aria-label":`Fruit`,children:[(0,c.jsx)(s,{parent:!0,value:`fruit`,"aria-label":`Fruit`}),(0,c.jsxs)(a.NestedItems,{children:[(0,c.jsx)(s,{value:`apple`,"aria-label":`Apple`}),(0,c.jsx)(s,{value:`orange`,"aria-label":`Orange`}),(0,c.jsx)(s,{value:`banana`,"aria-label":`Banana`})]})]})}};try{d.__docgenInfo={description:`\`CheckboxGroup\` can be used to control a group of checkboxes from a single
parent checkbox.

For screen reader accessibility, do not nest more than one level.

See the [Checkbox Groups](?path=/docs/design-system-components-form-checkbox-groups--docs#nesting)
documentation for a full example.`,displayName:`WithParentCheckbox`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/checkbox-group/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: [],
    'aria-label': 'Fruit'
  },
  render: args => <CheckboxGroup {...args}>
            {['Apple', 'Banana', 'Orange'].map(label => <Checkbox key={label} value={label} aria-label={label} />)}
        </CheckboxGroup>
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: function Template(args) {
    const [fruitValue, setFruitValue] = useState(['apple']);
    return <CheckboxGroup value={fruitValue} onValueChange={(nextValue, ...changeArgs) => {
      setFruitValue(nextValue);
      args.onValueChange?.(nextValue, ...changeArgs);
    }} allValues={['apple', 'orange', 'banana']} aria-label="Fruit">
                <Checkbox parent value="fruit" aria-label="Fruit" />
                <CheckboxGroup.NestedItems>
                    <Checkbox value="apple" aria-label="Apple" />
                    <Checkbox value="orange" aria-label="Orange" />
                    <Checkbox value="banana" aria-label="Banana" />
                </CheckboxGroup.NestedItems>
            </CheckboxGroup>;
  }
}`,...d.parameters?.docs?.source},description:{story:`\`CheckboxGroup\` can be used to control a group of checkboxes from a single
parent checkbox.

For screen reader accessibility, do not nest more than one level.

See the [Checkbox Groups](?path=/docs/design-system-components-form-checkbox-groups--docs#nesting)
documentation for a full example.`,...d.parameters?.docs?.description}}}})))()}init_index_story();export{u as Default,d as WithParentCheckbox,l as default};