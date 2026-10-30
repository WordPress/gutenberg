import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{r as i,t as a}from"./react-platform-CdCCcmsi.js";import{n as o,t as s}from"./component-BpQ9fa0N.js";import{i as c,n as l,s as u,t as d}from"./slot-fill-aOtBDwg6.js";function IframePortal({children:e}){let[t,n]=(0,r.useState)(null);return(0,f.jsx)(`iframe`,{title:`Cross-document SlotFill styles`,srcDoc:`<!doctype html><html><body></body></html>`,onLoad:e=>{n(e.currentTarget.contentDocument?.body??null)},style:{border:0,height:160,width:`100%`},children:t&&a(e,t)})}var f,p,Default,WithFillProps,WithSlotChildren,WithContext,CrossDocumentStyles;function init_index_story(){return(init_index_story=e((()=>{n(),i(),c(),o(),f=t(),p={tags:[`manifest`],component:l,title:`Components/@wordpress-components/Utilities/SlotFill`,id:`components-slotfill`,subcomponents:{Fill:u,SlotFillProvider:d},argTypes:{name:{control:!1},as:{control:{type:`text`}},fillProps:{control:!1}},parameters:{controls:{expanded:!0},docs:{source:{state:`open`}},componentStatus:{status:`recommended`,whereUsed:`global`}}},Default=e=>(0,f.jsxs)(d,{children:[(0,f.jsx)(`h2`,{children:`Profile`}),(0,f.jsxs)(`p`,{children:[`Name: `,(0,f.jsx)(l,{...e,name:`name`})]}),(0,f.jsxs)(`p`,{children:[`Age: `,(0,f.jsx)(l,{...e,name:`age`})]}),(0,f.jsx)(u,{name:`name`,children:`Grace`}),(0,f.jsx)(u,{name:`age`,children:`33`})]}),Default.args={bubblesVirtually:!0,as:`span`},WithFillProps=e=>(0,f.jsxs)(d,{children:[(0,f.jsx)(`h2`,{children:`Profile`}),(0,f.jsxs)(`p`,{children:[`Name:`,` `,(0,f.jsx)(l,{...e,name:`name`,fillProps:{name:`Grace`}})]}),(0,f.jsxs)(`p`,{children:[`Age: `,(0,f.jsx)(l,{...e,name:`age`,fillProps:{age:33}})]}),(0,f.jsx)(u,{name:`name`,children:e=>e.name}),(0,f.jsx)(u,{name:`age`,children:e=>e.age})]}),WithFillProps.args={...Default.args},WithSlotChildren=e=>(0,f.jsxs)(d,{children:[(0,f.jsx)(`h2`,{children:`Profile`}),(0,f.jsxs)(`p`,{children:[`Name:`,(0,f.jsx)(l,{...e,name:`name`,children:e=>(0,f.jsx)(`span`,{style:{color:`red`},children:e})})]}),(0,f.jsxs)(`p`,{children:[`Age:`,(0,f.jsx)(l,{...e,name:`age`,children:e=>(0,f.jsx)(`span`,{style:{color:`red`},children:e})})]}),(0,f.jsx)(u,{name:`name`,children:`Alice`}),(0,f.jsx)(u,{name:`age`,children:`18`})]}),WithSlotChildren.args={...Default.args},WithContext=e=>{let t=(0,r.createContext)(``),ContextFill=({name:e})=>{let n=(0,r.useContext)(t);return(0,f.jsx)(u,{name:e,children:n})};return(0,f.jsxs)(d,{children:[(0,f.jsx)(`h2`,{children:`Profile`}),(0,f.jsxs)(`p`,{children:[`Name: `,(0,f.jsx)(l,{...e,name:`name`})]}),(0,f.jsxs)(`p`,{children:[`Age: `,(0,f.jsx)(l,{...e,name:`age`})]}),(0,f.jsx)(t.Provider,{value:`Grace`,children:(0,f.jsx)(ContextFill,{name:`name`})}),(0,f.jsx)(t.Provider,{value:33,children:(0,f.jsx)(ContextFill,{name:`age`})})]})},WithContext.args={...Default.args},CrossDocumentStyles=()=>(0,f.jsxs)(d,{children:[(0,f.jsx)(`p`,{children:`The content below should have 32px of padding inside its outline.`}),(0,f.jsx)(IframePortal,{children:(0,f.jsx)(l,{name:`cross-document-styles`,bubblesVirtually:!0})}),(0,f.jsx)(u,{name:`cross-document-styles`,children:(0,f.jsx)(s,{padding:8,style:{display:`inline-block`,outline:`2px solid currentColor`},children:`SCSS module styles rendered in another document`})})]}),Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`props => {
  return <SlotFillProvider>
            <h2>Profile</h2>
            <p>
                Name: <Slot {...props} name="name" />
            </p>
            <p>
                Age: <Slot {...props} name="age" />
            </p>
            <Fill name="name">Grace</Fill>
            <Fill name="age">33</Fill>
        </SlotFillProvider>;
}`,...Default.parameters?.docs?.source}}},WithFillProps.parameters={...WithFillProps.parameters,docs:{...WithFillProps.parameters?.docs,source:{originalSource:`props => {
  return <SlotFillProvider>
            <h2>Profile</h2>
            <p>
                Name:{' '}
                <Slot {...props} name="name" fillProps={{
        name: 'Grace'
      }} />
            </p>
            <p>
                Age: <Slot {...props} name="age" fillProps={{
        age: 33
      }} />
            </p>

            <Fill name="name">{fillProps => fillProps.name}</Fill>
            <Fill name="age">{fillProps => fillProps.age}</Fill>
        </SlotFillProvider>;
}`,...WithFillProps.parameters?.docs?.source}}},WithSlotChildren.parameters={...WithSlotChildren.parameters,docs:{...WithSlotChildren.parameters?.docs,source:{originalSource:`props => {
  return <SlotFillProvider>
            <h2>Profile</h2>
            <p>
                Name:
                {/* @ts-expect-error Not supported children for \`<Slot />\` when \`bubblesVirtually\` is true. */}
                <Slot {...props} name="name">
                    {fills => {
          return <span style={{
            color: 'red'
          }}>{fills}</span>;
        }}
                </Slot>
            </p>
            <p>
                Age:
                {/* @ts-expect-error Not support children for \`<Slot />\` when \`bubblesVirtually\` is true. */}
                <Slot {...props} name="age">
                    {fills => {
          return <span style={{
            color: 'red'
          }}>{fills}</span>;
        }}
                </Slot>
            </p>
            <Fill name="name">Alice</Fill>
            <Fill name="age">18</Fill>
        </SlotFillProvider>;
}`,...WithSlotChildren.parameters?.docs?.source}}},WithContext.parameters={...WithContext.parameters,docs:{...WithContext.parameters?.docs,source:{originalSource:`props => {
  const Context = createContext<string | number>('');
  const ContextFill = ({
    name
  }: {
    name: string;
  }) => {
    const value = useContext(Context);
    return <Fill name={name}>{value}</Fill>;
  };
  return <SlotFillProvider>
            <h2>Profile</h2>
            <p>
                Name: <Slot {...props} name="name" />
            </p>
            <p>
                Age: <Slot {...props} name="age" />
            </p>
            <Context.Provider value="Grace">
                <ContextFill name="name" />
            </Context.Provider>
            <Context.Provider value={33}>
                <ContextFill name="age" />
            </Context.Provider>
        </SlotFillProvider>;
}`,...WithContext.parameters?.docs?.source}}},CrossDocumentStyles.parameters={...CrossDocumentStyles.parameters,docs:{...CrossDocumentStyles.parameters?.docs,source:{originalSource:`() => {
  return <SlotFillProvider>
            <p>
                The content below should have 32px of padding inside its
                outline.
            </p>
            <IframePortal>
                <Slot name="cross-document-styles" bubblesVirtually />
            </IframePortal>
            <Fill name="cross-document-styles">
                <Spacer padding={8} style={{
        display: 'inline-block',
        outline: '2px solid currentColor'
      }}>
                    SCSS module styles rendered in another document
                </Spacer>
            </Fill>
        </SlotFillProvider>;
}`,...CrossDocumentStyles.parameters?.docs?.source}}}})))()}init_index_story();export{CrossDocumentStyles,Default,WithContext,WithFillProps,WithSlotChildren,p as default};