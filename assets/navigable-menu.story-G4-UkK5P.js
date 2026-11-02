import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./menu-CGEEGcXg.js";var i,a,o,Default;function init_navigable_menu_story(){return(init_navigable_menu_story=e((()=>{n(),i=t(),{fn:a}=__STORYBOOK_MODULE_TEST__,o={title:`Components/@wordpress-components/Containers/NavigableMenu`,id:`components-navigablemenu`,component:r,argTypes:{children:{control:!1}},args:{onKeyDown:a(),onNavigate:a()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`unaudited`,whereUsed:`global`}}},Default=e=>(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`button`,{children:`Before navigable menu`}),(0,i.jsxs)(r,{...e,style:{margin:`32px 0`,padding:`16px`,border:`1px solid black`},children:[(0,i.jsx)(`div`,{role:`menuitem`,children:`Item 1 (non-tabbable, non-focusable)`}),(0,i.jsx)(`button`,{role:`menuitem`,children:`Item 2 (tabbable, focusable)`}),(0,i.jsx)(`button`,{role:`menuitem`,disabled:!0,children:`Item 3 (disabled, therefore non-tabbable and not-focusable)`}),(0,i.jsx)(`span`,{role:`menuitem`,tabIndex:-1,children:`Item 4 (non-tabbable, non-focusable)`}),(0,i.jsx)(`div`,{role:`menuitem`,tabIndex:0,children:`Item 5 (tabbable, focusable)`})]}),(0,i.jsx)(`button`,{children:`After navigable menu`})]}),Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`args => {
  return <>
            <button>Before navigable menu</button>
            <NavigableMenu {...args} style={{
      margin: '32px 0',
      padding: '16px',
      border: '1px solid black'
    }}>
                <div role="menuitem">Item 1 (non-tabbable, non-focusable)</div>
                <button role="menuitem">Item 2 (tabbable, focusable)</button>
                <button role="menuitem" disabled>
                    Item 3 (disabled, therefore non-tabbable and not-focusable)
                </button>
                <span role="menuitem" tabIndex={-1}>
                    Item 4 (non-tabbable, non-focusable)
                </span>
                <div role="menuitem" tabIndex={0}>
                    Item 5 (tabbable, focusable)
                </div>
            </NavigableMenu>
            <button>After navigable menu</button>
        </>;
}`,...Default.parameters?.docs?.source}}}})))()}init_navigable_menu_story();export{Default,o as default};