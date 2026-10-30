import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{i as n,n as r,t as i}from"./base-control-Br0KG0a3.js";import{n as a,t as o}from"./button-01oyTe_f.js";var s,c,BaseControlWithTextarea,l,u,WithVisualLabel;function init_index_story(){return(init_index_story=e((()=>{r(),a(),s=t(),c={title:`Components/@wordpress-components/Selection & Input/Common/BaseControl`,id:`components-basecontrol`,component:i,subcomponents:{"BaseControl.VisualLabel":i.VisualLabel},argTypes:{children:{control:!1},help:{control:{type:`text`}},label:{control:{type:`text`}}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Use [`Field`](?path=/docs/design-system-components-form-primitives-field--docs) from `@wordpress/ui` instead. For a purely visual label outside `Field.Root`, use `Field.VisualLabel`. For a group legend, use [`Fieldset`](?path=/docs/design-system-components-form-primitives-fieldset--docs) and `Fieldset.Legend`."}}},BaseControlWithTextarea=e=>{let{baseControlProps:t,controlProps:r}=n(e);return(0,s.jsx)(i,{...t,children:(0,s.jsx)(`textarea`,{style:{display:`block`},...r})})},l=BaseControlWithTextarea.bind({}),l.args={label:`Label text`},u=BaseControlWithTextarea.bind({}),u.args={...l.args,help:`Help text adds more explanation.`},WithVisualLabel=e=>(i.VisualLabel.displayName=`BaseControl.VisualLabel`,(0,s.jsxs)(i,{...e,children:[(0,s.jsx)(i.VisualLabel,{children:`Visual label`}),(0,s.jsx)(`div`,{children:(0,s.jsx)(o,{__next40pxDefaultSize:!0,variant:`secondary`,children:`Select an author`})})]})),WithVisualLabel.args={...l.args,help:`This button is already accessibly labeled.`,label:void 0};try{WithVisualLabel.__docgenInfo={description:"`BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.\n\nIt should only be used in cases where the children being rendered inside `BaseControl` are already accessibly labeled,\ne.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would\notherwise use if the `label` prop was passed.",displayName:`WithVisualLabel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/base-control/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`props => {
  const {
    baseControlProps,
    controlProps
  } = useBaseControlProps(props);
  return <BaseControl {...baseControlProps}>
            <textarea style={{
      display: 'block'
    }} {...controlProps} />
        </BaseControl>;
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`props => {
  const {
    baseControlProps,
    controlProps
  } = useBaseControlProps(props);
  return <BaseControl {...baseControlProps}>
            <textarea style={{
      display: 'block'
    }} {...controlProps} />
        </BaseControl>;
}`,...u.parameters?.docs?.source}}},WithVisualLabel.parameters={...WithVisualLabel.parameters,docs:{...WithVisualLabel.parameters?.docs,source:{originalSource:`props => {
  BaseControl.VisualLabel.displayName = 'BaseControl.VisualLabel';
  return <BaseControl {...props}>
            <BaseControl.VisualLabel>Visual label</BaseControl.VisualLabel>
            <div>
                <Button __next40pxDefaultSize variant="secondary">
                    Select an author
                </Button>
            </div>
        </BaseControl>;
}`,...WithVisualLabel.parameters?.docs?.source},description:{story:"`BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.\n\nIt should only be used in cases where the children being rendered inside `BaseControl` are already accessibly labeled,\ne.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would\notherwise use if the `label` prop was passed.",...WithVisualLabel.parameters?.docs?.description}}}})))()}init_index_story();export{l as Default,u as WithHelpText,WithVisualLabel,c as default};