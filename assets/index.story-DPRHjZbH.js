import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./button-8ccnOjTA.js";import{n as i,t as a}from"./dropdown-Q5LPKa4v.js";import{n as o,t as s}from"./dropdown-content-wrapper-Ds9LIyCN.js";import{i as c,n as l,r as u,t as d}from"./menu-group-COjzD6Q4.js";var f,p,m,h,g,_,v;function init_index_story(){return(init_index_story=e((()=>{i(),n(),l(),c(),o(),f=t(),{fn:p}=__STORYBOOK_MODULE_TEST__,m={tags:[`manifest`],title:`Components/@wordpress-components/Overlays/Dropdown`,id:`components-dropdown`,component:a,subcomponents:{DropdownContentWrapper:s},args:{onClose:p(),onToggle:p()},argTypes:{focusOnMount:{options:[`firstElement`,!0,!1],control:{type:`radio`}},position:{control:!1},renderContent:{control:!1},renderToggle:{control:!1},open:{control:!1},defaultOpen:{control:!1},onToggle:{control:!1},onClose:{control:!1}},parameters:{controls:{expanded:!0},componentStatus:{status:`recommended`,whereUsed:`global`}}},h={args:{renderToggle:({isOpen:e,onToggle:t})=>(0,f.jsx)(r,{__next40pxDefaultSize:!0,onClick:t,"aria-expanded":e,variant:`primary`,children:`Open dropdown`}),renderContent:()=>(0,f.jsx)(`div`,{children:`This is the dropdown content.`})}},g={...h,args:{...h.args,renderContent:()=>(0,f.jsxs)(s,{paddingSize:`medium`,children:[`Content wrapped with `,(0,f.jsx)(`code`,{children:`paddingSize="medium"`}),`.`]})}},_={...h,args:{...h.args,renderContent:()=>(0,f.jsxs)(s,{paddingSize:`none`,children:[`Content wrapped with `,(0,f.jsx)(`code`,{children:`paddingSize="none"`}),`.`]})}},v={...h,args:{...h.args,renderContent:()=>(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(u,{children:`Standalone Item`}),(0,f.jsxs)(d,{label:`Group 1`,children:[(0,f.jsx)(u,{children:`Item 1`}),(0,f.jsx)(u,{children:`Item 2`})]}),(0,f.jsxs)(d,{label:`Group 2`,children:[(0,f.jsx)(u,{children:`Item 1`}),(0,f.jsx)(u,{children:`Item 2`})]})]})}};try{g.__docgenInfo={description:'To apply more padding to the dropdown content, use the provided `<DropdownContentWrapper>`\nconvenience wrapper. A `paddingSize` of `"medium"` is suitable for relatively larger dropdowns (default is `"small"`).',displayName:`WithMorePadding`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/dropdown/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{_.__docgenInfo={description:'The `<DropdownContentWrapper>` convenience wrapper can also be used to remove padding entirely,\nwith a `paddingSize` of `"none"`. This can also serve as a clean foundation to add arbitrary\npaddings, for example when child components already have padding on their own.',displayName:`WithNoPadding`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/dropdown/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    renderToggle: ({
      isOpen,
      onToggle
    }) => <Button __next40pxDefaultSize onClick={onToggle} aria-expanded={isOpen} variant="primary">
                Open dropdown
            </Button>,
    renderContent: () => <div>This is the dropdown content.</div>
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    renderContent: () => <DropdownContentWrapper paddingSize="medium">
                {/* eslint-disable react/no-unescaped-entities */}
                Content wrapped with <code>paddingSize="medium"</code>.
                {/* eslint-enable react/no-unescaped-entities */}
            </DropdownContentWrapper>
  }
}`,...g.parameters?.docs?.source},description:{story:'To apply more padding to the dropdown content, use the provided `<DropdownContentWrapper>`\nconvenience wrapper. A `paddingSize` of `"medium"` is suitable for relatively larger dropdowns (default is `"small"`).',...g.parameters?.docs?.description}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    renderContent: () => <DropdownContentWrapper paddingSize="none">
                {/* eslint-disable react/no-unescaped-entities */}
                Content wrapped with <code>paddingSize="none"</code>.
                {/* eslint-enable react/no-unescaped-entities */}
            </DropdownContentWrapper>
  }
}`,..._.parameters?.docs?.source},description:{story:'The `<DropdownContentWrapper>` convenience wrapper can also be used to remove padding entirely,\nwith a `paddingSize` of `"none"`. This can also serve as a clean foundation to add arbitrary\npaddings, for example when child components already have padding on their own.',..._.parameters?.docs?.description}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  ...Default,
  args: {
    ...Default.args,
    renderContent: () => <>
                <MenuItem>Standalone Item</MenuItem>
                <MenuGroup label="Group 1">
                    <MenuItem>Item 1</MenuItem>
                    <MenuItem>Item 2</MenuItem>
                </MenuGroup>
                <MenuGroup label="Group 2">
                    <MenuItem>Item 1</MenuItem>
                    <MenuItem>Item 2</MenuItem>
                </MenuGroup>
            </>
  }
}`,...v.parameters?.docs?.source}}}})))()}init_index_story();export{h as Default,v as WithMenuItems,g as WithMorePadding,_ as WithNoPadding,m as default};