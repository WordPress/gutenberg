import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./composite-DBwlARfB.js";import{n as o,t as s}from"./tooltip-kbkpfJje.js";import{i as c,r as l,t as u}from"./slot-fill-aOtBDwg6.js";var d,f,p,m,h,g,_,v,Slot,Fill,y,b;function init_index_story(){return(init_index_story=e((()=>{n(),c(),i(),o(),d=t(),f={tags:[`manifest`],title:`Components/@wordpress-components/Utilities/Composite`,id:`components-composite`,component:a,subcomponents:{"Composite.Group":a.Group,"Composite.GroupLabel":a.GroupLabel,"Composite.Row":a.Row,"Composite.Item":a.Item,"Composite.Hover":a.Hover,"Composite.Typeahead":a.Typeahead,"Composite.Context":a.Context},argTypes:{children:{control:!1},render:{control:!1},setActiveId:{control:!1},focusLoop:{control:`select`,options:[!0,!1,`horizontal`,`vertical`,`both`]},focusWrap:{control:`select`,options:[!0,!1,`horizontal`,`vertical`,`both`]}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`}},decorators:[e=>(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(`style`,{children:`
                        [data-active-item] {
                            background-color: #ffc0b5;
                        }
                    `}),(0,d.jsx)(e,{}),(0,d.jsxs)(`div`,{style:{marginTop:`2em`,fontSize:`12px`,fontStyle:`italic`},children:[(0,d.jsx)(`p`,{id:`list-title`,children:`Notes`}),(0,d.jsxs)(`ul`,{"aria-labelledby":`list-title`,children:[(0,d.jsx)(`li`,{children:`The active composite item is highlighted with a different background color;`}),(0,d.jsx)(`li`,{children:`A composite item can be the active item even when it doesn't have keyboard focus.`})]})]})]})]},p={args:{children:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(a.Item,{children:`Item one`}),(0,d.jsx)(a.Item,{children:`Item two`}),(0,d.jsx)(a.Item,{children:`Item three`})]})}},m={...p,args:{...p.args,children:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)(a.Group,{children:[(0,d.jsx)(a.GroupLabel,{children:`Group one`}),(0,d.jsx)(a.Item,{children:`Item 1.1`}),(0,d.jsx)(a.Item,{children:`Item 1.2`})]}),(0,d.jsxs)(a.Group,{children:[(0,d.jsx)(a.GroupLabel,{children:`Group two`}),(0,d.jsx)(a.Item,{children:`Item 2.1`}),(0,d.jsx)(a.Item,{children:`Item 2.1`})]})]})}},h={...p,args:{...p.args,role:`grid`,"aria-label":`Composite`,children:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)(a.Row,{role:`row`,children:[(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item A1`}),(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item A2`}),(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item A3`})]}),(0,d.jsxs)(a.Row,{role:`row`,children:[(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item B1`}),(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item B2`}),(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item B3`})]}),(0,d.jsxs)(a.Row,{role:`row`,children:[(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item C1`}),(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item C2`}),(0,d.jsx)(a.Item,{role:`gridcell`,children:`Item C3`})]})]})}},g={...p,args:{...p.args,children:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(a.Hover,{render:(0,d.jsx)(a.Item,{}),children:`Hover item one`}),(0,d.jsx)(a.Hover,{render:(0,d.jsx)(a.Item,{}),children:`Hover item two`}),(0,d.jsx)(a.Hover,{render:(0,d.jsx)(a.Item,{}),children:`Hover item three`})]})},parameters:{docs:{description:{story:`Elements in the composite widget will receive focus on mouse move and lose focus to the composite base element on mouse leave.`}}}},_={args:{...p.args,render:(0,d.jsx)(a.Typeahead,{}),children:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(a.Item,{children:`Apple`}),(0,d.jsx)(a.Item,{children:`Banana`}),(0,d.jsx)(a.Item,{children:`Peach`})]})},parameters:{docs:{description:{story:`When focus in on the composite widget, hitting printable character keys will move focus to the next composite item that begins with the input characters.`}}}},v=l(`Example`),Slot=()=>{let e=(0,r.useContext)(a.Context),t=(0,r.useMemo)(()=>({forwardedContext:[[a.Context.Provider,{value:e}]]}),[e]);return(0,d.jsx)(v.Slot,{fillProps:t,bubblesVirtually:!0,style:{display:`contents`}})},Fill=({children:e})=>{let t=(0,d.jsx)(d.Fragment,{children:e});return(0,d.jsx)(v.Fill,{children:e=>{let{forwardedContext:n=[]}=e;return n.reduce((e,[t,n])=>(0,d.jsx)(t,{...n,children:e}),t)}})},y={...p,args:{...p.args,children:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(a.Item,{children:`Item one (direct child)`}),(0,d.jsx)(Slot,{}),(0,d.jsx)(a.Item,{children:`Item four (direct child)`})]})},decorators:[e=>(0,d.jsxs)(u,{children:[(0,d.jsx)(e,{}),(0,d.jsxs)(Fill,{children:[(0,d.jsx)(a.Item,{children:`Item two (from slot fill)`}),(0,d.jsx)(a.Item,{children:`Item three (from slot fill)`})]})]})],parameters:{docs:{description:{story:`When rendering Composite components across a SlotFill, the Composite.Context should be manually forwarded from the Slot to the Fill component.`},source:{transform:e=>`const ExampleSlotFill = createSlotFill( 'Example' );

