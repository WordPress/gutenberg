import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./menu-CGEEGcXg.js";import{i as o,n as s,r as c,t as l}from"./menu-group-COjzD6Q4.js";import{n as u,t as d}from"./menu-items-choice-C6qW2zcl.js";var f,p,Template,m,MultiGroupsTemplate,h;function init_index_story(){return(init_index_story=e((()=>{n(),s(),o(),u(),i(),f=t(),p={tags:[`manifest`],title:`Components/@wordpress-components/Actions/MenuGroup`,component:l,id:`components-menugroup`,argTypes:{children:{control:!1}},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`global`,notes:"Subcomponent of `DropdownMenu`."}}},Template=e=>(0,f.jsx)(a,{children:(0,f.jsxs)(l,{...e,children:[(0,f.jsx)(c,{children:`Menu Item 1`}),(0,f.jsx)(c,{children:`Menu Item 2`})]})}),m=Template.bind({}),MultiGroupsTemplate=e=>{let[t,n]=(0,r.useState)(`visual`),i=[{value:`visual`,label:`Visual editor`},{value:`text`,label:`Code editor`}];return(0,f.jsxs)(a,{children:[(0,f.jsxs)(l,{label:`View`,children:[(0,f.jsx)(c,{children:`Top Toolbar`}),(0,f.jsx)(c,{children:`Spotlight Mode`}),(0,f.jsx)(c,{children:`Distraction Free`})]}),(0,f.jsx)(l,{...e,children:(0,f.jsx)(d,{choices:i,value:t,onSelect:e=>n(e),onHover:()=>{}})})]})},h=MultiGroupsTemplate.bind({}),h.args={...m.args,hideSeparator:!1,label:`Editor`};try{h.__docgenInfo={description:`When other menu items exist above or below a MenuGroup, the group
should have a divider line between it and the adjacent item.`,displayName:`WithSeparator`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu-group/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`args => {
  return <NavigableMenu>
            <MenuGroup {...args}>
                <MenuItem>Menu Item 1</MenuItem>
                <MenuItem>Menu Item 2</MenuItem>
            </MenuGroup>
        </NavigableMenu>;
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`args => {
  const [mode, setMode] = useState('visual');
  const choices = [{
    value: 'visual',
    label: 'Visual editor'
  }, {
    value: 'text',
    label: 'Code editor'
  }];
  return <NavigableMenu>
            <MenuGroup label="View">
                <MenuItem>Top Toolbar</MenuItem>
                <MenuItem>Spotlight Mode</MenuItem>
                <MenuItem>Distraction Free</MenuItem>
            </MenuGroup>
            <MenuGroup {...args}>
                <MenuItemsChoice choices={choices} value={mode} onSelect={(newMode: string) => setMode(newMode)} onHover={() => {}} />
            </MenuGroup>
        </NavigableMenu>;
}`,...h.parameters?.docs?.source},description:{story:`When other menu items exist above or below a MenuGroup, the group
should have a divider line between it and the adjacent item.`,...h.parameters?.docs?.description}}}})))()}init_index_story();export{m as Default,h as WithSeparator,p as default};