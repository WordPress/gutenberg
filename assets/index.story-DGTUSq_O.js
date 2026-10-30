import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{o as a,t as o}from"./build-module-CqL0UdL5.js";import{a as s,i as c}from"./iframe-BbJPeSVw.js";import{a as l,o as u,t as d}from"./svg-D4K4iM4_.js";import{Dc as f,Fc as p,Ll as ee,Ts as te,Uo as ne,n as m}from"./build-module-DttIWYbV.js";import{i as re,s as ie}from"./CDh2UhnG-DKeuVzYY.js";import{_ as ae,a as oe,b as se,c as ce,d as le,f as ue,g as de,h as fe,i as pe,l as me,m as he,n as ge,o as _e,p as ve,r as ye,s as be,t as xe,u as h,v as g,y as Se}from"./menu-separator-Bk-SOq50.js";import{c as Ce,i as we,n as Te,o as Ee,s as De,t as Oe}from"./use-context-system-CT9ido3G.js";import{n as ke,t as _}from"./component-BF_IUaTR.js";import{n as Ae,t as je}from"./component-YDHyXPzh.js";import{n as v,t as y}from"./icon-DQj1iRYw.js";import{n as Me,t as b}from"./button-01oyTe_f.js";import{i as Ne,r as Pe,t as Fe}from"./slot-fill-aOtBDwg6.js";import{n as Ie,t as Le}from"./modal-Dkj06R_g.js";var x;function init_context(){return(init_context=e((()=>{r(),x=(0,i.createContext)(void 0),x.displayName=`MenuContext`;try{x.__docgenInfo={description:``,displayName:`MenuContext`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/context.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var Re,ze,Be,Ve,S;function init_style_module(){return(init_style_module=e((()=>{Re=`_menu_1n1wv_96`,ze=`_item_1n1wv_159`,Be=`_group_1n1wv_293`,Ve=`_separator_1n1wv_306`,S={menu:Re,"menu-surface":`_menu-surface_1n1wv_103`,"is-toolbar":`_is-toolbar_1n1wv_118`,"menu-motion-root":`_menu-motion-root_1n1wv_123`,item:ze,"item-prefix-wrapper":`_item-prefix-wrapper_1n1wv_232`,"checkbox-item":`_checkbox-item_1n1wv_240`,"radio-item":`_radio-item_1n1wv_240`,"item-content-wrapper":`_item-content-wrapper_1n1wv_258`,"item-children-wrapper":`_item-children-wrapper_1n1wv_271`,"item-suffix-wrapper":`_item-suffix-wrapper_1n1wv_278`,group:Be,"group-label":`_group-label_1n1wv_298`,separator:Ve,"submenu-chevron-icon":`_submenu-chevron-icon_1n1wv_322`,"is-rtl":`_is-rtl_1n1wv_326`,"item-label":`_item-label_1n1wv_330`,"item-help-text":`_item-help-text_1n1wv_336`}})))()}function focusDisclosureElement(e){if(e.focus(),e.ownerDocument.activeElement===e)return;let t=e.closest(`[inert]`);t&&(t.inert=!1),e.ownerDocument.defaultView?.HTMLElement.prototype.focus.call(e)}function useMenuItemHideOnClick(e,t){return(0,i.useCallback)(n=>{if(!(typeof t==`function`?t(n):t))return!1;if(!e||!(`hideAll`in e))return!0;let r=e.getState().contentElement,i=r?.ownerDocument.activeElement;if(r?.contains(i??null)){let t=e;for(;t.parent;)t=t.parent;let n=t.getState().disclosureElement;n&&focusDisclosureElement(n)}return!0},[t,e])}function init_use_menu_item_hide_on_click(){return(init_use_menu_item_hide_on_click=e((()=>{r()})))()}var C,w;function init_item(){return(init_item=e((()=>{s(),ue(),r(),init_style_module(),init_context(),init_use_menu_item_hide_on_click(),C=n(),w=(0,i.forwardRef)(function UnforwardedItem({className:e,prefix:t,suffix:n,children:r,disabled:a=!1,hideOnClick:o=!0,store:s,...l},u){let d=(0,i.useContext)(x),f=s??d?.store,p=useMenuItemHideOnClick(f,o);if(!d?.store||!f)throw Error(`Menu.Item can only be rendered inside a Menu component`);return(0,C.jsxs)(le,{ref:u,...l,className:c(S.item,e),accessibleWhenDisabled:!0,disabled:a,store:f,hideOnClick:p,children:[(0,C.jsx)(`span`,{className:S[`item-prefix-wrapper`],children:t}),(0,C.jsxs)(`div`,{className:S[`item-content-wrapper`],children:[(0,C.jsx)(`div`,{className:S[`item-children-wrapper`],children:r}),n&&(0,C.jsx)(`span`,{className:S[`item-suffix-wrapper`],children:n})]})]})});try{w.__docgenInfo={description:``,displayName:`Item`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/item.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:"The contents of the menu item, which could include one instance of the\n`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`\ncomponent.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!0,tags:{},type:{name:`ReactNode`}},prefix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`The contents of the menu item's prefix, such as an icon.`,name:`prefix`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`ReactNode`}},suffix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`The contents of the menu item's suffix, such as a keyboard shortcut.`,name:`suffix`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`ReactNode`}},hideOnClick:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.`,name:`hideOnClick`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:"Determines if the element is disabled. This sets the `aria-disabled`\nattribute accordingly, enabling support for all elements, including those\nthat don't support the native `disabled` attribute.",name:`disabled`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`boolean`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.`,name:`render`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`ReactElement<unknown, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`}},store:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`The ariakit menu store. This prop is only meant for internal use.
@ignore`,name:`store`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`MenubarStore | MenuStore<MenuStoreValues>`}}},tags:{}}}catch{}})))()}var T,E;function init_checkbox_item(){return(init_checkbox_item=e((()=>{s(),ce(),h(),r(),m(),init_context(),init_style_module(),init_use_menu_item_hide_on_click(),T=n(),E=(0,i.forwardRef)(function UnforwardedCheckboxItem({className:e,suffix:t,children:n,disabled:r=!1,hideOnClick:a=!1,...o},s){let l=(0,i.useContext)(x)?.store,u=useMenuItemHideOnClick(l,a);if(!l)throw Error(`Menu.CheckboxItem can only be rendered inside a Menu component`);return(0,T.jsxs)(be,{ref:s,...o,className:c(S.item,S[`checkbox-item`],e),accessibleWhenDisabled:!0,disabled:r,store:l,hideOnClick:u,children:[(0,T.jsx)(me,{store:l,render:(0,T.jsx)(`span`,{className:S[`item-prefix-wrapper`]}),style:{width:`auto`,height:`auto`},children:(0,T.jsx)(ee,{icon:p,size:24})}),(0,T.jsxs)(`div`,{className:S[`item-content-wrapper`],children:[(0,T.jsx)(`div`,{className:S[`item-children-wrapper`],children:n}),t&&(0,T.jsx)(`span`,{className:S[`item-suffix-wrapper`],children:t})]})]})});try{E.__docgenInfo={description:``,displayName:`CheckboxItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/checkbox-item.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:"The contents of the menu item, which could include one instance of the\n`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`\ncomponent.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!0,tags:{},type:{name:`ReactNode`}},suffix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:`The contents of the menu item's suffix, such as a keyboard shortcut.`,name:`suffix`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`ReactNode`}},hideOnClick:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:`Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.`,name:`hideOnClick`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:"Determines if the element is disabled. This sets the `aria-disabled`\nattribute accordingly, enabling support for all elements, including those\nthat don't support the native `disabled` attribute.",name:`disabled`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`boolean`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:`Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.`,name:`render`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`ReactElement<unknown, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`}},name:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:`The checkbox menu item's name.`,name:`name`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!0,tags:{},type:{name:`string`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:"The checkbox item's value, useful when using multiple checkbox menu items\nassociated to the same `name`.",name:`value`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`string | number | readonly string[]`}},checked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:`The controlled checked state of the checkbox menu item.

Note: this prop will override the \`defaultChecked\` prop.`,name:`checked`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`boolean`}},defaultChecked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:`The checked state of the checkbox menu item when it is initially rendered.
Use when not wanting to control its checked state.

Note: this prop will be overridden by the \`checked\` prop, if it is defined.`,name:`defaultChecked`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`}],description:`A function that is called when the checkbox's checked state changes.`,name:`onChange`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`CheckboxItemProps`},required:!1,tags:{},type:{name:`ChangeEventHandler<HTMLInputElement, HTMLInputElement>`}}},tags:{}}}catch{}})))()}var D,O,k;function init_radio_item(){return(init_radio_item=e((()=>{s(),_e(),h(),r(),m(),u(),init_context(),init_style_module(),init_use_menu_item_hide_on_click(),D=n(),O=(0,D.jsx)(l,{xmlns:`http://www.w3.org/2000/svg`,viewBox:`0 0 24 24`,children:(0,D.jsx)(d,{cx:12,cy:12,r:3})}),k=(0,i.forwardRef)(function UnforwardedRadioItem({className:e,suffix:t,children:n,disabled:r=!1,hideOnClick:a=!1,...o},s){let l=(0,i.useContext)(x)?.store,u=useMenuItemHideOnClick(l,a);if(!l)throw Error(`Menu.RadioItem can only be rendered inside a Menu component`);return(0,D.jsxs)(oe,{ref:s,...o,className:c(S.item,S[`radio-item`],e),accessibleWhenDisabled:!0,disabled:r,store:l,hideOnClick:u,children:[(0,D.jsx)(me,{store:l,render:(0,D.jsx)(`span`,{className:S[`item-prefix-wrapper`]}),style:{width:`auto`,height:`auto`},children:(0,D.jsx)(ee,{icon:O,size:24})}),(0,D.jsxs)(`div`,{className:S[`item-content-wrapper`],children:[(0,D.jsx)(`div`,{className:S[`item-children-wrapper`],children:n}),t&&(0,D.jsx)(`span`,{className:S[`item-suffix-wrapper`],children:t})]})]})});try{k.__docgenInfo={description:``,displayName:`RadioItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/radio-item.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:"The contents of the menu item, which could include one instance of the\n`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`\ncomponent.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!0,tags:{},type:{name:`ReactNode`}},suffix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`The contents of the menu item's suffix, such as a keyboard shortcut.`,name:`suffix`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!1,tags:{},type:{name:`ReactNode`}},hideOnClick:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.`,name:`hideOnClick`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!1,tags:{},type:{name:`BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:"Determines if the element is disabled. This sets the `aria-disabled`\nattribute accordingly, enabling support for all elements, including those\nthat don't support the native `disabled` attribute.",name:`disabled`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!1,tags:{},type:{name:`boolean`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.`,name:`render`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!1,tags:{},type:{name:`ReactElement<unknown, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`}},name:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`The radio item's name.`,name:`name`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!0,tags:{},type:{name:`string`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`The radio item's value.`,name:`value`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!0,tags:{},type:{name:`string | number`}},checked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`The controlled checked state of the radio menu item.

Note: this prop will override the \`defaultChecked\` prop.`,name:`checked`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!1,tags:{},type:{name:`boolean`}},defaultChecked:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`The checked state of the radio menu item when it is initially rendered.
Use when not wanting to control its checked state.

Note: this prop will be overridden by the \`checked\` prop, if it is defined.`,name:`defaultChecked`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!1,tags:{},type:{name:`boolean`}},onChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`}],description:`A function that is called when the checkbox's checked state changes.`,name:`onChange`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`RadioItemProps`},required:!1,tags:{},type:{name:`BivariantCallback<(event: ChangeEvent<HTMLInputElement, Element>) => void>`}}},tags:{}}}catch{}})))()}var A,j;function init_group(){return(init_group=e((()=>{s(),de(),r(),init_context(),init_style_module(),A=n(),j=(0,i.forwardRef)(function UnforwardedGroup({className:e,...t},n){let r=(0,i.useContext)(x);if(!r?.store)throw Error(`Menu.Group can only be rendered inside a Menu component`);return(0,A.jsx)(fe,{ref:n,...t,className:c(S.group,e),store:r.store})});try{j.__docgenInfo={description:``,displayName:`Group`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/group.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`GroupProps`}],description:"The contents of the menu group, which should include one instance of the\n`Menu.GroupLabel` component and one or more instances of `Menu.Item`,\n`Menu.CheckboxItem`, and `Menu.RadioItem`.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`GroupProps`},required:!0,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var M,N;function init_group_label(){return(init_group_label=e((()=>{s(),he(),r(),init_context(),Ae(),init_style_module(),M=n(),N=(0,i.forwardRef)(function Group({className:e,...t},n){let r=(0,i.useContext)(x);if(!r?.store)throw Error(`Menu.GroupLabel can only be rendered inside a Menu component`);return(0,M.jsx)(ve,{ref:n,render:(0,M.jsx)(je,{upperCase:!0,variant:`muted`,size:`11px`,weight:`var(--wpds-typography-font-weight-emphasis, 600)`,lineHeight:`16px`}),...t,className:c(S[`group-label`],e),store:r.store})});try{N.__docgenInfo={description:``,displayName:`GroupLabel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/group-label.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`GroupLabelProps`}],description:`The contents of the menu group label, which should provide an accessible
label for the menu group.`,name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`GroupLabelProps`},required:!0,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var He,P;function init_separator(){return(init_separator=e((()=>{s(),ge(),r(),init_context(),init_style_module(),He=n(),P=(0,i.forwardRef)(function UnforwardedSeparator({className:e,...t},n){let r=(0,i.useContext)(x);if(!r?.store)throw Error(`Menu.Separator can only be rendered inside a Menu component`);return(0,He.jsx)(xe,{ref:n,...t,className:c(S.separator,e,{[S[`is-toolbar`]]:r.variant===`toolbar`}),store:r.store})});try{P.__docgenInfo={description:``,displayName:`Separator`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/separator.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var Ue,F;function init_item_label(){return(init_item_label=e((()=>{s(),r(),init_context(),ke(),init_style_module(),Ue=n(),F=(0,i.forwardRef)(function UnforwardedItemLabel({className:e,...t},n){if(!(0,i.useContext)(x)?.store)throw Error(`Menu.ItemLabel can only be rendered inside a Menu component`);return(0,Ue.jsx)(_,{numberOfLines:1,ref:n,...t,className:c(S[`item-label`],e)})});try{F.__docgenInfo={description:``,displayName:`ItemLabel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/item-label.tsx`,methods:[],props:{as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element or React component to render the component as.`,name:`as`,required:!1,tags:{},type:{name:`keyof IntrinsicElements | JSXElementConstructor<any>`}}},tags:{}}}catch{}})))()}var We,I;function init_item_help_text(){return(init_item_help_text=e((()=>{s(),r(),init_context(),ke(),init_style_module(),We=n(),I=(0,i.forwardRef)(function UnforwardedItemHelpText({className:e,...t},n){if(!(0,i.useContext)(x)?.store)throw Error(`Menu.ItemHelpText can only be rendered inside a Menu component`);return(0,We.jsx)(_,{numberOfLines:2,ref:n,...t,className:c(S[`item-help-text`],e)})});try{I.__docgenInfo={description:``,displayName:`ItemHelpText`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/item-help-text.tsx`,methods:[],props:{as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element or React component to render the component as.`,name:`as`,required:!1,tags:{},type:{name:`keyof IntrinsicElements | JSXElementConstructor<any>`}}},tags:{}}}catch{}})))()}var Ge,L;function init_trigger_button(){return(init_trigger_button=e((()=>{g(),r(),init_context(),Ge=n(),L=(0,i.forwardRef)(function UnforwardedTriggerButton({children:e,disabled:t=!1,...n},r){let a=(0,i.useContext)(x);if(!a?.store)throw Error(`Menu.TriggerButton can only be rendered inside a Menu component`);if(a.store.parent)throw Error(`Menu.TriggerButton should not be rendered inside a nested Menu component. Use Menu.SubmenuTriggerItem instead.`);return(0,Ge.jsx)(ae,{ref:r,...n,disabled:t,store:a.store,children:e})});try{L.__docgenInfo={description:``,displayName:`TriggerButton`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/trigger-button.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`}],description:`The contents of the menu trigger button.`,name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`},required:!1,tags:{},type:{name:`ReactNode`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`}],description:`Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.`,name:`render`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`},required:!1,tags:{},type:{name:`ReactElement<unknown, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`}],description:"Determines if the element is disabled. This sets the `aria-disabled`\nattribute accordingly, enabling support for all elements, including those\nthat don't support the native `disabled` attribute.\n\nThis feature can be combined with the `accessibleWhenDisabled` prop to\nmake disabled elements still accessible via keyboard.",name:`disabled`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`},required:!1,tags:{},type:{name:`boolean`}},accessibleWhenDisabled:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`}],description:`Indicates whether the element should be focusable even when it is
\`disabled\`.

This is important when discoverability is a concern. For example:

> A toolbar in an editor contains a set of special smart paste functions
that are disabled when the clipboard is empty or when the function is not
applicable to the current content of the clipboard. It could be helpful to
keep the disabled buttons focusable if the ability to discover their
functionality is primarily via their presence on the toolbar.

Learn more on [Focusability of disabled
controls](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusabilityofdisabledcontrols).`,name:`accessibleWhenDisabled`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`TriggerButtonProps`},required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var R,z;function init_submenu_trigger_item(){return(init_submenu_trigger_item=e((()=>{s(),g(),r(),m(),o(),init_context(),init_item(),v(),init_style_module(),R=n(),z=(0,i.forwardRef)(function UnforwardedSubmenuTriggerItem({suffix:e,...t},n){let r=(0,i.useContext)(x);if(!r?.store.parent)throw Error(`Menu.SubmenuTriggerItem can only be rendered inside a nested Menu component`);return(0,R.jsx)(ae,{ref:n,accessibleWhenDisabled:!0,store:r.store,render:(0,R.jsx)(w,{...t,store:r.store.parent,suffix:(0,R.jsxs)(R.Fragment,{children:[e,(0,R.jsx)(y,{className:c(S[`submenu-chevron-icon`],{[S[`is-rtl`]]:a()}),"aria-hidden":`true`,icon:f,size:24,preserveAspectRatio:`xMidYMid slice`})]})})})});try{z.__docgenInfo={description:``,displayName:`SubmenuTriggerItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/submenu-trigger-item.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:"The contents of the menu item, which could include one instance of the\n`Menu.ItemLabel` component and/or one instance of the `Menu.ItemHelpText`\ncomponent.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!0,tags:{},type:{name:`ReactNode`}},prefix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`The contents of the menu item's prefix, such as an icon.`,name:`prefix`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`ReactNode`}},suffix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`The contents of the menu item's suffix, such as a keyboard shortcut.`,name:`suffix`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`ReactNode`}},hideOnClick:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`Determines if the menu should hide when this item is clicked.

**Note**: This behavior isn't triggered if this menu item is rendered as a
link and modifier keys are used to either open the link in a new tab or
download it.`,name:`hideOnClick`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`BooleanOrCallback<MouseEvent<HTMLElement, MouseEvent>>`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:"Determines if the element is disabled. This sets the `aria-disabled`\nattribute accordingly, enabling support for all elements, including those\nthat don't support the native `disabled` attribute.",name:`disabled`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`boolean`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`Allows the component to be rendered as a different HTML element or React
component. The value can be a React element or a function that takes in the
original component props and gives back a React element with the props
merged.`,name:`render`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`ReactElement<unknown, string | JSXElementConstructor<any>> | RenderProp<HTMLAttributes<any> & { ref?: Ref<any>; }>`}},store:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`}],description:`The ariakit menu store. This prop is only meant for internal use.
@ignore`,name:`store`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`ItemProps`},required:!1,tags:{},type:{name:`MenubarStore | MenuStore<MenuStoreValues>`}}},tags:{}}}catch{}})))()}var B,V;function init_popover(){return(init_popover=e((()=>{s(),re(),se(),r(),init_style_module(),init_context(),B=n(),V=(0,i.forwardRef)(function UnforwardedPopover({gutter:e,shift:t,modal:n=!0,...r},a){let o=(0,i.useContext)(x),s=ie(o?.store,`currentPlacement`)?.split(`-`)[0],l=(0,i.useCallback)(e=>(e.preventDefault(),!0),[]),u=ie(o?.store,`rtl`)?`rtl`:`ltr`,d=(0,i.useMemo)(()=>({dir:u,style:{direction:u}}),[u]);if(!o?.store)throw Error(`Menu.Popover can only be rendered inside a Menu component`);let f=(0,i.useCallback)(e=>(0,B.jsx)(`div`,{className:S[`menu-motion-root`],children:(0,B.jsx)(`div`,{...e,className:c(S[`menu-surface`],e.className,{[S[`is-toolbar`]]:o.variant===`toolbar`})})}),[o.variant]);return(0,B.jsx)(Se,{...r,className:c(S.menu,r.className),ref:a,modal:n,store:o.store,gutter:e??(o.store.parent?0:8),shift:t??(o.store.parent?-4:0),hideOnHoverOutside:!1,"data-side":s,"data-submenu":!!o.store.parent||void 0,wrapperProps:d,hideOnEscape:l,unmountOnHide:!0,render:f})});try{V.__docgenInfo={description:``,displayName:`Popover`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/popover.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`}],description:"The contents of the menu popover, which should include instances of the\n`Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioItem`, `Menu.Group`, and\n`Menu.Separator` components.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`},required:!1,tags:{},type:{name:`ReactNode`}},modal:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`}],description:`The modality of the menu popover. When set to true, interaction with
outside elements will be disabled and only menu content will be visible to
screen readers.

Determines whether the menu popover is modal. Modal dialogs have distinct
states and behaviors:
- The \`portal\` and \`preventBodyScroll\` props are set to \`true\`. They can
  still be manually set to \`false\`.
- When the dialog is open, element tree outside it will be inert.`,name:`modal`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`},required:!1,tags:{},type:{name:`boolean`}},gutter:{defaultValue:{value:`8 for root-level menus, 16 for nested menus`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`}],description:`The distance between the popover and the anchor element.`,name:`gutter`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`},required:!1,tags:{},type:{name:`number`}},shift:{defaultValue:{value:`0 for root-level menus, -8 for nested menus`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`}],description:`The skidding of the popover along the anchor element. Can be set to
negative values to make the popover shift to the opposite side.`,name:`shift`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`},required:!1,tags:{},type:{name:`number`}},hideOnEscape:{defaultValue:{value:"`( event ) => { event.preventDefault(); return true; }`"},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`}],description:`Determines if the menu popover will hide when the user presses the
Escape key.

This prop can be either a boolean or a function that accepts an event as an
argument and returns a boolean. The event object represents the keydown
event that initiated the hide action, which could be either a native
keyboard event or a React synthetic event.`,name:`hideOnEscape`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`PopoverProps`},required:!1,tags:{},type:{name:`BooleanOrCallback<KeyboardEvent | React.KeyboardEvent<Element>>`}}},tags:{}}}catch{}})))()}var Ke,UnconnectedMenu,H;function init_menu(){return(init_menu=e((()=>{ye(),r(),o(),Oe(),Ee(),init_context(),init_item(),init_checkbox_item(),init_radio_item(),init_group(),init_group_label(),init_separator(),init_item_label(),init_item_help_text(),init_trigger_button(),init_submenu_trigger_item(),init_popover(),Ke=n(),UnconnectedMenu=e=>{let{children:t,defaultOpen:n=!1,open:r,onOpenChange:o,placement:s,variant:c}=Te(e,`Menu`),l=(0,i.useContext)(x),u=a(),d=s??(l?.store?`right-start`:`bottom-start`);u&&(/right/.test(d)?d=d.replace(`right`,`left`):/left/.test(d)&&(d=d.replace(`left`,`right`)));let f=pe({parent:l?.store,open:r,defaultOpen:n,placement:d,focusLoop:!0,setOpen(e){o?.(e)},rtl:u}),p=(0,i.useMemo)(()=>({store:f,variant:c}),[f,c]);return(0,Ke.jsx)(x.Provider,{value:p,children:t})},H=Object.assign(we(UnconnectedMenu,`Menu`),{Context:Object.assign(x,{displayName:`Menu.Context`}),Item:Object.assign(w,{displayName:`Menu.Item`}),RadioItem:Object.assign(k,{displayName:`Menu.RadioItem`}),CheckboxItem:Object.assign(E,{displayName:`Menu.CheckboxItem`}),Group:Object.assign(j,{displayName:`Menu.Group`}),GroupLabel:Object.assign(N,{displayName:`Menu.GroupLabel`}),Separator:Object.assign(P,{displayName:`Menu.Separator`}),ItemLabel:Object.assign(F,{displayName:`Menu.ItemLabel`}),ItemHelpText:Object.assign(I,{displayName:`Menu.ItemHelpText`}),Popover:Object.assign(V,{displayName:`Menu.Popover`}),TriggerButton:Object.assign(L,{displayName:`Menu.TriggerButton`}),SubmenuTriggerItem:Object.assign(z,{displayName:`Menu.SubmenuTriggerItem`})});try{H.__docgenInfo={description:"Menu is a collection of React components that combine to render\nARIA-compliant [menu](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) and\n[menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/) patterns.\n\n`Menu` itself is a wrapper component and context provider.\nIt is responsible for managing the state of the menu and its items, and for\nrendering the `Menu.TriggerButton` (or the `Menu.SubmenuTriggerItem`)\ncomponent, and the `Menu.Popover` component.\n\nThis component is deprecated. When building for the Gutenberg repo, use `Menu` from `@wordpress/ui` instead. Otherwise, continue using `DropdownMenu` for now.",displayName:`Menu`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/index.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:"The elements, which should include one instance of the `Menu.TriggerButton`\ncomponent and one instance of the `Menu.Popover` component.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`ReactNode`}},defaultOpen:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:`Whether the menu popover and its contents should be visible by default.

Note: this prop will be overridden by the \`open\` prop if it is
provided (meaning the component will be used in "controlled" mode).`,name:`defaultOpen`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`boolean`}},open:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:`Whether the menu popover and its contents should be visible.
Should be used in conjunction with \`onOpenChange\` in order to control
the open state of the menu popover.

Note: this prop will set the component in "controlled" mode, and it will
override the \`defaultOpen\` prop.`,name:`open`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`boolean`}},onOpenChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:"A callback that gets called when the `open` state changes.",name:`onOpenChange`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`((open: boolean) => void)`}},placement:{defaultValue:{value:`'bottom-start' for root-level menus, 'right-start' for submenus`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:`The placement of the menu popover.`,name:`placement`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`enum`,raw:`Placement`,value:[{value:`"left"`},{value:`"right"`},{value:`"top"`},{value:`"bottom"`},{value:`"left-end"`},{value:`"left-start"`},{value:`"right-end"`},{value:`"right-start"`},{value:`"top-end"`},{value:`"top-start"`},{value:`"bottom-end"`},{value:`"bottom-start"`}]}}},tags:{deprecated:``}}}catch{}try{H.__docgenInfo={description:"Menu is a collection of React components that combine to render\nARIA-compliant [menu](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) and\n[menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/) patterns.\n\n`Menu` itself is a wrapper component and context provider.\nIt is responsible for managing the state of the menu and its items, and for\nrendering the `Menu.TriggerButton` (or the `Menu.SubmenuTriggerItem`)\ncomponent, and the `Menu.Popover` component.\n\nThis component is deprecated. When building for the Gutenberg repo, use `Menu` from `@wordpress/ui` instead. Otherwise, continue using `DropdownMenu` for now.",displayName:`menu`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu/index.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:"The elements, which should include one instance of the `Menu.TriggerButton`\ncomponent and one instance of the `Menu.Popover` component.",name:`children`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`ReactNode`}},defaultOpen:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:`Whether the menu popover and its contents should be visible by default.

Note: this prop will be overridden by the \`open\` prop if it is
provided (meaning the component will be used in "controlled" mode).`,name:`defaultOpen`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`boolean`}},open:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:`Whether the menu popover and its contents should be visible.
Should be used in conjunction with \`onOpenChange\` in order to control
the open state of the menu popover.

Note: this prop will set the component in "controlled" mode, and it will
override the \`defaultOpen\` prop.`,name:`open`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`boolean`}},onOpenChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:"A callback that gets called when the `open` state changes.",name:`onOpenChange`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`((open: boolean) => void)`}},placement:{defaultValue:{value:`'bottom-start' for root-level menus, 'right-start' for submenus`},declarations:[{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`}],description:`The placement of the menu popover.`,name:`placement`,parent:{fileName:`gutenberg/packages/components/src/menu/types.ts`,name:`Props`},required:!1,tags:{},type:{name:`enum`,raw:`Placement`,value:[{value:`"left"`},{value:`"right"`},{value:`"top"`},{value:`"bottom"`},{value:`"left-end"`},{value:`"left-start"`},{value:`"right-end"`},{value:`"right-start"`},{value:`"top-end"`},{value:`"top-start"`},{value:`"bottom-end"`},{value:`"bottom-start"`}]}}},tags:{deprecated:``}}}catch{}})))()}var qe=t({Default:()=>W,InsideModal:()=>$,ToolbarVariant:()=>Q,WithCheckboxes:()=>K,WithModal:()=>J,WithRadios:()=>q,WithSlotFill:()=>X,WithSubmenu:()=>G,default:()=>Ye}),U,Je,Ye,W,G,K,q,J,Y,Slot,Fill,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{m(),r(),init_menu(),v(),Me(),Ie(),Ne(),Ce(),U=n(),{fn:Je}=__STORYBOOK_MODULE_TEST__,Ye={id:`components-menu`,title:`Components/@wordpress-components/Deprecated/Menu`,component:H,subcomponents:{Item:H.Item,CheckboxItem:H.CheckboxItem,Group:H.Group,GroupLabel:H.GroupLabel,Separator:H.Separator,Context:H.Context,RadioItem:H.RadioItem,ItemLabel:H.ItemLabel,ItemHelpText:H.ItemHelpText,TriggerButton:H.TriggerButton,SubmenuTriggerItem:H.SubmenuTriggerItem,Popover:H.Popover},args:{onOpenChange:Je()},argTypes:{children:{control:!1}},tags:[`status-private`],parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`},source:{excludeDecorators:!0}},componentStatus:{status:`not-recommended`,whereUsed:`global`,notes:"Deprecated. When building for the Gutenberg repo, use [`Menu`](?path=/docs/design-system-components-menu--docs) from `@wordpress/ui` instead. Otherwise, continue using `DropdownMenu` for now."}}},W={args:{children:(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Label`})}),(0,U.jsxs)(H.Item,{children:[(0,U.jsx)(H.ItemLabel,{children:`Label`}),(0,U.jsx)(H.ItemHelpText,{children:`Help text`})]}),(0,U.jsxs)(H.Item,{children:[(0,U.jsx)(H.ItemLabel,{children:`Label`}),(0,U.jsx)(H.ItemHelpText,{children:`The menu item help text is automatically truncated when there are more than two lines of text`})]}),(0,U.jsxs)(H.Item,{hideOnClick:!1,children:[(0,U.jsx)(H.ItemLabel,{children:`Label`}),(0,U.jsx)(H.ItemHelpText,{children:`This item doesn't close the menu on click`})]}),(0,U.jsx)(H.Item,{disabled:!0,children:`Disabled item`}),(0,U.jsx)(H.Separator,{}),(0,U.jsxs)(H.Group,{children:[(0,U.jsx)(H.GroupLabel,{children:`Group label`}),(0,U.jsx)(H.Item,{prefix:(0,U.jsx)(y,{icon:te,size:24}),children:(0,U.jsx)(H.ItemLabel,{children:`With prefix`})}),(0,U.jsx)(H.Item,{suffix:`⌘S`,children:`With suffix`}),(0,U.jsxs)(H.Item,{disabled:!0,prefix:(0,U.jsx)(y,{icon:ne,size:24}),suffix:`⌥⌘T`,children:[(0,U.jsx)(H.ItemLabel,{children:`Disabled with prefix and suffix`}),(0,U.jsx)(H.ItemHelpText,{children:`And help text`})]})]})]})]})}},G={args:{...W.args,children:(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsx)(H.Item,{children:`Level 1 item`}),(0,U.jsxs)(H,{children:[(0,U.jsx)(H.SubmenuTriggerItem,{suffix:`Suffix`,children:(0,U.jsx)(H.ItemLabel,{children:`Submenu trigger item with a long label`})}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 2 item`})}),(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 2 item`})}),(0,U.jsxs)(H,{children:[(0,U.jsx)(H.SubmenuTriggerItem,{children:(0,U.jsx)(H.ItemLabel,{children:`Submenu trigger`})}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 3 item`})}),(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 3 item`})})]})]})]})]})]})]})}},K={render:function WithCheckboxesRender(e){let[t,n]=(0,i.useState)(!1),[r,a]=(0,i.useState)(!0),[o,s]=(0,i.useState)([`b`]),onMultipleCheckboxesCheckedChange=e=>{s(t=>t.includes(e.target.value)?t.filter(t=>t!==e.target.value):[...t,e.target.value])};return(0,U.jsxs)(H,{...e,children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsxs)(H.Group,{children:[(0,U.jsx)(H.GroupLabel,{children:`Single selection, uncontrolled`}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-individual-uncontrolled-a`,value:`a`,suffix:`⌥⌘T`,children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item A`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially unchecked`})]}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-individual-uncontrolled-b`,value:`b`,defaultChecked:!0,children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item B`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially checked`})]})]}),(0,U.jsx)(H.Separator,{}),(0,U.jsxs)(H.Group,{children:[(0,U.jsx)(H.GroupLabel,{children:`Single selection, controlled`}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-individual-controlled-a`,value:`a`,checked:t,onChange:e=>{n(e.target.checked)},children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item A`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially unchecked`})]}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-individual-controlled-b`,value:`b`,checked:r,onChange:e=>a(e.target.checked),children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item B`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially checked`})]})]}),(0,U.jsx)(H.Separator,{}),(0,U.jsxs)(H.Group,{children:[(0,U.jsx)(H.GroupLabel,{children:`Multiple selection, uncontrolled`}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-multiple-uncontrolled`,value:`a`,children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item A`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially unchecked`})]}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-multiple-uncontrolled`,value:`b`,defaultChecked:!0,children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item B`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially checked`})]})]}),(0,U.jsx)(H.Separator,{}),(0,U.jsxs)(H.Group,{children:[(0,U.jsx)(H.GroupLabel,{children:`Multiple selection, controlled`}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-multiple-controlled`,value:`a`,checked:o.includes(`a`),onChange:onMultipleCheckboxesCheckedChange,children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item A`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially unchecked`})]}),(0,U.jsxs)(H.CheckboxItem,{name:`checkbox-multiple-controlled`,value:`b`,checked:o.includes(`b`),onChange:onMultipleCheckboxesCheckedChange,children:[(0,U.jsx)(H.ItemLabel,{children:`Checkbox item B`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially checked`})]})]})]})]})},args:{...W.args}},q={render:function WithRadiosRender(e){let[t,n]=(0,i.useState)(`two`),onRadioChange=e=>n(e.target.value);return(0,U.jsxs)(H,{...e,children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsxs)(H.Group,{children:[(0,U.jsx)(H.GroupLabel,{children:`Uncontrolled`}),(0,U.jsxs)(H.RadioItem,{name:`radio-uncontrolled`,value:`one`,children:[(0,U.jsx)(H.ItemLabel,{children:`Radio item 1`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially unchecked`})]}),(0,U.jsxs)(H.RadioItem,{name:`radio-uncontrolled`,value:`two`,defaultChecked:!0,children:[(0,U.jsx)(H.ItemLabel,{children:`Radio item 2`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially checked`})]})]}),(0,U.jsx)(H.Separator,{}),(0,U.jsxs)(H.Group,{children:[(0,U.jsx)(H.GroupLabel,{children:`Controlled`}),(0,U.jsxs)(H.RadioItem,{name:`radio-controlled`,value:`one`,checked:t===`one`,onChange:onRadioChange,children:[(0,U.jsx)(H.ItemLabel,{children:`Radio item 1`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially unchecked`})]}),(0,U.jsxs)(H.RadioItem,{name:`radio-controlled`,value:`two`,checked:t===`two`,onChange:onRadioChange,children:[(0,U.jsx)(H.ItemLabel,{children:`Radio item 2`}),(0,U.jsx)(H.ItemHelpText,{children:`Initially checked`})]})]})]})]})},args:{...W.args}},J={render:function WithModalRender(e){let[t,n]=(0,i.useState)(!1);return(0,U.jsxs)(U.Fragment,{children:[(0,U.jsxs)(H,{...e,children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsx)(H.Popover,{children:(0,U.jsx)(H.Item,{onClick:()=>n(!0),children:(0,U.jsx)(H.ItemLabel,{children:`Open modal`})})})]}),t&&(0,U.jsxs)(Le,{onRequestClose:()=>n(!1),children:[`Modal's contents`,(0,U.jsx)(`button`,{onClick:()=>n(!1),children:`Close`})]})]})},args:{...W.args}},Y=Pe(`Example`),Slot=()=>{let e=(0,i.useContext)(H.Context),t=(0,i.useMemo)(()=>({forwardedContext:[[H.Context.Provider,{value:e}]]}),[e]);return(0,U.jsx)(Y.Slot,{fillProps:t,bubblesVirtually:!0,style:{display:`contents`}})},Fill=({children:e})=>{let t=(0,U.jsx)(U.Fragment,{children:e});return(0,U.jsx)(Y.Fill,{children:e=>{let{forwardedContext:n=[]}=e;return n.reduce((e,[t,n])=>(0,U.jsx)(t,{...n,children:e}),t)}})},X={render:e=>(0,U.jsxs)(Fe,{children:[(0,U.jsxs)(H,{...e,children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Item`})}),(0,U.jsx)(Slot,{})]})]}),(0,U.jsxs)(Fill,{children:[(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Item from fill`})}),(0,U.jsxs)(H,{children:[(0,U.jsx)(H.SubmenuTriggerItem,{children:(0,U.jsx)(H.ItemLabel,{children:`Submenu from fill`})}),(0,U.jsx)(H.Popover,{children:(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Submenu item from fill`})})})]})]})]}),args:{...W.args}},Z={Menu:{variant:`toolbar`}},Q={render:e=>(0,U.jsx)(De,{value:Z,children:(0,U.jsxs)(H,{...e,children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 1 item`})}),(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 1 item`})}),(0,U.jsx)(H.Separator,{}),(0,U.jsxs)(H,{children:[(0,U.jsx)(H.SubmenuTriggerItem,{children:(0,U.jsx)(H.ItemLabel,{children:`Submenu trigger`})}),(0,U.jsx)(H.Popover,{children:(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 2 item`})})})]})]})]})}),args:{...W.args}},$={render:function InsideModalRender(e){let[t,n]=(0,i.useState)(!1);return(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)(b,{onClick:()=>n(!0),__next40pxDefaultSize:!0,variant:`secondary`,children:`Open modal`}),t&&(0,U.jsxs)(Le,{onRequestClose:()=>n(!1),title:`Menu inside modal`,children:[(0,U.jsxs)(H,{...e,children:[(0,U.jsx)(H.TriggerButton,{render:(0,U.jsx)(b,{__next40pxDefaultSize:!0,variant:`secondary`}),children:`Open menu`}),(0,U.jsxs)(H.Popover,{children:[(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 1 item`})}),(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 1 item`})}),(0,U.jsx)(H.Separator,{}),(0,U.jsxs)(H,{children:[(0,U.jsx)(H.SubmenuTriggerItem,{children:(0,U.jsx)(H.ItemLabel,{children:`Submenu trigger`})}),(0,U.jsx)(H.Popover,{children:(0,U.jsx)(H.Item,{children:(0,U.jsx)(H.ItemLabel,{children:`Level 2 item`})})})]})]})]}),(0,U.jsx)(b,{__next40pxDefaultSize:!0,onClick:()=>n(!1),children:`Close modal`})]})]})},args:{...W.args},parameters:{docs:{source:{type:`code`}}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    children: <>
                <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                    Open menu
                </Menu.TriggerButton>
                <Menu.Popover>
                    <Menu.Item>
                        <Menu.ItemLabel>Label</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.ItemLabel>Label</Menu.ItemLabel>
                        <Menu.ItemHelpText>Help text</Menu.ItemHelpText>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.ItemLabel>Label</Menu.ItemLabel>
                        <Menu.ItemHelpText>
                            The menu item help text is automatically truncated
                            when there are more than two lines of text
                        </Menu.ItemHelpText>
                    </Menu.Item>
                    <Menu.Item hideOnClick={false}>
                        <Menu.ItemLabel>Label</Menu.ItemLabel>
                        <Menu.ItemHelpText>
                            This item doesn&apos;t close the menu on click
                        </Menu.ItemHelpText>
                    </Menu.Item>
                    <Menu.Item disabled>Disabled item</Menu.Item>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Group label</Menu.GroupLabel>
                        <Menu.Item prefix={<Icon icon={customLink} size={24} />}>
                            <Menu.ItemLabel>With prefix</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item suffix="⌘S">With suffix</Menu.Item>
                        <Menu.Item disabled prefix={<Icon icon={formatCapitalize} size={24} />} suffix="⌥⌘T">
                            <Menu.ItemLabel>
                                Disabled with prefix and suffix
                            </Menu.ItemLabel>
                            <Menu.ItemHelpText>And help text</Menu.ItemHelpText>
                        </Menu.Item>
                    </Menu.Group>
                </Menu.Popover>
            </>
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    children: <>
                <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                    Open menu
                </Menu.TriggerButton>
                <Menu.Popover>
                    <Menu.Item>Level 1 item</Menu.Item>
                    <Menu>
                        <Menu.SubmenuTriggerItem suffix="Suffix">
                            <Menu.ItemLabel>
                                Submenu trigger item with a long label
                            </Menu.ItemLabel>
                        </Menu.SubmenuTriggerItem>
                        <Menu.Popover>
                            <Menu.Item>
                                <Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
                            </Menu.Item>
                            <Menu.Item>
                                <Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
                            </Menu.Item>
                            <Menu>
                                <Menu.SubmenuTriggerItem>
                                    <Menu.ItemLabel>
                                        Submenu trigger
                                    </Menu.ItemLabel>
                                </Menu.SubmenuTriggerItem>
                                <Menu.Popover>
                                    <Menu.Item>
                                        <Menu.ItemLabel>
                                            Level 3 item
                                        </Menu.ItemLabel>
                                    </Menu.Item>
                                    <Menu.Item>
                                        <Menu.ItemLabel>
                                            Level 3 item
                                        </Menu.ItemLabel>
                                    </Menu.Item>
                                </Menu.Popover>
                            </Menu>
                        </Menu.Popover>
                    </Menu>
                </Menu.Popover>
            </>
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  render: function WithCheckboxesRender(props: Props) {
    const [isAChecked, setAChecked] = useState(false);
    const [isBChecked, setBChecked] = useState(true);
    const [multipleCheckboxesValue, setMultipleCheckboxesValue] = useState<string[]>(['b']);
    const onMultipleCheckboxesCheckedChange: React.ComponentProps<typeof Menu.CheckboxItem>['onChange'] = e => {
      setMultipleCheckboxesValue(prevValues => {
        if (prevValues.includes(e.target.value)) {
          return prevValues.filter(val => val !== e.target.value);
        }
        return [...prevValues, e.target.value];
      });
    };
    return <Menu {...props}>
                <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                    Open menu
                </Menu.TriggerButton>
                <Menu.Popover>
                    <Menu.Group>
                        <Menu.GroupLabel>
                            Single selection, uncontrolled
                        </Menu.GroupLabel>
                        <Menu.CheckboxItem name="checkbox-individual-uncontrolled-a" value="a" suffix="⌥⌘T">
                            <Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially unchecked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem name="checkbox-individual-uncontrolled-b" value="b" defaultChecked>
                            <Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially checked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>
                            Single selection, controlled
                        </Menu.GroupLabel>
                        <Menu.CheckboxItem name="checkbox-individual-controlled-a" value="a" checked={isAChecked} onChange={e => {
            setAChecked(e.target.checked);
          }}>
                            <Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially unchecked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem name="checkbox-individual-controlled-b" value="b" checked={isBChecked} onChange={e => setBChecked(e.target.checked)}>
                            <Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially checked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>
                            Multiple selection, uncontrolled
                        </Menu.GroupLabel>
                        <Menu.CheckboxItem name="checkbox-multiple-uncontrolled" value="a">
                            <Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially unchecked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem name="checkbox-multiple-uncontrolled" value="b" defaultChecked>
                            <Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially checked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>
                            Multiple selection, controlled
                        </Menu.GroupLabel>
                        <Menu.CheckboxItem name="checkbox-multiple-controlled" value="a" checked={multipleCheckboxesValue.includes('a')} onChange={onMultipleCheckboxesCheckedChange}>
                            <Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially unchecked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem name="checkbox-multiple-controlled" value="b" checked={multipleCheckboxesValue.includes('b')} onChange={onMultipleCheckboxesCheckedChange}>
                            <Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially checked
                            </Menu.ItemHelpText>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                </Menu.Popover>
            </Menu>;
  },
  args: {
    ...Default.args
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  render: function WithRadiosRender(props: Props) {
    const [radioValue, setRadioValue] = useState('two');
    const onRadioChange: React.ComponentProps<typeof Menu.RadioItem>['onChange'] = e => setRadioValue(e.target.value);
    return <Menu {...props}>
                <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                    Open menu
                </Menu.TriggerButton>
                <Menu.Popover>
                    <Menu.Group>
                        <Menu.GroupLabel>Uncontrolled</Menu.GroupLabel>
                        <Menu.RadioItem name="radio-uncontrolled" value="one">
                            <Menu.ItemLabel>Radio item 1</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially unchecked
                            </Menu.ItemHelpText>
                        </Menu.RadioItem>
                        <Menu.RadioItem name="radio-uncontrolled" value="two" defaultChecked>
                            <Menu.ItemLabel>Radio item 2</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially checked
                            </Menu.ItemHelpText>
                        </Menu.RadioItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Controlled</Menu.GroupLabel>
                        <Menu.RadioItem name="radio-controlled" value="one" checked={radioValue === 'one'} onChange={onRadioChange}>
                            <Menu.ItemLabel>Radio item 1</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially unchecked
                            </Menu.ItemHelpText>
                        </Menu.RadioItem>
                        <Menu.RadioItem name="radio-controlled" value="two" checked={radioValue === 'two'} onChange={onRadioChange}>
                            <Menu.ItemLabel>Radio item 2</Menu.ItemLabel>
                            <Menu.ItemHelpText>
                                Initially checked
                            </Menu.ItemHelpText>
                        </Menu.RadioItem>
                    </Menu.Group>
                </Menu.Popover>
            </Menu>;
  },
  args: {
    ...Default.args
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  render: function WithModalRender(props: Props) {
    const [isModalOpen, setModalOpen] = useState(false);
    return <>
                <Menu {...props}>
                    <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                        Open menu
                    </Menu.TriggerButton>
                    <Menu.Popover>
                        <Menu.Item onClick={() => setModalOpen(true)}>
                            <Menu.ItemLabel>Open modal</Menu.ItemLabel>
                        </Menu.Item>
                    </Menu.Popover>
                </Menu>
                {isModalOpen && <Modal onRequestClose={() => setModalOpen(false)}>
                        Modal&apos;s contents
                        <button onClick={() => setModalOpen(false)}>
                            Close
                        </button>
                    </Modal>}
            </>;
  },
  args: {
    ...Default.args
  }
}`,...J.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  render: (props: Props) => {
    return <SlotFillProvider>
                <Menu {...props}>
                    <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                        Open menu
                    </Menu.TriggerButton>
                    <Menu.Popover>
                        <Menu.Item>
                            <Menu.ItemLabel>Item</Menu.ItemLabel>
                        </Menu.Item>
                        <Slot />
                    </Menu.Popover>
                </Menu>

                <Fill>
                    <Menu.Item>
                        <Menu.ItemLabel>Item from fill</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu>
                        <Menu.SubmenuTriggerItem>
                            <Menu.ItemLabel>Submenu from fill</Menu.ItemLabel>
                        </Menu.SubmenuTriggerItem>
                        <Menu.Popover>
                            <Menu.Item>
                                <Menu.ItemLabel>
                                    Submenu item from fill
                                </Menu.ItemLabel>
                            </Menu.Item>
                        </Menu.Popover>
                    </Menu>
                </Fill>
            </SlotFillProvider>;
  },
  args: {
    ...Default.args
  }
}`,...X.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  render: (props: Props) =>
  // TODO: add toolbar
  <ContextSystemProvider value={toolbarVariantContextValue}>
            <Menu {...props}>
                <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                    Open menu
                </Menu.TriggerButton>
                <Menu.Popover>
                    <Menu.Item>
                        <Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu>
                        <Menu.SubmenuTriggerItem>
                            <Menu.ItemLabel>Submenu trigger</Menu.ItemLabel>
                        </Menu.SubmenuTriggerItem>
                        <Menu.Popover>
                            <Menu.Item>
                                <Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
                            </Menu.Item>
                        </Menu.Popover>
                    </Menu>
                </Menu.Popover>
            </Menu>
        </ContextSystemProvider>,
  args: {
    ...Default.args
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: function InsideModalRender(props: Props) {
    const [isModalOpen, setModalOpen] = useState(false);
    return <>
                <Button onClick={() => setModalOpen(true)} __next40pxDefaultSize variant="secondary">
                    Open modal
                </Button>
                {isModalOpen && <Modal onRequestClose={() => setModalOpen(false)} title="Menu inside modal">
                        <Menu {...props}>
                            <Menu.TriggerButton render={<Button __next40pxDefaultSize variant="secondary" />}>
                                Open menu
                            </Menu.TriggerButton>
                            <Menu.Popover>
                                <Menu.Item>
                                    <Menu.ItemLabel>
                                        Level 1 item
                                    </Menu.ItemLabel>
                                </Menu.Item>
                                <Menu.Item>
                                    <Menu.ItemLabel>
                                        Level 1 item
                                    </Menu.ItemLabel>
                                </Menu.Item>
                                <Menu.Separator />
                                <Menu>
                                    <Menu.SubmenuTriggerItem>
                                        <Menu.ItemLabel>
                                            Submenu trigger
                                        </Menu.ItemLabel>
                                    </Menu.SubmenuTriggerItem>
                                    <Menu.Popover>
                                        <Menu.Item>
                                            <Menu.ItemLabel>
                                                Level 2 item
                                            </Menu.ItemLabel>
                                        </Menu.Item>
                                    </Menu.Popover>
                                </Menu>
                            </Menu.Popover>
                        </Menu>
                        <Button __next40pxDefaultSize onClick={() => setModalOpen(false)}>
                            Close modal
                        </Button>
                    </Modal>}
            </>;
  },
  args: {
    ...Default.args
  },
  parameters: {
    docs: {
      source: {
        type: 'code'
      }
    }
  }
}`,...$.parameters?.docs?.source}}}})))()}export{init_index_story as n,qe as t};