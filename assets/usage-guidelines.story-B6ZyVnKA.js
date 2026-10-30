import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{Vs as a,_l as o,n as s}from"./build-module-DttIWYbV.js";import{C as c,E as l,S as u,T as d,_ as f,a as p,d as m,f as ee,g as te,h,m as ne,n as re,o as ie,p as ae,t as oe,v as se,w as g,x as _}from"./root-f5Rmeg4H.js";import{n as ce,t as v}from"./select-control-DKNfkUy1.js";import{a as y,d as b,g as le,h as x,i as S,n as C,o as w,p as T,r as E,t as D}from"./trigger-DSZAbldm.js";import{a as O,c as k,d as A,f as j,i as M,l as N,m as P,n as F,o as ue,p as I,r as L,s as R,t as z,u as B}from"./separator-DWP85mIx.js";import{n as V,t as H}from"./link-item-C50KW0xq.js";var U=t({AutocompleteForSearchableCommands:()=>Q,CheckedOptionsWithinACommandMenu:()=>$,ConsistentPrefixIconsWithinGroups:()=>K,MenuForCommands:()=>Z,MixedPrefixIcons:()=>q,SelectForValues:()=>X,default:()=>G}),W,G,K,q,J,Y,X,Z,Q,$;function init_usage_guidelines_story(){return(init_usage_guidelines_story=e((()=>{r(),s(),re(),u(),ie(),g(),ne(),ee(),l(),te(),se(),ce(),S(),C(),w(),j(),B(),T(),k(),le(),F(),V(),P(),ue(),M(),W=n(),G={title:`Components/@wordpress-ui/Menu/Usage Guidelines`,id:`design-system-components-menu-usage-guidelines`,parameters:{controls:{disable:!0}},tags:[`!dev`]},K={render:()=>(0,W.jsxs)(E,{children:[(0,W.jsx)(D,{children:`Item options`}),(0,W.jsxs)(y,{children:[(0,W.jsxs)(A,{children:[(0,W.jsx)(N,{children:`Actions`}),(0,W.jsx)(b,{prefix:(0,W.jsx)(R,{icon:a}),children:(0,W.jsx)(x,{children:`Duplicate`})}),(0,W.jsx)(b,{prefix:(0,W.jsx)(R,{icon:o}),children:(0,W.jsx)(x,{children:`Archive`})})]}),(0,W.jsx)(z,{}),(0,W.jsxs)(A,{children:[(0,W.jsx)(N,{children:`Navigation`}),(0,W.jsx)(H,{href:`#menu-usage-guidelines-destination`,children:(0,W.jsx)(x,{children:`View details`})}),(0,W.jsx)(H,{href:`https://wordpress.org`,children:(0,W.jsx)(x,{children:`WordPress.org`})})]})]})]})},q={render:()=>(0,W.jsxs)(E,{children:[(0,W.jsx)(D,{children:`Mixed item options`}),(0,W.jsx)(y,{children:(0,W.jsxs)(A,{children:[(0,W.jsx)(N,{children:`Actions`}),(0,W.jsx)(b,{prefix:(0,W.jsx)(R,{icon:a}),children:(0,W.jsx)(x,{children:`Duplicate`})}),(0,W.jsx)(b,{children:(0,W.jsx)(x,{children:`Rename…`})}),(0,W.jsx)(b,{prefix:(0,W.jsx)(R,{icon:o}),children:(0,W.jsx)(x,{children:`Archive`})})]})})]})},J=[{value:`list`,label:`List`},{value:`grid`,label:`Grid`}],Y=[{id:`duplicate`,value:`Duplicate`},{id:`download`,value:`Download`},{id:`view-details`,value:`View details`}],X={render:()=>(0,W.jsx)(v,{label:`View`,items:J,defaultValue:J[0]})},Z={render:()=>(0,W.jsxs)(E,{children:[(0,W.jsx)(D,{children:`Actions`}),(0,W.jsxs)(y,{children:[(0,W.jsx)(b,{children:(0,W.jsx)(x,{children:`Duplicate`})}),(0,W.jsx)(b,{children:(0,W.jsx)(x,{children:`Download`})}),(0,W.jsx)(H,{href:`#menu-usage-guidelines-destination`,children:(0,W.jsx)(x,{children:`View details`})})]})]})},Q={render:()=>(0,W.jsxs)(oe,{items:Y,children:[(0,W.jsx)(_,{"aria-label":`Search commands`,placeholder:`Search commands`}),(0,W.jsxs)(p,{children:[(0,W.jsx)(c,{children:`No commands found.`}),(0,W.jsx)(ae,{children:(0,W.jsx)(m,{children:(0,W.jsx)(d,{children:e=>(0,W.jsx)(h,{value:e,children:(0,W.jsx)(f,{children:e.value})},e.id)})})})]})]})},$={render:function Render(){let[e,t]=(0,i.useState)(!0),[n,r]=(0,i.useState)(!1),[a,o]=(0,i.useState)(`comfortable`);return(0,W.jsxs)(E,{children:[(0,W.jsx)(D,{children:`View options`}),(0,W.jsxs)(y,{children:[(0,W.jsx)(b,{children:(0,W.jsx)(x,{children:`Reset view`})}),(0,W.jsx)(z,{}),(0,W.jsxs)(A,{children:[(0,W.jsx)(N,{children:`Visible columns`}),(0,W.jsx)(I,{checked:e,onCheckedChange:t,children:(0,W.jsx)(x,{children:`Author`})}),(0,W.jsx)(I,{checked:n,onCheckedChange:r,children:(0,W.jsx)(x,{children:`Date`})})]}),(0,W.jsx)(z,{}),(0,W.jsxs)(O,{value:a,onValueChange:o,children:[(0,W.jsx)(N,{children:`Density`}),(0,W.jsx)(L,{value:`compact`,children:(0,W.jsx)(x,{children:`Compact`})}),(0,W.jsx)(L,{value:`comfortable`,children:(0,W.jsx)(x,{children:`Comfortable`})})]})]})]})}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  render: () => <Menu.Root>
            <Menu.Trigger>Item options</Menu.Trigger>
            <Menu.Popup>
                <Menu.Group>
                    <Menu.GroupLabel>Actions</Menu.GroupLabel>
                    <Menu.Item prefix={<Menu.PrefixIcon icon={copy} />}>
                        <Menu.ItemLabel>Duplicate</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item prefix={<Menu.PrefixIcon icon={archive} />}>
                        <Menu.ItemLabel>Archive</Menu.ItemLabel>
                    </Menu.Item>
                </Menu.Group>
                <Menu.Separator />
                <Menu.Group>
                    <Menu.GroupLabel>Navigation</Menu.GroupLabel>
                    <Menu.LinkItem href="#menu-usage-guidelines-destination">
                        <Menu.ItemLabel>View details</Menu.ItemLabel>
                    </Menu.LinkItem>
                    <Menu.LinkItem href="https://wordpress.org">
                        <Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
                    </Menu.LinkItem>
                </Menu.Group>
            </Menu.Popup>
        </Menu.Root>
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  render: () => <Menu.Root>
            <Menu.Trigger>Mixed item options</Menu.Trigger>
            <Menu.Popup>
                <Menu.Group>
                    <Menu.GroupLabel>Actions</Menu.GroupLabel>
                    <Menu.Item prefix={<Menu.PrefixIcon icon={copy} />}>
                        <Menu.ItemLabel>Duplicate</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.ItemLabel>Rename…</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item prefix={<Menu.PrefixIcon icon={archive} />}>
                        <Menu.ItemLabel>Archive</Menu.ItemLabel>
                    </Menu.Item>
                </Menu.Group>
            </Menu.Popup>
        </Menu.Root>
}`,...q.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  render: () => <SelectControl label="View" items={viewItems} defaultValue={viewItems[0]} />
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: () => <Menu.Root>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Popup>
                <Menu.Item>
                    <Menu.ItemLabel>Duplicate</Menu.ItemLabel>
                </Menu.Item>
                <Menu.Item>
                    <Menu.ItemLabel>Download</Menu.ItemLabel>
                </Menu.Item>
                <Menu.LinkItem href="#menu-usage-guidelines-destination">
                    <Menu.ItemLabel>View details</Menu.ItemLabel>
                </Menu.LinkItem>
            </Menu.Popup>
        </Menu.Root>
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  render: () => <Autocomplete.Root items={commandItems}>
            <Autocomplete.Input aria-label="Search commands" placeholder="Search commands" />
            <Autocomplete.Popup>
                <Autocomplete.Empty>No commands found.</Autocomplete.Empty>
                <Autocomplete.List>
                    <Autocomplete.ListBody>
                        <Autocomplete.Collection>
                            {(command: (typeof commandItems)[number]) => <Autocomplete.Item key={command.id} value={command}>
                                    <Autocomplete.ItemLabel>
                                        {command.value}
                                    </Autocomplete.ItemLabel>
                                </Autocomplete.Item>}
                        </Autocomplete.Collection>
                    </Autocomplete.ListBody>
                </Autocomplete.List>
            </Autocomplete.Popup>
        </Autocomplete.Root>
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [showAuthor, setShowAuthor] = useState(true);
    const [showDate, setShowDate] = useState(false);
    const [density, setDensity] = useState('comfortable');
    return <Menu.Root>
                <Menu.Trigger>View options</Menu.Trigger>
                <Menu.Popup>
                    <Menu.Item>
                        <Menu.ItemLabel>Reset view</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Visible columns</Menu.GroupLabel>
                        <Menu.CheckboxItem checked={showAuthor} onCheckedChange={setShowAuthor}>
                            <Menu.ItemLabel>Author</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem checked={showDate} onCheckedChange={setShowDate}>
                            <Menu.ItemLabel>Date</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.RadioGroup value={density} onValueChange={setDensity}>
                        <Menu.GroupLabel>Density</Menu.GroupLabel>
                        <Menu.RadioItem value="compact">
                            <Menu.ItemLabel>Compact</Menu.ItemLabel>
                        </Menu.RadioItem>
                        <Menu.RadioItem value="comfortable">
                            <Menu.ItemLabel>Comfortable</Menu.ItemLabel>
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                </Menu.Popup>
            </Menu.Root>;
  }
}`,...$.parameters?.docs?.source}}}})))()}export{q as a,U as c,Z as i,$ as n,X as o,K as r,init_usage_guidelines_story as s,Q as t};