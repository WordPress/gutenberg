import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{a as n,i as r,n as i,o as a,r as o,t as s}from"./description-TGUWJb3E.js";import{n as c,t as l}from"./details-BE97OXzu.js";import{i as u,t as d}from"./shared-OZzGz5W1.js";var f,p,m,h,g;function init_index_story(){return(init_index_story=e((()=>{a(),r(),i(),c(),u(),f=t(),p={tags:[`manifest`],title:`Components/@wordpress-ui/Form/Primitives/Fieldset`,id:`design-system-components-form-primitives-fieldset`,component:n,subcomponents:{"Fieldset.Legend":o,"Fieldset.Description":s,"Fieldset.Details":l},parameters:{componentStatus:{status:`recommended`,whereUsed:`global`}}},m={args:{children:[(0,f.jsx)(o,{children:`Legend`},`legend`),(0,f.jsx)(s,{children:`This is a description for the entire fieldset.`},`description`),[`Apples`,`Bananas`].map(e=>(0,f.jsxs)(`label`,{children:[(0,f.jsx)(`input`,{type:`checkbox`}),` `,e]},e))]}},h={args:{children:[(0,f.jsx)(o,{hideFromVision:!0,children:`Legend`},`legend`),[`Apples`,`Bananas`].map(e=>(0,f.jsxs)(`label`,{children:[(0,f.jsx)(`input`,{type:`checkbox`}),` `,e]},e))]}},g={args:{children:[(0,f.jsx)(o,{children:`Legend`},`legend`),(0,f.jsx)(l,{children:d},`details`),[`Apples`,`Bananas`].map(e=>(0,f.jsxs)(`label`,{children:[(0,f.jsx)(`input`,{type:`checkbox`}),` `,e]},e))]}};try{h.__docgenInfo={description:"When `hideFromVision` is set on `Fieldset.Legend`, the legend is visually\nhidden but remains accessible to screen readers.",displayName:`HiddenLegend`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/fieldset/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{g.__docgenInfo={description:`To add rich content (such as links) to the description, use \`Fieldset.Details\`.

Although this content is not associated with the fieldset using direct semantics,
it is made discoverable to screen reader users via a visually hidden description,
alerting them to the presence of additional information below.

If the content only includes plain text, use \`Fieldset.Description\` instead,
so the readout is not unnecessarily verbose for screen reader users.`,displayName:`WithDetails`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/form/primitives/fieldset/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Fieldset.Legend key="legend">Legend</Fieldset.Legend>, <Fieldset.Description key="description">
                This is a description for the entire fieldset.
            </Fieldset.Description>, ['Apples', 'Bananas'].map(fruit =>
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label key={fruit}>
                    <input type="checkbox" /> {fruit}
                </label>)]
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Fieldset.Legend hideFromVision key="legend">
                Legend
            </Fieldset.Legend>, ['Apples', 'Bananas'].map(fruit =>
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label key={fruit}>
                    <input type="checkbox" /> {fruit}
                </label>)]
  }
}`,...h.parameters?.docs?.source},description:{story:"When `hideFromVision` is set on `Fieldset.Legend`, the legend is visually\nhidden but remains accessible to screen readers.",...h.parameters?.docs?.description}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    children: [<Fieldset.Legend key="legend">Legend</Fieldset.Legend>, <Fieldset.Details key="details">
                {DETAILS_EXAMPLE}
            </Fieldset.Details>, ['Apples', 'Bananas'].map(fruit =>
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label key={fruit}>
                    <input type="checkbox" /> {fruit}
                </label>)]
  }
}`,...g.parameters?.docs?.source},description:{story:`To add rich content (such as links) to the description, use \`Fieldset.Details\`.

Although this content is not associated with the fieldset using direct semantics,
it is made discoverable to screen reader users via a visually hidden description,
alerting them to the presence of additional information below.

If the content only includes plain text, use \`Fieldset.Description\` instead,
so the readout is not unnecessarily verbose for screen reader users.`,...g.parameters?.docs?.description}}}})))()}init_index_story();export{m as Default,h as HiddenLegend,g as WithDetails,p as default};