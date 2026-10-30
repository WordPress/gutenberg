import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-merge-refs-BNmiIksj.js";import{n as o,r as s,s as c,t as l}from"./build-module-CI6dFhun.js";import{a as u,i as ee}from"./iframe-BbJPeSVw.js";import{i as d,n as f,r as p,t as te}from"./MenuSubmenuTrigger-CsZ8OkVC.js";import{Bi as m,Cl as h,Dc as ne,Dl as g,Vs as _,_l as v,fn as re,gi as ie,n as ae,ro as oe,yl as se}from"./build-module-DttIWYbV.js";import{n as ce,t as le}from"./resets.module-D-U9cA9i.js";import{n as ue,t as de}from"./global-css-defense.module-BCx5sFzT.js";import{n as fe,t as pe}from"./icon-Caw5EMeD.js";import{C as me,E as y,S as b,T as he,_ as x,a as S,b as ge,c as _e,d as C,f as ve,g as ye,h as w,i as be,l as T,m as xe,n as Se,o as Ce,p as E,r as D,s as O,t as k,u as we,v as Te,x as Ee,y as De}from"./trigger-DSZAbldm.js";import{a as A,c as Oe,d as j,f as ke,i as Ae,l as M,m as je,n as Me,o as Ne,p as N,r as P,s as F,t as I,u as Pe}from"./separator-DWP85mIx.js";import{n as Fe,t as L}from"./link-item-C50KW0xq.js";function SubmenuRoot(e){let t=(0,r.useRef)(null);return(0,R.jsx)(De.Provider,{value:{isSubmenu:!0,submenuTriggerRef:t},children:(0,R.jsx)(ge.Provider,{value:null,children:(0,R.jsx)(p,{...e})})})}var R;function init_submenu_root(){return(init_submenu_root=e((()=>{d(),n(),b(),R=t();try{SubmenuRoot.__docgenInfo={description:`Groups all parts of a nested submenu.`,displayName:`SubmenuRoot`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/menu/submenu-root.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`SubmenuRootProps`}],description:"The submenu subcomponents (`Menu.SubmenuTrigger`, `Menu.Popup`, etc.).",name:`children`,parent:{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`SubmenuRootProps`},required:!1,tags:{},type:{name:`ReactNode`}},highlightItemOnHover:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`}],description:"Whether moving the pointer over items should highlight them.\nDisabling this prop allows CSS `:hover` to be differentiated from the `:focus` (`data-highlighted`) state.",name:`highlightItemOnHover`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`},required:!1,tags:{},type:{name:`boolean`}},actionsRef:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`}],description:"A ref to imperative actions.\n- `unmount`: Ends the closing phase of the menu after an externally controlled closing animation finishes.\n  Call `preventUnmountOnClose()` in `onOpenChange` first, otherwise the menu completes closing on its own.\n  Whether it leaves the DOM is decided by `keepMounted` on the portal.\n- `close`: Closes the menu imperatively when called.",name:`actionsRef`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`},required:!1,tags:{},type:{name:`RefObject<MenuRootActions | null>`}},onOpenChange:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-root/MenuSubmenuRoot.d.mts`,name:`MenuSubmenuRootProps`}],description:`Event handler called when the menu is opened or closed.`,name:`onOpenChange`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-root/MenuSubmenuRoot.d.mts`,name:`MenuSubmenuRootProps`},required:!1,tags:{},type:{name:`((open: boolean, eventDetails: MenuRootChangeEventDetails) => void)`}},defaultOpen:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`}],description:`Whether the menu is initially open.

