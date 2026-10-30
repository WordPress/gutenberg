import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{E as i,Fc as a,Nc as o,hl as s,ll as c,n as l,vi as u,wi as d}from"./build-module-DttIWYbV.js";import{n as f,t as p}from"./dropdown-menu-1nj0x6gm.js";import{i as m,n as h,r as g,t as _}from"./menu-group-DP9smo1n.js";import{n as v,t as y}from"./menu-items-choice-ImSKz7jO.js";var b,x,S,C,w,T,E;function init_index_story(){return(init_index_story=e((()=>{n(),l(),f(),m(),h(),v(),b=t(),{fn:x}=__STORYBOOK_MODULE_TEST__,S={title:`Components/@wordpress-components/Actions/DropdownMenu`,component:p,id:`components-dropdownmenu`,parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"When building for the Gutenberg repo, use [`Menu`](?path=/docs/design-system-components-menu--docs) from `@wordpress/ui` instead. Otherwise, continue using `DropdownMenu` for now."}},args:{onToggle:x()},argTypes:{icon:{options:[`menu`,`chevronDown`,`more`],mapping:{menu:d,chevronDown:o,more:u},control:{type:`select`}},open:{control:!1},defaultOpen:{control:!1},onToggle:{control:!1}}},C={args:{label:`Select a direction.`,icon:d,controls:[{title:`First Menu Item Label`,icon:c,onClick:()=>console.log(`up!`)},{title:`Second Menu Item Label`,icon:s,onClick:()=>console.log(`down!`)}]}},w={...C,parameters:{docs:{source:{code:`<DropdownMenu label="Select a direction." icon={ more }>
  <MenuGroup>
    <MenuItem icon={ arrowUp } onClick={ onClose }>
      Move Up
    </MenuItem>
    <MenuItem icon={ arrowDown } onClick={ onClose }>
      Move Down
    </MenuItem>
  </MenuGroup>
  <MenuGroup>
    <MenuItem icon={ trash } onClick={ onClose }>
      Remove
    </MenuItem>
  </MenuGroup>
</DropdownMenu>`,language:`jsx`,type:`auto`}}},args:{label:`Select a direction.`,icon:u,children:({onClose:e})=>(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(g,{icon:c,onClick:e,children:`Standalone Item`}),(0,b.jsxs)(_,{children:[(0,b.jsx)(g,{icon:c,onClick:e,children:`Move Up`}),(0,b.jsx)(g,{icon:s,onClick:e,children:`Move Down`})]}),(0,b.jsx)(_,{children:(0,b.jsx)(g,{icon:i,onClick:e,children:`Remove`})})]})}},T={parameters:{docs:{canvas:{sourceState:`hidden`}}},args:{label:`Editor options`,icon:u},render:function Render(e){let[t,n]=(0,r.useState)(`visual`);return(0,b.jsx)(p,{...e,children:()=>(0,b.jsx)(_,{label:`Editor`,children:(0,b.jsx)(y,{choices:[{value:`visual`,label:`Visual editor`},{value:`code`,label:`Code editor`}],value:t,onSelect:n})})})}},E={parameters:{docs:{canvas:{sourceState:`hidden`}}},args:{label:`Typography options`,icon:u},render:function Render(e){let[t,n]=(0,r.useState)([`Font`]),toggleOption=e=>{n(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e])};return(0,b.jsx)(p,{...e,children:()=>(0,b.jsx)(_,{label:`Typography`,children:[`Font`,`Font size`,`Line height`].map(e=>{let n=t.includes(e);return(0,b.jsx)(g,{role:`menuitemcheckbox`,isSelected:n,icon:n?a:null,onClick:()=>toggleOption(e),children:e},e)})})})}};try{T.__docgenInfo={description:`Use \`MenuItemsChoice\` for mutually exclusive selections. It renders radio menu
items and a check icon for the selected choice. This example keeps the popup
open when the selection changes.`,displayName:`SingleSelection`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/dropdown-menu/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{E.__docgenInfo={description:'Use `MenuItem` with `role="menuitemcheckbox"` for independent selections.\nSet `isSelected` and a check icon for each selected item. Keep the popup open\nby updating the selection without calling `onClose`.',displayName:`MultiSelection`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/dropdown-menu/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Select a direction.',
    icon: menu,
    controls: [{
      title: 'First Menu Item Label',
      icon: arrowUp,
      // eslint-disable-next-line no-console
      onClick: () => console.log('up!')
    }, {
      title: 'Second Menu Item Label',
      icon: arrowDown,
      // eslint-disable-next-line no-console
      onClick: () => console.log('down!')
    }]
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  ...Default,
  // Adding custom source because Storybook is not able to show the contents of
  // the \`children\` prop correctly in the code snippet.
  parameters: {
    docs: {
      source: {
        code: \`<DropdownMenu label="Select a direction." icon={ more }>
  <MenuGroup>
    <MenuItem icon={ arrowUp } onClick={ onClose }>
      Move Up
    </MenuItem>
    <MenuItem icon={ arrowDown } onClick={ onClose }>
      Move Down
    </MenuItem>
  </MenuGroup>
  <MenuGroup>
    <MenuItem icon={ trash } onClick={ onClose }>
      Remove
    </MenuItem>
  </MenuGroup>
</DropdownMenu>\`,
        language: 'jsx',
        type: 'auto'
      }
    }
  },
  args: {
    label: 'Select a direction.',
    icon: more,
    children: ({
      onClose
    }) => <>
                <MenuItem icon={arrowUp} onClick={onClose}>
                    Standalone Item
                </MenuItem>
                <MenuGroup>
                    <MenuItem icon={arrowUp} onClick={onClose}>
                        Move Up
                    </MenuItem>
                    <MenuItem icon={arrowDown} onClick={onClose}>
                        Move Down
                    </MenuItem>
                </MenuGroup>
                <MenuGroup>
                    <MenuItem icon={trash} onClick={onClose}>
                        Remove
                    </MenuItem>
                </MenuGroup>
            </>
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      canvas: {
        sourceState: 'hidden'
      }
    }
  },
  args: {
    label: 'Editor options',
    icon: more
  },
  render: function Render(args) {
    const [mode, setMode] = useState('visual');
    return <DropdownMenu {...args}>
                {() => <MenuGroup label="Editor">
                        <MenuItemsChoice choices={[{
          value: 'visual',
          label: 'Visual editor'
        }, {
          value: 'code',
          label: 'Code editor'
        }]} value={mode} onSelect={setMode} />
                    </MenuGroup>}
            </DropdownMenu>;
  }
}`,...T.parameters?.docs?.source},description:{story:`Use \`MenuItemsChoice\` for mutually exclusive selections. It renders radio menu
items and a check icon for the selected choice. This example keeps the popup
open when the selection changes.`,...T.parameters?.docs?.description}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      canvas: {
        sourceState: 'hidden'
      }
    }
  },
  args: {
    label: 'Typography options',
    icon: more
  },
  render: function Render(args) {
    const [selectedOptions, setSelectedOptions] = useState(['Font']);
    const toggleOption = (option: string) => {
      setSelectedOptions(options => options.includes(option) ? options.filter(item => item !== option) : [...options, option]);
    };
    return <DropdownMenu {...args}>
                {() => <MenuGroup label="Typography">
                        {['Font', 'Font size', 'Line height'].map(option => {
          const isSelected = selectedOptions.includes(option);
          return <MenuItem key={option} role="menuitemcheckbox" isSelected={isSelected} icon={isSelected ? check : null} onClick={() => toggleOption(option)}>
                                        {option}
                                    </MenuItem>;
        })}
                    </MenuGroup>}
            </DropdownMenu>;
  }
}`,...E.parameters?.docs?.source},description:{story:'Use `MenuItem` with `role="menuitemcheckbox"` for independent selections.\nSet `isSelected` and a check icon for each selected item. Keep the popup open\nby updating the selection without calling `onClose`.',...E.parameters?.docs?.description}}}})))()}init_index_story();export{C as Default,E as MultiSelection,T as SingleSelection,w as WithChildren,S as default};