const Slot = () => {
  const compositeContext = useContext( Composite.Context );

  // Forward the Slot's composite context to the Fill via fillProps, so that
  // Composite components rendered inside the Fill can work as expected.
  const fillProps = useMemo(
    () => ( {
      forwardedContext: [
        [ Composite.Context.Provider, { value: compositeContext } ],
      ],
    } ),
    [ compositeContext ]
  );

  return (
    <ExampleSlotFill.Slot
      fillProps={ fillProps }
      bubblesVirtually
      style={ { display: 'contents' } }
    />
  );
};

const Fill = ( { children } ) => {
  const innerMarkup = <>{ children }</>;

  return (
    <ExampleSlotFill.Fill>
      { ( fillProps ) => {
        const { forwardedContext = [] } = fillProps;

        // Render all context providers forwarded by the Slot via fillProps.
        return forwardedContext.reduce(
          ( inner, [ Provider, props ] ) => (
            <Provider { ...props }>{ inner }</Provider>
          ),
          innerMarkup
        );
      } }
    </ExampleSlotFill.Fill>
  );
};

// In a separate component:

<SlotFillProvider>
  ${e.replaceAll(`
`,`
  `)}

  <Fill>
    <Composite.Item>
      Item two (from slot fill)
    </Composite.Item>
    <Composite.Item>
      Item three (from slot fill)
    </Composite.Item>
  </Fill>