To render a controlled menu, use the \`open\` prop instead.`,name:`defaultOpen`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`},required:!1,tags:{},type:{name:`boolean`}},open:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`}],description:`Whether the menu is currently open.`,name:`open`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`},required:!1,tags:{},type:{name:`boolean`}},onOpenChangeComplete:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`}],description:`Event handler called after any animations complete when the menu is opened or closed.`,name:`onOpenChangeComplete`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`},required:!1,tags:{},type:{name:`((open: boolean) => void)`}},loopFocus:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`}],description:`Whether to loop keyboard focus back to the first item
when the end of the list is reached while using the arrow keys.`,name:`loopFocus`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/root/MenuRoot.d.mts`,name:`MenuRootProps`},required:!1,tags:{},type:{name:`boolean`}},closeParentOnEsc:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-root/MenuSubmenuRoot.d.mts`,name:`MenuSubmenuRootProps`}],description:`When in a submenu, determines whether pressing the Escape key
closes the entire menu, or only the current child menu.`,name:`closeParentOnEsc`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-root/MenuSubmenuRoot.d.mts`,name:`MenuSubmenuRootProps`},required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var z,B;function init_submenu_trigger(){return(init_submenu_trigger=e((()=>{f(),u(),n(),a(),ae(),fe(),ue(),le(),he(),b(),E(),z=t(),B=(0,r.forwardRef)(function MenuSubmenuTrigger$1({children:e,className:t,prefix:n,shortcut:r,suffix:a,"aria-describedby":o,"aria-keyshortcuts":s,"aria-label":c,"aria-labelledby":l,...u},d){let{submenuTriggerRef:f}=me(),p=i([d,f??null]),{contentChildren:m,contentContextValue:h,itemAriaProps:g,shortcutDescriptionId:_}=xe(e,{"aria-describedby":o,"aria-keyshortcuts":s,"aria-label":c,"aria-labelledby":l,shortcut:r});return(0,z.jsx)(te,{ref:p,...g,className:ee(de.div,ce[`box-sizing`],y.item,t),...u,children:(0,z.jsx)(Ee.Provider,{value:h,children:(0,z.jsx)(ve,{prefix:n,shortcut:r,shortcutDescriptionId:_,suffix:a,trailing:(0,z.jsx)(pe,{className:y[`submenu-chevron`],icon:ne,size:24,"aria-hidden":`true`}),children:m})})})});try{B.__docgenInfo={description:`Renders a menu item that opens a submenu.`,displayName:`SubmenuTrigger`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/menu/submenu-trigger.tsx`,methods:[],props:{disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`}],description:`Whether the component should ignore user interaction.`,name:`disabled`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`},required:!1,tags:{},type:{name:`boolean`}},render:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`Replaces the component's default HTML element using a given React
element, or a function that returns a React element.`,name:`render`,required:!1,tags:{},type:{name:`ComponentRenderFn<HTMLAttributesWithRef<any>> | ReactElement<Record<string, unknown>, string | JSXElementConstructor<any>>`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS class name to apply to the element.`,name:`className`,required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/utils/types.ts`,name:`TypeLiteral`}],description:`CSS style to apply to the element.`,name:`style`,required:!1,tags:{},type:{name:`CSSProperties`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`}],description:`Overrides the text used for keyboard text navigation and filtering.
Falls back to the rendered text when not provided.`,name:`label`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`},required:!1,tags:{},type:{name:`string`}},id:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`}],description:`@ignore`,name:`id`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`},required:!1,tags:{},type:{name:`string`}},onClick:{defaultValue:null,declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`}],description:``,name:`onClick`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`},required:!1,tags:{},type:{name:`((event: BaseUIEvent<MouseEvent<HTMLDivElement, MouseEvent>>) => void)`}},nativeButton:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NonNativeButtonProps`}],description:"Whether the component renders a native `<button>` element when replacing it\nvia the `render` prop.\nSet to `true` if the rendered element is a native button.",name:`nativeButton`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/internals/types.d.mts`,name:`NonNativeButtonProps`},required:!1,tags:{},type:{name:`boolean`}},delay:{defaultValue:{value:`100`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`}],description:`How long to wait before the menu may be opened on hover. Specified in milliseconds.

Requires the \`openOnHover\` prop.`,name:`delay`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`},required:!1,tags:{},type:{name:`number`}},closeDelay:{defaultValue:{value:`0`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`}],description:`How long to wait before closing the menu that was opened on hover.
Specified in milliseconds.

Requires the \`openOnHover\` prop.`,name:`closeDelay`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`},required:!1,tags:{},type:{name:`number`}},openOnHover:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`}],description:`Whether the menu should also open when the trigger is hovered.`,name:`openOnHover`,parent:{fileName:`gutenberg/node_modules/.store/@base-ui/react@1.9.0-uHNeM94OdjIeOtpyYGvL0A/node_modules/@base-ui/react/menu/submenu-trigger/MenuSubmenuTrigger.d.mts`,name:`MenuSubmenuTriggerProps`},required:!1,tags:{},type:{name:`boolean`}},prefix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`MenuItemLayoutProps`}],description:`Presentational content before the item label. Use \`Menu.PrefixIcon\` for
icons that help users recognize actions or give a key action useful
prominence.

Prefer icons on every item in a group, or none. If only one item needs an
icon, reconsider its grouping. Prefer omitting it over adding unnecessary
icons to the other items. Mixed icon usage is supported. Avoid combining
a prefix icon and a description in the same item.`,name:`prefix`,parent:{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`MenuItemLayoutProps`},required:!1,tags:{},type:{name:`ReactNode`}},suffix:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`MenuItemLayoutProps`}],description:`Presentational content displayed after the item label.`,name:`suffix`,parent:{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`MenuItemLayoutProps`},required:!1,tags:{},type:{name:`ReactNode`}},shortcut:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`MenuItemLayoutProps`}],description:`The keyboard shortcut associated with this item. When provided, the
shortcut is displayed in the item and announced to assistive technology.

**Note**: This prop is for display and accessibility purposes only; the
consumer is responsible for implementing the actual keyboard event handler.`,name:`shortcut`,parent:{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`MenuItemLayoutProps`},required:!1,tags:{},type:{name:`KeyboardShortcut`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/ui/src/menu/types.ts`,name:`TypeLiteral`}],description:"One direct `Menu.ItemLabel`, followed by zero or more direct\n`Menu.ItemDescription` components.",name:`children`,required:!0,tags:{},type:{name:`MenuItemChildren`}}},tags:{}}}catch{}})))()}var V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{n(),ae(),s(),be(),Se(),we(),_e(),Ce(),E(),ye(),Te(),Oe(),Fe(),je(),Ne(),Ae(),ke(),Pe(),Me(),init_submenu_root(),init_submenu_trigger(),V=t(),H={title:`Components/@wordpress-ui/Menu`,id:`design-system-components-menu`,component:D,subcomponents:{"Menu.Trigger":k,"Menu.Portal":T,"Menu.Positioner":O,"Menu.Popup":S,"Menu.Item":C,"Menu.ItemLabel":w,"Menu.ItemDescription":x,"Menu.PrefixIcon":F,"Menu.LinkItem":L,"Menu.CheckboxItem":N,"Menu.RadioGroup":A,"Menu.RadioItem":P,"Menu.Group":j,"Menu.GroupLabel":M,"Menu.Separator":I,"Menu.SubmenuRoot":SubmenuRoot,"Menu.SubmenuTrigger":B},argTypes:{children:{control:!1}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"Not yet recommended while the APIs are still in flux, early Gutenberg migrations are being evaluated, and compatibility with overlays from `@wordpress/components` remains under review. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135)."}}},U={comfortableDensity:{displayShortcut:o.primary(`2`),ariaKeyShortcut:l.primary(`2`),label:c.primary(`2`)},developerResources:{displayShortcut:o.primary(`d`),ariaKeyShortcut:l.primary(`d`),label:c.primary(`d`)},downloads:{displayShortcut:o.primary(`d`),ariaKeyShortcut:l.primary(`d`),label:c.primary(`d`)},move:{displayShortcut:o.primary(`m`),ariaKeyShortcut:l.primary(`m`),label:c.primary(`m`)},save:{displayShortcut:o.primary(`s`),ariaKeyShortcut:l.primary(`s`),label:c.primary(`s`)},shared:{displayShortcut:o.primaryShift(`s`),ariaKeyShortcut:l.primaryShift(`s`),label:c.primaryShift(`s`)}},W={render:function Render(){let[e,t]=(0,r.useState)(!0),[n,i]=(0,r.useState)(!1),[a,o]=(0,r.useState)(`list`);return(0,V.jsxs)(D,{children:[(0,V.jsx)(k,{children:`Open menu`}),(0,V.jsxs)(S,{children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Rename…`})}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Archive`})}),(0,V.jsx)(C,{shortcut:U.save,suffix:`Draft`,children:(0,V.jsx)(w,{children:`Save`})}),(0,V.jsx)(I,{}),(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`Links`}),(0,V.jsx)(L,{href:`#menu-default-example`,children:(0,V.jsx)(w,{children:`View details`})}),(0,V.jsx)(L,{href:`https://wordpress.org`,openInNewTab:!0,children:(0,V.jsx)(w,{children:`WordPress.org`})})]}),(0,V.jsx)(I,{}),(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`Visible columns`}),(0,V.jsx)(N,{checked:e,onCheckedChange:t,children:(0,V.jsx)(w,{children:`Bookmarks`})}),(0,V.jsx)(N,{checked:n,onCheckedChange:i,shortcut:U.downloads,children:(0,V.jsx)(w,{children:`Downloads`})})]}),(0,V.jsx)(I,{}),(0,V.jsxs)(A,{value:a,onValueChange:o,children:[(0,V.jsx)(M,{children:`View`}),(0,V.jsx)(P,{value:`list`,prefix:(0,V.jsx)(F,{icon:m}),children:(0,V.jsx)(w,{children:`List`})}),(0,V.jsx)(P,{value:`grid`,prefix:(0,V.jsx)(F,{icon:oe}),children:(0,V.jsx)(w,{children:`Grid`})})]}),(0,V.jsx)(I,{}),(0,V.jsxs)(j,{"aria-label":`More actions`,children:[(0,V.jsxs)(SubmenuRoot,{children:[(0,V.jsx)(B,{shortcut:U.move,suffix:`3`,children:(0,V.jsx)(w,{children:`Move to`})}),(0,V.jsxs)(S,{children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Favorites`})}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Archive`})}),(0,V.jsxs)(SubmenuRoot,{children:[(0,V.jsx)(B,{children:(0,V.jsx)(w,{children:`More destinations`})}),(0,V.jsxs)(S,{children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Reviewed`})}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Shared`})})]})]})]})]}),(0,V.jsx)(C,{disabled:!0,children:(0,V.jsx)(w,{children:`Unavailable action`})})]})]})]})}},G={args:{children:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(k,{children:`Open menu`}),(0,V.jsxs)(S,{children:[(0,V.jsx)(L,{href:`https://wordpress.org`,openInNewTab:!0,children:(0,V.jsx)(w,{children:`WordPress.org`})}),(0,V.jsx)(L,{href:`https://developer.wordpress.org`,openInNewTab:!0,target:`wordpress-developer-resources`,shortcut:U.developerResources,suffix:`Docs`,children:(0,V.jsx)(w,{children:`WordPress developer resources`})}),(0,V.jsx)(L,{href:`#menu-link-item-example`,children:(0,V.jsx)(w,{children:`In-page destination`})})]})]})}},K={args:{children:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(k,{children:`Open menu`}),(0,V.jsxs)(S,{children:[(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`File`}),(0,V.jsx)(C,{shortcut:U.save,suffix:`Modified`,children:(0,V.jsx)(w,{children:`Save`})}),(0,V.jsx)(C,{disabled:!0,shortcut:U.downloads,children:(0,V.jsx)(w,{children:`Download`})}),(0,V.jsxs)(C,{children:[(0,V.jsx)(w,{children:`Delete…`}),(0,V.jsx)(x,{children:`Also deletes all versions of this item.`})]})]}),(0,V.jsx)(I,{}),(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`Organize`}),(0,V.jsx)(C,{prefix:(0,V.jsx)(F,{icon:_}),children:(0,V.jsx)(w,{children:`Duplicate`})}),(0,V.jsx)(C,{prefix:(0,V.jsx)(F,{icon:v}),children:(0,V.jsx)(w,{children:`Archive`})})]})]})]})}},q={parameters:{docs:{description:{story:`Uses long text to demonstrate wrapping and disabled items. Keep product menu labels short and descriptions rare.`}}},args:{children:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(k,{children:`Open menu`}),(0,V.jsxs)(S,{style:{width:240},children:[(0,V.jsxs)(C,{shortcut:U.save,suffix:`Modified`,children:[(0,V.jsx)(w,{children:`A long menu item label that wraps onto multiple lines`}),(0,V.jsx)(x,{children:`This deliberately long description should wrap below the label without overlapping the suffix or shortcut.`})]}),(0,V.jsxs)(C,{disabled:!0,shortcut:U.downloads,children:[(0,V.jsx)(w,{children:`A disabled item with a long label that wraps onto multiple lines`}),(0,V.jsx)(x,{children:`The disabled foreground treatment should apply to the label, description, and shortcut.`})]})]})]})}},J={args:{children:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(k,{children:`Open menu`}),(0,V.jsxs)(S,{children:[(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`File`}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`New draft`})}),(0,V.jsx)(C,{shortcut:U.save,children:(0,V.jsx)(w,{children:`Save`})}),(0,V.jsx)(C,{suffix:`Edited`,children:(0,V.jsx)(w,{children:`Save as copy…`})})]}),(0,V.jsx)(I,{}),(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`Organize`}),(0,V.jsx)(C,{prefix:(0,V.jsx)(F,{icon:ie}),shortcut:U.move,suffix:`3`,children:(0,V.jsx)(w,{children:`Move to collection…`})}),(0,V.jsx)(C,{prefix:(0,V.jsx)(F,{icon:v}),suffix:`12`,children:(0,V.jsx)(w,{children:`Archive`})})]})]})]})}},Y={args:{children:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(k,{children:`Open menu`}),(0,V.jsxs)(S,{children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Rename…`})}),(0,V.jsxs)(SubmenuRoot,{children:[(0,V.jsx)(B,{shortcut:U.move,children:(0,V.jsx)(w,{children:`Move to another collection`})}),(0,V.jsxs)(S,{children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Archive`})}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Favorites`})}),(0,V.jsxs)(SubmenuRoot,{children:[(0,V.jsx)(B,{children:(0,V.jsx)(w,{children:`More destinations`})}),(0,V.jsxs)(S,{children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Reviewed`})}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Shared`})})]})]})]})]}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Delete…`})})]})]})}},X={render:function Render(){let[e,t]=(0,r.useState)(!0),[n,i]=(0,r.useState)(!1),[a,o]=(0,r.useState)(!0),[s,c]=(0,r.useState)(!1);return(0,V.jsxs)(D,{children:[(0,V.jsx)(k,{children:`Columns`}),(0,V.jsxs)(S,{children:[(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`Visible columns`}),(0,V.jsx)(N,{checked:e,onCheckedChange:t,children:(0,V.jsx)(w,{children:`Bookmarks`})}),(0,V.jsx)(N,{checked:n,onCheckedChange:i,shortcut:U.downloads,children:(0,V.jsx)(w,{children:`Downloads`})})]}),(0,V.jsx)(I,{}),(0,V.jsxs)(j,{children:[(0,V.jsx)(M,{children:`Saved areas`}),(0,V.jsx)(N,{checked:a,onCheckedChange:o,prefix:(0,V.jsx)(F,{icon:v}),children:(0,V.jsx)(w,{children:`Archived`})}),(0,V.jsx)(N,{checked:s,onCheckedChange:c,prefix:(0,V.jsx)(F,{icon:re}),shortcut:U.shared,children:(0,V.jsx)(w,{children:`Shared`})})]})]})]})}},Z={render:function Render(){let[e,t]=(0,r.useState)(`left`),[n,i]=(0,r.useState)(`comfortable`);return(0,V.jsxs)(D,{children:[(0,V.jsx)(k,{children:`View options`}),(0,V.jsxs)(S,{children:[(0,V.jsxs)(A,{value:e,onValueChange:t,children:[(0,V.jsx)(M,{children:`Alignment`}),(0,V.jsx)(P,{value:`left`,prefix:(0,V.jsx)(F,{icon:h}),children:(0,V.jsx)(w,{children:`Left`})}),(0,V.jsx)(P,{value:`center`,prefix:(0,V.jsx)(F,{icon:g}),children:(0,V.jsx)(w,{children:`Center`})}),(0,V.jsx)(P,{value:`right`,prefix:(0,V.jsx)(F,{icon:se}),children:(0,V.jsx)(w,{children:`Right`})})]}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Reset alignment`})}),(0,V.jsx)(I,{}),(0,V.jsxs)(A,{value:n,onValueChange:i,children:[(0,V.jsx)(M,{children:`Density`}),(0,V.jsx)(P,{value:`compact`,children:(0,V.jsx)(w,{children:`Compact`})}),(0,V.jsx)(P,{value:`comfortable`,shortcut:U.comfortableDensity,children:(0,V.jsx)(w,{children:`Comfortable`})}),(0,V.jsx)(P,{value:`spacious`,children:(0,V.jsx)(w,{children:`Spacious`})})]})]})]})}},Q={args:{children:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(k,{children:`Open menu`}),(0,V.jsxs)(S,{positioner:(0,V.jsx)(O,{side:`right`,align:`start`}),children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Duplicate`})}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Move`})})]})]})}},$={name:`With Custom z-index`,args:{children:[(0,V.jsx)(k,{children:`Open menu`},`trigger`),(0,V.jsxs)(S,{portal:(0,V.jsx)(T,{style:{"--wp-ui-menu-z-index":`9999`}}),children:[(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Duplicate`})}),(0,V.jsx)(C,{children:(0,V.jsx)(w,{children:`Move…`})})]},`popup`)]}};try{$.__docgenInfo={description:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a menu renders below another popover when you want\nit above.\n\nThe `--wp-ui-menu-z-index` CSS variable controls the z-index of the Menu\npositioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  Menu popup in the page), or\n- **Per instance**, by passing a `Menu.Portal` with a `style` (or\n  `className`) to `Menu.Popup`'s `portal` prop. The variable cascades from\n  the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",displayName:`WithCustomZIndex`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/ui/src/menu/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [bookmarks, setBookmarks] = useState(true);
    const [downloads, setDownloads] = useState(false);
    const [view, setView] = useState('list');
    return <Menu.Root>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Popup>
                    <Menu.Item>
                        <Menu.ItemLabel>Rename…</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.ItemLabel>Archive</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item shortcut={SHORTCUTS.save} suffix="Draft">
                        <Menu.ItemLabel>Save</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Links</Menu.GroupLabel>
                        <Menu.LinkItem href="#menu-default-example">
                            <Menu.ItemLabel>View details</Menu.ItemLabel>
                        </Menu.LinkItem>
                        <Menu.LinkItem href="https://wordpress.org" openInNewTab>
                            <Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
                        </Menu.LinkItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Visible columns</Menu.GroupLabel>
                        <Menu.CheckboxItem checked={bookmarks} onCheckedChange={setBookmarks}>
                            <Menu.ItemLabel>Bookmarks</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem checked={downloads} onCheckedChange={setDownloads} shortcut={SHORTCUTS.downloads}>
                            <Menu.ItemLabel>Downloads</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.RadioGroup value={view} onValueChange={setView}>
                        <Menu.GroupLabel>View</Menu.GroupLabel>
                        <Menu.RadioItem value="list" prefix={<Menu.PrefixIcon icon={list} />}>
                            <Menu.ItemLabel>List</Menu.ItemLabel>
                        </Menu.RadioItem>
                        <Menu.RadioItem value="grid" prefix={<Menu.PrefixIcon icon={grid} />}>
                            <Menu.ItemLabel>Grid</Menu.ItemLabel>
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                    <Menu.Separator />
                    <Menu.Group aria-label="More actions">
                        <Menu.SubmenuRoot>
                            <Menu.SubmenuTrigger shortcut={SHORTCUTS.move} suffix="3">
                                <Menu.ItemLabel>Move to</Menu.ItemLabel>
                            </Menu.SubmenuTrigger>
                            <Menu.Popup>
                                <Menu.Item>
                                    <Menu.ItemLabel>Favorites</Menu.ItemLabel>
                                </Menu.Item>
                                <Menu.Item>
                                    <Menu.ItemLabel>Archive</Menu.ItemLabel>
                                </Menu.Item>
                                <Menu.SubmenuRoot>
                                    <Menu.SubmenuTrigger>
                                        <Menu.ItemLabel>
                                            More destinations
                                        </Menu.ItemLabel>
                                    </Menu.SubmenuTrigger>
                                    <Menu.Popup>
                                        <Menu.Item>
                                            <Menu.ItemLabel>
                                                Reviewed
                                            </Menu.ItemLabel>
                                        </Menu.Item>
                                        <Menu.Item>
                                            <Menu.ItemLabel>
                                                Shared
                                            </Menu.ItemLabel>
                                        </Menu.Item>
                                    </Menu.Popup>
                                </Menu.SubmenuRoot>
                            </Menu.Popup>
                        </Menu.SubmenuRoot>
                        <Menu.Item disabled>
                            <Menu.ItemLabel>Unavailable action</Menu.ItemLabel>
                        </Menu.Item>
                    </Menu.Group>
                </Menu.Popup>
            </Menu.Root>;
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    children: <>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Popup>
                    <Menu.LinkItem href="https://wordpress.org" openInNewTab>
                        <Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
                    </Menu.LinkItem>
                    <Menu.LinkItem href="https://developer.wordpress.org" openInNewTab target="wordpress-developer-resources" shortcut={SHORTCUTS.developerResources} suffix="Docs">
                        <Menu.ItemLabel>
                            WordPress developer resources
                        </Menu.ItemLabel>
                    </Menu.LinkItem>
                    <Menu.LinkItem href="#menu-link-item-example">
                        <Menu.ItemLabel>In-page destination</Menu.ItemLabel>
                    </Menu.LinkItem>
                </Menu.Popup>
            </>
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    children: <>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Popup>
                    <Menu.Group>
                        <Menu.GroupLabel>File</Menu.GroupLabel>
                        <Menu.Item shortcut={SHORTCUTS.save} suffix="Modified">
                            <Menu.ItemLabel>Save</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item disabled shortcut={SHORTCUTS.downloads}>
                            <Menu.ItemLabel>Download</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item>
                            <Menu.ItemLabel>Delete…</Menu.ItemLabel>
                            <Menu.ItemDescription>
                                Also deletes all versions of this item.
                            </Menu.ItemDescription>
                        </Menu.Item>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Organize</Menu.GroupLabel>
                        <Menu.Item prefix={<Menu.PrefixIcon icon={copy} />}>
                            <Menu.ItemLabel>Duplicate</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item prefix={<Menu.PrefixIcon icon={archive} />}>
                            <Menu.ItemLabel>Archive</Menu.ItemLabel>
                        </Menu.Item>
                    </Menu.Group>
                </Menu.Popup>
            </>
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Uses long text to demonstrate wrapping and disabled items. Keep product menu labels short and descriptions rare.'
      }
    }
  },
  args: {
    children: <>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Popup style={{
        width: 240
      }}>
                    <Menu.Item shortcut={SHORTCUTS.save} suffix="Modified">
                        <Menu.ItemLabel>
                            A long menu item label that wraps onto multiple
                            lines
                        </Menu.ItemLabel>
                        <Menu.ItemDescription>
                            This deliberately long description should wrap below
                            the label without overlapping the suffix or
                            shortcut.
                        </Menu.ItemDescription>
                    </Menu.Item>
                    <Menu.Item disabled shortcut={SHORTCUTS.downloads}>
                        <Menu.ItemLabel>
                            A disabled item with a long label that wraps onto
                            multiple lines
                        </Menu.ItemLabel>
                        <Menu.ItemDescription>
                            The disabled foreground treatment should apply to
                            the label, description, and shortcut.
                        </Menu.ItemDescription>
                    </Menu.Item>
                </Menu.Popup>
            </>
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    children: <>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Popup>
                    <Menu.Group>
                        <Menu.GroupLabel>File</Menu.GroupLabel>
                        <Menu.Item>
                            <Menu.ItemLabel>New draft</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item shortcut={SHORTCUTS.save}>
                            <Menu.ItemLabel>Save</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item suffix="Edited">
                            <Menu.ItemLabel>Save as copy…</Menu.ItemLabel>
                        </Menu.Item>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Organize</Menu.GroupLabel>
                        <Menu.Item prefix={<Menu.PrefixIcon icon={moveTo} />} shortcut={SHORTCUTS.move} suffix="3">
                            <Menu.ItemLabel>Move to collection…</Menu.ItemLabel>
                        </Menu.Item>
                        <Menu.Item prefix={<Menu.PrefixIcon icon={archive} />} suffix="12">
                            <Menu.ItemLabel>Archive</Menu.ItemLabel>
                        </Menu.Item>
                    </Menu.Group>
                </Menu.Popup>
            </>
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    children: <>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Popup>
                    <Menu.Item>
                        <Menu.ItemLabel>Rename…</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger shortcut={SHORTCUTS.move}>
                            <Menu.ItemLabel>
                                Move to another collection
                            </Menu.ItemLabel>
                        </Menu.SubmenuTrigger>
                        <Menu.Popup>
                            <Menu.Item>
                                <Menu.ItemLabel>Archive</Menu.ItemLabel>
                            </Menu.Item>
                            <Menu.Item>
                                <Menu.ItemLabel>Favorites</Menu.ItemLabel>
                            </Menu.Item>
                            <Menu.SubmenuRoot>
                                <Menu.SubmenuTrigger>
                                    <Menu.ItemLabel>
                                        More destinations
                                    </Menu.ItemLabel>
                                </Menu.SubmenuTrigger>
                                <Menu.Popup>
                                    <Menu.Item>
                                        <Menu.ItemLabel>
                                            Reviewed
                                        </Menu.ItemLabel>
                                    </Menu.Item>
                                    <Menu.Item>
                                        <Menu.ItemLabel>Shared</Menu.ItemLabel>
                                    </Menu.Item>
                                </Menu.Popup>
                            </Menu.SubmenuRoot>
                        </Menu.Popup>
                    </Menu.SubmenuRoot>
                    <Menu.Item>
                        <Menu.ItemLabel>Delete…</Menu.ItemLabel>
                    </Menu.Item>
                </Menu.Popup>
            </>
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [bookmarks, setBookmarks] = useState(true);
    const [downloads, setDownloads] = useState(false);
    const [archived, setArchived] = useState(true);
    const [shared, setShared] = useState(false);
    return <Menu.Root>
                <Menu.Trigger>Columns</Menu.Trigger>
                <Menu.Popup>
                    <Menu.Group>
                        <Menu.GroupLabel>Visible columns</Menu.GroupLabel>
                        <Menu.CheckboxItem checked={bookmarks} onCheckedChange={setBookmarks}>
                            <Menu.ItemLabel>Bookmarks</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem checked={downloads} onCheckedChange={setDownloads} shortcut={SHORTCUTS.downloads}>
                            <Menu.ItemLabel>Downloads</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Group>
                        <Menu.GroupLabel>Saved areas</Menu.GroupLabel>
                        <Menu.CheckboxItem checked={archived} onCheckedChange={setArchived} prefix={<Menu.PrefixIcon icon={archive} />}>
                            <Menu.ItemLabel>Archived</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                        <Menu.CheckboxItem checked={shared} onCheckedChange={setShared} prefix={<Menu.PrefixIcon icon={share} />} shortcut={SHORTCUTS.shared}>
                            <Menu.ItemLabel>Shared</Menu.ItemLabel>
                        </Menu.CheckboxItem>
                    </Menu.Group>
                </Menu.Popup>
            </Menu.Root>;
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [alignment, setAlignment] = useState('left');
    const [density, setDensity] = useState('comfortable');
    return <Menu.Root>
                <Menu.Trigger>View options</Menu.Trigger>
                <Menu.Popup>
                    <Menu.RadioGroup value={alignment} onValueChange={setAlignment}>
                        <Menu.GroupLabel>Alignment</Menu.GroupLabel>
                        <Menu.RadioItem value="left" prefix={<Menu.PrefixIcon icon={alignLeft} />}>
                            <Menu.ItemLabel>Left</Menu.ItemLabel>
                        </Menu.RadioItem>
                        <Menu.RadioItem value="center" prefix={<Menu.PrefixIcon icon={alignCenter} />}>
                            <Menu.ItemLabel>Center</Menu.ItemLabel>
                        </Menu.RadioItem>
                        <Menu.RadioItem value="right" prefix={<Menu.PrefixIcon icon={alignRight} />}>
                            <Menu.ItemLabel>Right</Menu.ItemLabel>
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                    <Menu.Item>
                        <Menu.ItemLabel>Reset alignment</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.RadioGroup value={density} onValueChange={setDensity}>
                        <Menu.GroupLabel>Density</Menu.GroupLabel>
                        <Menu.RadioItem value="compact">
                            <Menu.ItemLabel>Compact</Menu.ItemLabel>
                        </Menu.RadioItem>
                        <Menu.RadioItem value="comfortable" shortcut={SHORTCUTS.comfortableDensity}>
                            <Menu.ItemLabel>Comfortable</Menu.ItemLabel>
                        </Menu.RadioItem>
                        <Menu.RadioItem value="spacious">
                            <Menu.ItemLabel>Spacious</Menu.ItemLabel>
                        </Menu.RadioItem>
                    </Menu.RadioGroup>
                </Menu.Popup>
            </Menu.Root>;
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  args: {
    children: <>
                <Menu.Trigger>Open menu</Menu.Trigger>
                <Menu.Popup positioner={<Menu.Positioner side="right" align="start" />}>
                    <Menu.Item>
                        <Menu.ItemLabel>Duplicate</Menu.ItemLabel>
                    </Menu.Item>
                    <Menu.Item>
                        <Menu.ItemLabel>Move</Menu.ItemLabel>
                    </Menu.Item>
                </Menu.Popup>
            </>
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: 'With Custom z-index',
  args: {
    children: [<Menu.Trigger key="trigger">Open menu</Menu.Trigger>, <Menu.Popup portal={<Menu.Portal style={{
      '--wp-ui-menu-z-index': '9999'
    }} />} key="popup">
                <Menu.Item>
                    <Menu.ItemLabel>Duplicate</Menu.ItemLabel>
                </Menu.Item>
                <Menu.Item>
                    <Menu.ItemLabel>Move…</Menu.ItemLabel>
                </Menu.Item>
            </Menu.Popup>]
  }
}`,...$.parameters?.docs?.source},description:{story:"Popovers in Gutenberg are managed with explicit z-index values, which can\ncreate situations where a menu renders below another popover when you want\nit above.\n\nThe `--wp-ui-menu-z-index` CSS variable controls the z-index of the Menu\npositioner. Override it either:\n\n- **Globally**, by setting the variable on `:root` or `body` (raises every\n  Menu popup in the page), or\n- **Per instance**, by passing a `Menu.Portal` with a `style` (or\n  `className`) to `Menu.Popup`'s `portal` prop. The variable cascades from\n  the portal wrapper to everything rendered inside it.\n\nThis story demonstrates the per-instance approach.",...$.parameters?.docs?.description}}}})))()}init_index_story();export{X as CheckboxItems,W as Default,J as GroupedItems,G as LinkItem,Q as Positioning,Z as RadioItems,K as RichItems,Y as Submenu,$ as WithCustomZIndex,q as WrappedItems,H as default};