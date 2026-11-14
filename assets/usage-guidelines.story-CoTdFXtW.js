import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{dl as a,n as o,zs as s}from"./build-module-D7uZ1UZL.js";import{C as c,E as l,T as u,b as d,d as f,f as p,g as ee,h as m,i as te,l as ne,m as re,n as ie,p as ae,r as oe,t as se,u as h,w as ce,y as g}from"./root-D5Lurj2p.js";import{n as le,t as _}from"./select-control-1SqlUn2G.js";import{a as v,d as y,g as ue,h as b,i as x,n as S,o as C,p as w,r as T,t as E}from"./trigger-D4GY6htC.js";import{a as D,c as O,d as k,f as A,i as j,l as M,m as N,n as P,o as F,p as I,r as L,s as R,t as z,u as B}from"./separator-D5ulsfOE.js";import{n as V,t as H}from"./link-item-Dgc79ANX.js";var U=t({AutocompleteForSearchableCommands:()=>Q,CheckedOptionsWithinACommandMenu:()=>$,ConsistentPrefixIconsWithinGroups:()=>K,MenuForCommands:()=>Z,MixedPrefixIcons:()=>q,SelectForValues:()=>X,default:()=>G}),W,G,K,q,J,Y,X,Z,Q,$;function init_usage_guidelines_story(){return(init_usage_guidelines_story=e((()=>{r(),o(),ie(),d(),te(),ce(),p(),h(),l(),re(),ee(),le(),x(),S(),C(),A(),B(),w(),O(),ue(),P(),V(),N(),F(),j(),W=n(),G={title:`Components/@wordpress-ui/Menu/Usage Guidelines`,id:`design-system-components-menu-usage-guidelines`,parameters:{controls:{disable:!0}},tags:[`!dev`]},K={render:()=>(0,W.jsxs)(T,{children:[(0,W.jsx)(E,{children:`Item options`}),(0,W.jsxs)(v,{children:[(0,W.jsxs)(k,{children:[(0,W.jsx)(M,{children:`Actions`}),(0,W.jsx)(y,{prefix:(0,W.jsx)(R,{icon:s}),children:(0,W.jsx)(b,{children:`Duplicate`})}),(0,W.jsx)(y,{prefix:(0,W.jsx)(R,{icon:a}),children:(0,W.jsx)(b,{children:`Archive`})})]}),(0,W.jsx)(z,{}),(0,W.jsxs)(k,{children:[(0,W.jsx)(M,{children:`Navigation`}),(0,W.jsx)(H,{href:`#menu-usage-guidelines-destination`,children:(0,W.jsx)(b,{children:`View details`})}),(0,W.jsx)(H,{href:`https://wordpress.org`,children:(0,W.jsx)(b,{children:`WordPress.org`})})]})]})]})},q={render:()=>(0,W.jsxs)(T,{children:[(0,W.jsx)(E,{children:`Mixed item options`}),(0,W.jsx)(v,{children:(0,W.jsxs)(k,{children:[(0,W.jsx)(M,{children:`Actions`}),(0,W.jsx)(y,{prefix:(0,W.jsx)(R,{icon:s}),children:(0,W.jsx)(b,{children:`Duplicate`})}),(0,W.jsx)(y,{children:(0,W.jsx)(b,{children:`Rename…`})}),(0,W.jsx)(y,{prefix:(0,W.jsx)(R,{icon:a}),children:(0,W.jsx)(b,{children:`Archive`})})]})})]})},J=[{value:`list`,label:`List`},{value:`grid`,label:`Grid`}],Y=[{id:`duplicate`,value:`Duplicate`},{id:`download`,value:`Download`},{id:`view-details`,value:`View details`}],X={render:()=>(0,W.jsx)(_,{label:`View`,items:J,defaultValue:J[0]})},Z={render:()=>(0,W.jsxs)(T,{children:[(0,W.jsx)(E,{children:`Actions`}),(0,W.jsxs)(v,{children:[(0,W.jsx)(y,{children:(0,W.jsx)(b,{children:`Duplicate`})}),(0,W.jsx)(y,{children:(0,W.jsx)(b,{children:`Download`})}),(0,W.jsx)(H,{href:`#menu-usage-guidelines-destination`,children:(0,W.jsx)(b,{children:`View details`})})]})]})},Q={render:()=>(0,W.jsxs)(se,{items:Y,children:[(0,W.jsx)(g,{"aria-label":`Search commands`,placeholder:`Search commands`}),(0,W.jsxs)(oe,{children:[(0,W.jsx)(c,{children:`No commands found.`}),(0,W.jsx)(f,{children:(0,W.jsx)(ne,{children:(0,W.jsx)(u,{children:e=>(0,W.jsx)(ae,{value:e,children:(0,W.jsx)(m,{children:e.value})},e.id)})})})]})]})},$={render:function Render(){let[e,t]=(0,i.useState)(!0),[n,r]=(0,i.useState)(!1),[a,o]=(0,i.useState)(`comfortable`);return(0,W.jsxs)(T,{children:[(0,W.jsx)(E,{children:`View options`}),(0,W.jsxs)(v,{children:[(0,W.jsx)(y,{children:(0,W.jsx)(b,{children:`Reset view`})}),(0,W.jsx)(z,{}),(0,W.jsxs)(k,{children:[(0,W.jsx)(M,{children:`Visible columns`}),(0,W.jsx)(I,{checked:e,onCheckedChange:t,children:(0,W.jsx)(b,{children:`Author`})}),(0,W.jsx)(I,{checked:n,onCheckedChange:r,children:(0,W.jsx)(b,{children:`Date`})})]}),(0,W.jsx)(z,{}),(0,W.jsxs)(D,{value:a,onValueChange:o,children:[(0,W.jsx)(M,{children:`Density`}),(0,W.jsx)(L,{value:`compact`,children:(0,W.jsx)(b,{children:`Compact`})}),(0,W.jsx)(L,{value:`comfortable`,children:(0,W.jsx)(b,{children:`Comfortable`})})]})]})]})}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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