</SlotFillProvider>`}}}},b={...p,args:{...p.args,children:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(s,{text:`Tooltip one`,children:(0,d.jsx)(a.Item,{children:`Item one`})}),(0,d.jsx)(s,{text:`Tooltip two`,children:(0,d.jsx)(a.Item,{children:`Item two`})}),(0,d.jsx)(s,{text:`Tooltip three`,children:(0,d.jsx)(a.Item,{children:`Item three`})})]})}};try{b.__docgenInfo={description:`Combining the \`Tooltip\` and \`Composite\` component has a few caveats. And while there are a few ways to compose these two components, our recommendation is to render \`Composite.Item\` as a child of \`Tooltip\`.

\`\`\`jsx
// 🔴 Does not work
<Composite.Item
  render={
    <Tooltip text="Tooltip">
      <button>Item</button>
    </Tooltip>
  }
/>

// 🟢 Good
<Tooltip text="Tooltip one">
  <Composite.Item>
    Item one
  </Composite.Item>
</Tooltip>
\`\`\``,displayName:`WithTooltips`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/composite/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    children: <>
                <Composite.Item>Item one</Composite.Item>
                <Composite.Item>Item two</Composite.Item>
                <Composite.Item>Item three</Composite.Item>
            </>
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    children: <>
                <Composite.Group>
                    <Composite.GroupLabel>Group one</Composite.GroupLabel>
                    <Composite.Item>Item 1.1</Composite.Item>
                    <Composite.Item>Item 1.2</Composite.Item>
                </Composite.Group>
                <Composite.Group>
                    <Composite.GroupLabel>Group two</Composite.GroupLabel>
                    <Composite.Item>Item 2.1</Composite.Item>
                    <Composite.Item>Item 2.1</Composite.Item>
                </Composite.Group>
            </>
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    role: 'grid',
    'aria-label': 'Composite',
    children: <>
                <Composite.Row role="row">
                    <Composite.Item role="gridcell">Item A1</Composite.Item>
                    <Composite.Item role="gridcell">Item A2</Composite.Item>
                    <Composite.Item role="gridcell">Item A3</Composite.Item>
                </Composite.Row>
                <Composite.Row role="row">
                    <Composite.Item role="gridcell">Item B1</Composite.Item>
                    <Composite.Item role="gridcell">Item B2</Composite.Item>
                    <Composite.Item role="gridcell">Item B3</Composite.Item>
                </Composite.Row>
                <Composite.Row role="row">
                    <Composite.Item role="gridcell">Item C1</Composite.Item>
                    <Composite.Item role="gridcell">Item C2</Composite.Item>
                    <Composite.Item role="gridcell">Item C3</Composite.Item>
                </Composite.Row>
            </>
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    children: <>
                <Composite.Hover render={<Composite.Item />}>
                    Hover item one
                </Composite.Hover>
                <Composite.Hover render={<Composite.Item />}>
                    Hover item two
                </Composite.Hover>
                <Composite.Hover render={<Composite.Item />}>
                    Hover item three
                </Composite.Hover>
            </>
  },
  parameters: {
    docs: {
      description: {
        story: 'Elements in the composite widget will receive focus on mouse move and lose focus to the composite base element on mouse leave.'
      }
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    render: <Composite.Typeahead />,
    children: <>
                <Composite.Item>Apple</Composite.Item>
                <Composite.Item>Banana</Composite.Item>
                <Composite.Item>Peach</Composite.Item>
            </>
  },
  parameters: {
    docs: {
      description: {
        story: 'When focus in on the composite widget, hitting printable character keys will move focus to the next composite item that begins with the input characters.'
      }
    }
  }
}`,..._.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    children: <>
                <Composite.Item>Item one (direct child)</Composite.Item>
                <Slot />
                <Composite.Item>Item four (direct child)</Composite.Item>
            </>
  },
  decorators: [Story => {
    return <SlotFillProvider>
                    <Story />

                    <Fill>
                        <Composite.Item>
                            Item two (from slot fill)
                        </Composite.Item>
                        <Composite.Item>
                            Item three (from slot fill)
                        </Composite.Item>
                    </Fill>
                </SlotFillProvider>;
  }],
  parameters: {
    docs: {
      description: {
        story: 'When rendering Composite components across a SlotFill, the Composite.Context should be manually forwarded from the Slot to the Fill component.'
      },
      source: {
        transform: (code: string) => {
          return \`const ExampleSlotFill = createSlotFill( 'Example' );

const Slot = () => {
  const compositeContext = useContext( Composite.Context );

  // Forward the Slot's composite context to the Fill via fillProps, so that
  // Composite components rendered inside the Fill can work as expected.
  const fillProps = useMemo(
    () => ( {
      forwardedContext: [
        [ Composite.Context.Provider, { value: compositeContext } ],
      ],
    } ),
    [ compositeContext ]
  );

  return (
    <ExampleSlotFill.Slot
      fillProps={ fillProps }
      bubblesVirtually
      style={ { display: 'contents' } }
    />
  );
};

const Fill = ( { children } ) => {
  const innerMarkup = <>{ children }</>;

  return (
    <ExampleSlotFill.Fill>
      { ( fillProps ) => {
        const { forwardedContext = [] } = fillProps;

        // Render all context providers forwarded by the Slot via fillProps.
        return forwardedContext.reduce(
          ( inner, [ Provider, props ] ) => (
            <Provider { ...props }>{ inner }</Provider>
          ),
          innerMarkup
        );
      } }
    </ExampleSlotFill.Fill>
  );
};

// In a separate component:

<SlotFillProvider>
  \${
          // Add one level of indentation to match the surrounding code.
          code.replaceAll('\\n', '\\n  ')}

  <Fill>
    <Composite.Item>
      Item two (from slot fill)
    </Composite.Item>
    <Composite.Item>
      Item three (from slot fill)
    </Composite.Item>
  </Fill>
</SlotFillProvider>\`;
        }
      }
    }
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    children: <>
                <Tooltip text="Tooltip one">
                    <Composite.Item>Item one</Composite.Item>
                </Tooltip>
                <Tooltip text="Tooltip two">
                    <Composite.Item>Item two</Composite.Item>
                </Tooltip>
                <Tooltip text="Tooltip three">
                    <Composite.Item>Item three</Composite.Item>
                </Tooltip>
            </>
  }
}`,...b.parameters?.docs?.source},description:{story:`Combining the \`Tooltip\` and \`Composite\` component has a few caveats. And while there are a few ways to compose these two components, our recommendation is to render \`Composite.Item\` as a child of \`Tooltip\`.

\`\`\`jsx
// 🔴 Does not work
<Composite.Item
  render={
    <Tooltip text="Tooltip">
      <button>Item</button>
    </Tooltip>
  }
/>

// 🟢 Good
<Tooltip text="Tooltip one">
  <Composite.Item>
    Item one
  </Composite.Item>
</Tooltip>
\`\`\``,...b.parameters?.docs?.description}}}})))()}init_index_story();export{p as Default,h as Grid,m as Groups,g as Hover,_ as Typeahead,y as WithSlotFill,b as WithTooltips,f as default};