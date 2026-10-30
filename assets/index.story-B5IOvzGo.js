import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./react-CfMABiEl.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./use-event-Cr6_a9Gc.js";import{c as s,i as c,n as l,t as u}from"./build-module-CqL0UdL5.js";import{a as d,i as f}from"./iframe-BbJPeSVw.js";import{r as p,t as m}from"./build-module-BvdTt2vY.js";import{Fc as h,Rr as g,bi as _,n as v}from"./build-module-DttIWYbV.js";import{n as y,o as b,r as x,t as S}from"./use-context-system-CT9ido3G.js";import{n as C,t as w}from"./component-lXS83C_h.js";import{n as T,t as E}from"./component-BY3Du5yg.js";import{i as D,r as O}from"./component-Dg7Kep0D.js";import{n as k,t as A}from"./component-BwSCOsqL.js";import{i as j,r as M,t as N}from"./slot-fill-aOtBDwg6.js";import{n as P,t as F}from"./component-CRE1lL-m.js";import{n as I,t as L}from"./unit-control-BKCirGeL.js";import{n as R,t as ee}from"./component-BdJhDt_r.js";import{n as te,t as ne}from"./dropdown-menu-1nj0x6gm.js";import{i as re,n as ie,r as z,t as B}from"./menu-group-DP9smo1n.js";import{n as ae,t as V}from"./panel-BBFo3BES.js";var H;function init_style_module(){return(init_style_module=e((()=>{H={"tools-panel":`_tools-panel_1eddw_46`,"tools-panel-with-inner-wrapper":`_tools-panel-with-inner-wrapper_1eddw_52`,"tools-panel-hidden-inner-wrapper":`_tools-panel-hidden-inner-wrapper_1eddw_60`,"tools-panel-header":`_tools-panel-header_1eddw_64`,"tools-panel-heading":`_tools-panel-heading_1eddw_78`,"tools-panel-item":`_tools-panel-item_1eddw_84`,"tools-panel-item-placeholder":`_tools-panel-item-placeholder_1eddw_104`,"dropdown-menu":`_dropdown-menu_1eddw_108`,"reset-label":`_reset-label_1eddw_112`,"default-controls-item":`_default-controls-item_1eddw_121`}})))()}var noop$1,U,useToolsPanelContext;function init_context(){return(init_context=e((()=>{r(),noop$1=()=>void 0,U=(0,i.createContext)({menuItems:{default:{},optional:{}},hasMenuItems:!1,isResetting:!1,shouldRenderPlaceholderItems:!1,registerPanelItem:noop$1,deregisterPanelItem:noop$1,flagItemCustomization:noop$1,registerResetAllFilter:noop$1,deregisterResetAllFilter:noop$1,areAllOptionalControlsHidden:!0}),U.displayName=`ToolsPanelContext`,useToolsPanelContext=()=>(0,i.useContext)(U)})))()}function useToolsPanelHeader(e){let{className:t,headingLevel:n=2,...r}=y(e,`ToolsPanelHeader`),{menuItems:i,hasMenuItems:a,areAllOptionalControlsHidden:o}=useToolsPanelContext();return{...r,areAllOptionalControlsHidden:o,defaultControlsItemClassName:H[`default-controls-item`],dropdownMenuClassName:H[`dropdown-menu`],hasMenuItems:a,headingClassName:H[`tools-panel-heading`],headingLevel:n,menuItems:i,className:f(H[`tools-panel-header`],t)}}function init_hook(){return(init_hook=e((()=>{d(),init_style_module(),init_context(),S()})))()}var W,DefaultControlsGroup,OptionalControlsGroup,ToolsPanelHeader,G;function init_component(){return(init_component=e((()=>{m(),v(),u(),te(),ie(),re(),T(),P(),init_hook(),init_style_module(),b(),W=n(),DefaultControlsGroup=({itemClassName:e,items:t,toggleItem:n})=>{if(!t.length)return null;let r=(0,W.jsx)(`span`,{"aria-hidden":!0,className:H[`reset-label`],children:l(`Reset`)});return(0,W.jsx)(W.Fragment,{children:t.map(([t,i])=>i?(0,W.jsx)(z,{className:e,role:`menuitem`,label:s(l(`%s, reset to default`),t),onClick:()=>{n(t),p(s(l(`%s reset to default`),t),`assertive`)},suffix:r,children:t},t):(0,W.jsx)(z,{icon:h,className:e,role:`menuitemcheckbox`,isSelected:!0,"aria-disabled":!0,children:t},t))})},OptionalControlsGroup=({items:e,toggleItem:t})=>e.length?(0,W.jsx)(W.Fragment,{children:e.map(([e,n])=>{let r=s(n?l(`%s, hide and reset`):c(`%s, show`,`input control`),e);return(0,W.jsx)(z,{icon:n?h:null,isSelected:n,label:r,onClick:()=>{p(s(l(n?`%s hidden and reset to default`:`%s is now visible`),e),`assertive`),t(e)},role:`menuitemcheckbox`,children:e},e)})}):null,ToolsPanelHeader=(e,t)=>{let{areAllOptionalControlsHidden:n,defaultControlsItemClassName:r,dropdownMenuClassName:i,hasMenuItems:a,headingClassName:o,headingLevel:u=2,label:d,menuItems:f,resetAll:m,toggleItem:h,dropdownMenuProps:v,...y}=useToolsPanelHeader(e);if(!d)return null;let b=Object.entries(f?.default||{}),x=Object.entries(f?.optional||{}),S=n?g:_,C=s(c(`%s options`,`Button label to reveal tool panel options`),d),w=n?l(`All options are currently hidden`):void 0,T=[...b,...x].some(([,e])=>e);return(0,W.jsxs)(E,{...y,ref:t,children:[(0,W.jsx)(F,{level:u,className:o,children:d}),a&&(0,W.jsx)(ne,{...v,icon:S,label:C,menuProps:{className:i},toggleProps:{size:`small`,description:w},children:()=>(0,W.jsxs)(W.Fragment,{children:[(0,W.jsxs)(B,{label:d,children:[(0,W.jsx)(DefaultControlsGroup,{items:b,toggleItem:h,itemClassName:r}),(0,W.jsx)(OptionalControlsGroup,{items:x,toggleItem:h})]}),(0,W.jsx)(B,{children:(0,W.jsx)(z,{"aria-disabled":!T,variant:`tertiary`,onClick:()=>{T&&(m(),p(l(`All options reset`),`assertive`))},children:l(`Reset all`)})})]})})]})},G=x(ToolsPanelHeader,`ToolsPanelHeader`)})))()}function emptyState(){return{panelItems:[],menuItemOrder:[],menuItemValues:{}}}function panelItemsReducer(e,t){switch(t.type){case`REGISTER_PANEL`:{let n=e.findIndex(e=>e.label===t.item.label),r=[...e];return n!==-1&&r.splice(n,1),r.push(t.item),r}case`UNREGISTER_PANEL`:{let n=e.findIndex(e=>e.label===t.label);if(n===-1||t.item&&e[n]!==t.item)return e;let r=[...e];return r.splice(n,1),r}default:return e}}function menuItemOrderReducer(e,t){switch(t.type){case`REGISTER_PANEL`:return e.includes(t.item.label)?e:[...e,t.item.label];default:return e}}function menuItemValuesReducer(e,t){let n=e.menuItemValues;switch(t.type){case`REGISTER_PANEL`:{if(!n.hasOwnProperty(t.item.label))return n;let{[t.item.label]:e,...r}=n;return r}case`UPDATE_VALUE`:return n[t.label]===t.value?n:{...n,[t.label]:t.value};case`TOGGLE_VALUE`:{let r=e.panelItems.find(({label:e})=>e===t.label);if(!r)return n;let i=n[t.label]??getSeedValue(r);return{...n,[t.label]:!i}}case`RESET_ALL`:{let t=e.panelItems.filter(e=>!e.isShownByDefault&&n[e.label]!==!1);if(!t.length)return n;let r={...n};return t.forEach(({label:e})=>{r[e]=!1}),r}default:return n}}function panelReducer(e,t){let n=panelItemsReducer(e.panelItems,t),r=menuItemOrderReducer(e.menuItemOrder,t),i=menuItemValuesReducer({...e,panelItems:n},t);return n===e.panelItems&&r===e.menuItemOrder&&i===e.menuItemValues?e:{panelItems:n,menuItemOrder:r,menuItemValues:i}}function resetAllFiltersReducer(e,t){switch(t.type){case`REGISTER`:return[...e,t.filter];case`UNREGISTER`:return e.filter(e=>e!==t.filter);default:return e}}function useToolsPanel(e){let{className:t,headingLevel:n=2,resetAll:r,panelId:a,hasInnerWrapper:o=!1,shouldRenderPlaceholderItems:s=!1,__experimentalFirstVisibleItemClass:c,__experimentalLastVisibleItemClass:l,...u}=y(e,`ToolsPanel`),[d,p]=(0,i.useState)(!1);(0,i.useEffect)(()=>{d&&p(!1)},[d]);let[{panelItems:m,menuItemOrder:h,menuItemValues:g},_]=(0,i.useReducer)(panelReducer,void 0,emptyState),[v,b]=(0,i.useReducer)(resetAllFiltersReducer,[]),x=(0,i.useCallback)(e=>{_({type:`REGISTER_PANEL`,item:e})},[]),S=(0,i.useCallback)((e,t)=>{_({type:`UNREGISTER_PANEL`,label:e,item:t})},[]),C=(0,i.useCallback)(e=>{b({type:`REGISTER`,filter:e})},[]),w=(0,i.useCallback)(e=>{b({type:`UNREGISTER`,filter:e})},[]),T=(0,i.useCallback)((e,t)=>{_({type:`UPDATE_VALUE`,label:t,value:e})},[]),E=(0,i.useMemo)(()=>{let e={default:{},optional:{}},t=new Map(m.map(e=>[e.label,e]));return h.forEach(n=>{let r=t.get(n);r&&(e[getMenuGroup(r)][n]=g[n]??getSeedValue(r))}),e},[m,h,g]),D=(0,i.useMemo)(()=>isMenuItemTypeEmpty(E.default)&&!isMenuItemTypeEmpty(E.optional)&&Object.values(E.optional).every(e=>!e),[E]),O=f(H[`tools-panel`],o&&H[`tools-panel-with-inner-wrapper`],D&&H[`tools-panel-hidden-inner-wrapper`],t),k=(0,i.useCallback)(e=>{let t=m.find(t=>t.label===e);t&&(_({type:`TOGGLE_VALUE`,label:e}),!t.isShownByDefault&&t.onShownChange?.(!E.optional[e]))},[E,m]),A=(0,i.useMemo)(()=>[...m.map(e=>e.resetAllFilter).filter(e=>!!e),...v],[m,v]),j=(0,i.useCallback)(()=>{typeof r==`function`&&(p(!0),r(A)),_({type:`RESET_ALL`})},[A,r]),getFirstVisibleItemLabel=e=>{let t=E.optional||{};return e.find(e=>e.isShownByDefault||t[e.label])?.label},M=getFirstVisibleItemLabel(m),N=getFirstVisibleItemLabel([...m].reverse()),P=m.length>0,F=(0,i.useMemo)(()=>({areAllOptionalControlsHidden:D,deregisterPanelItem:S,deregisterResetAllFilter:w,firstDisplayedItem:M,flagItemCustomization:T,hasMenuItems:P,isResetting:d,lastDisplayedItem:N,menuItems:E,panelId:a,registerPanelItem:x,registerResetAllFilter:C,shouldRenderPlaceholderItems:s,__experimentalFirstVisibleItemClass:c,__experimentalLastVisibleItemClass:l}),[D,S,w,M,T,d,N,E,a,P,C,x,s,c,l]);return{...u,headingLevel:n,panelContext:F,resetAllItems:j,toggleItem:k,className:O}}var getSeedValue,getMenuGroup,isMenuItemTypeEmpty;function init_hook$1(){return(init_hook$1=e((()=>{d(),r(),init_style_module(),S(),getSeedValue=e=>e.hasValue()||!e.isShownByDefault&&!!e.defaultShown,getMenuGroup=e=>e.isShownByDefault?`default`:`optional`,isMenuItemTypeEmpty=e=>Object.keys(e).length===0})))()}var K,UnconnectedToolsPanel,q;function init_component$1(){return(init_component$1=e((()=>{init_component(),init_context(),init_hook$1(),R(),b(),K=n(),UnconnectedToolsPanel=(e,t)=>{let{children:n,label:r,panelContext:i,resetAllItems:a,toggleItem:o,headingLevel:s,dropdownMenuProps:c,...l}=useToolsPanel(e);return(0,K.jsx)(ee,{...l,columns:2,gap:4,columnGap:`var(--wpds-dimension-gap-lg, 16px)`,rowGap:`var(--wpds-dimension-gap-lg, 16px)`,templateColumns:`repeat( 2, minmax(0, 1fr) )`,ref:t,children:(0,K.jsxs)(U.Provider,{value:i,children:[(0,K.jsx)(G,{label:r,resetAll:a,toggleItem:o,headingLevel:s,dropdownMenuProps:c}),n]})})},q=x(UnconnectedToolsPanel,`ToolsPanel`);try{q.__docgenInfo={description:`The \`ToolsPanel\` is a container component that displays its children preceded
by a header. The header includes a dropdown menu which is automatically
generated from the panel's inner \`ToolsPanelItems\`.

\`\`\`jsx
import { __ } from '@wordpress/i18n';
import {
  __experimentalToolsPanel as ToolsPanel,
  __experimentalToolsPanelItem as ToolsPanelItem,
  __experimentalUnitControl as UnitControl
} from '@wordpress/components';

function Example() {
  const [ height, setHeight ] = useState();
  const [ width, setWidth ] = useState();

  const resetAll = () => {
    setHeight();
    setWidth();
  }

  return (
    <ToolsPanel label={ __( 'Dimensions' ) } resetAll={ resetAll }>
      <ToolsPanelItem
        hasValue={ () => !! height }
        label={ __( 'Height' ) }
        onDeselect={ () => setHeight() }
      >
        <UnitControl
          label={ __( 'Height' ) }
          onChange={ setHeight }
          value={ height }
        />
      </ToolsPanelItem>
      <ToolsPanelItem
        hasValue={ () => !! width }
        label={ __( 'Width' ) }
        onDeselect={ () => setWidth() }
      >
        <UnitControl
          label={ __( 'Width' ) }
          onChange={ setWidth }
          value={ width }
        />
      </ToolsPanelItem>
    </ToolsPanel>
  );
}
\`\`\``,displayName:`ToolsPanel`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/tools-panel/tools-panel/component.tsx`,methods:[],props:{children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:`The child elements.`,name:`children`,required:!0,tags:{},type:{name:`ReactNode`}},dropdownMenuProps:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"The dropdown menu props to configure the panel's `DropdownMenu`.",name:`dropdownMenuProps`,required:!1,tags:{},type:{name:`Omit<DropdownMenuProps, "label">`}},hasInnerWrapper:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:`Flags that the items in this ToolsPanel will be contained within an inner
wrapper element allowing the panel to lay them out accordingly.`,name:`hasInnerWrapper`,required:!1,tags:{},type:{name:`boolean`}},headingLevel:{defaultValue:{value:`2`},declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:`The heading level of the panel's header.`,name:`headingLevel`,required:!1,tags:{},type:{name:`enum`,raw:`HeadingSize`,value:[{value:`1`},{value:`2`},{value:`3`},{value:`4`},{value:`5`},{value:`6`},{value:`"1"`},{value:`"2"`},{value:`"3"`},{value:`"4"`},{value:`"5"`},{value:`"6"`}]}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"Text to be displayed within the panel's header and as the `aria-label`\nfor the panel's dropdown menu.",name:`label`,required:!0,tags:{},type:{name:`string`}},panelId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"If a `panelId` is set, it is passed through the `ToolsPanelContext` and\nused to restrict panel items. When a `panelId` is set, items can only\nregister themselves if the `panelId` is explicitly `null` or the item's\n`panelId` matches exactly.",name:`panelId`,required:!1,tags:{},type:{name:`string | null`}},resetAll:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"A function to call when the `Reset all` menu option is selected. As an\nargument, it receives an array containing the `resetAllFilter` callbacks\nof all the valid registered `ToolsPanelItems`.",name:`resetAll`,required:!0,tags:{},type:{name:`ResetAll`}},shouldRenderPlaceholderItems:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"Advises the `ToolsPanel` that its child `ToolsPanelItem`s should render\nplaceholder content instead of null when they are toggled off and hidden.\nNote that placeholder items won't apply the `className` that would be\nnormally applied to a visible `ToolsPanelItem` via the `className` prop.",name:`shouldRenderPlaceholderItems`,required:!1,tags:{},type:{name:`boolean`}},__experimentalFirstVisibleItemClass:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"Experimental prop allowing for a custom CSS class to be applied to the\nfirst visible `ToolsPanelItem` within the `ToolsPanel`.",name:`__experimentalFirstVisibleItemClass`,required:!1,tags:{},type:{name:`string`}},__experimentalLastVisibleItemClass:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"Experimental prop allowing for a custom CSS class to be applied to the\nlast visible `ToolsPanelItem` within the `ToolsPanel`.",name:`__experimentalLastVisibleItemClass`,required:!1,tags:{},type:{name:`string`}},as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element to render the component as.`,name:`as`,required:!0,tags:{},type:{name:`enum`,raw:`keyof IntrinsicElements`,value:[{value:`"symbol"`},{value:`"object"`},{value:`"select"`},{value:`"text"`},{value:`"time"`},{value:`"search"`},{value:`"big"`},{value:`"link"`},{value:`"small"`},{value:`"sub"`},{value:`"sup"`},{value:`"style"`},{value:`"div"`},{value:`"a"`},{value:`"abbr"`},{value:`"address"`},{value:`"area"`},{value:`"article"`},{value:`"aside"`},{value:`"audio"`},{value:`"b"`},{value:`"base"`},{value:`"bdi"`},{value:`"bdo"`},{value:`"blockquote"`},{value:`"body"`},{value:`"br"`},{value:`"button"`},{value:`"canvas"`},{value:`"caption"`},{value:`"center"`},{value:`"cite"`},{value:`"code"`},{value:`"col"`},{value:`"colgroup"`},{value:`"data"`},{value:`"datalist"`},{value:`"dd"`},{value:`"del"`},{value:`"details"`},{value:`"dfn"`},{value:`"dialog"`},{value:`"dl"`},{value:`"dt"`},{value:`"em"`},{value:`"embed"`},{value:`"fieldset"`},{value:`"figcaption"`},{value:`"figure"`},{value:`"footer"`},{value:`"form"`},{value:`"h1"`},{value:`"h2"`},{value:`"h3"`},{value:`"h4"`},{value:`"h5"`},{value:`"h6"`},{value:`"head"`},{value:`"header"`},{value:`"hgroup"`},{value:`"hr"`},{value:`"html"`},{value:`"i"`},{value:`"iframe"`},{value:`"img"`},{value:`"input"`},{value:`"ins"`},{value:`"kbd"`},{value:`"keygen"`},{value:`"label"`},{value:`"legend"`},{value:`"li"`},{value:`"main"`},{value:`"map"`},{value:`"mark"`},{value:`"menu"`},{value:`"menuitem"`},{value:`"meta"`},{value:`"meter"`},{value:`"nav"`},{value:`"noindex"`},{value:`"noscript"`},{value:`"ol"`},{value:`"optgroup"`},{value:`"option"`},{value:`"output"`},{value:`"p"`},{value:`"param"`},{value:`"picture"`},{value:`"pre"`},{value:`"progress"`},{value:`"q"`},{value:`"rp"`},{value:`"rt"`},{value:`"ruby"`},{value:`"s"`},{value:`"samp"`},{value:`"slot"`},{value:`"script"`},{value:`"section"`},{value:`"source"`},{value:`"span"`},{value:`"strong"`},{value:`"summary"`},{value:`"table"`},{value:`"template"`},{value:`"tbody"`},{value:`"td"`},{value:`"textarea"`},{value:`"tfoot"`},{value:`"th"`},{value:`"thead"`},{value:`"title"`},{value:`"tr"`},{value:`"track"`},{value:`"u"`},{value:`"ul"`},{value:`"var"`},{value:`"video"`},{value:`"wbr"`},{value:`"webview"`},{value:`"svg"`},{value:`"animate"`},{value:`"animateMotion"`},{value:`"animateTransform"`},{value:`"circle"`},{value:`"clipPath"`},{value:`"defs"`},{value:`"desc"`},{value:`"ellipse"`},{value:`"feBlend"`},{value:`"feColorMatrix"`},{value:`"feComponentTransfer"`},{value:`"feComposite"`},{value:`"feConvolveMatrix"`},{value:`"feDiffuseLighting"`},{value:`"feDisplacementMap"`},{value:`"feDistantLight"`},{value:`"feDropShadow"`},{value:`"feFlood"`},{value:`"feFuncA"`},{value:`"feFuncB"`},{value:`"feFuncG"`},{value:`"feFuncR"`},{value:`"feGaussianBlur"`},{value:`"feImage"`},{value:`"feMerge"`},{value:`"feMergeNode"`},{value:`"feMorphology"`},{value:`"feOffset"`},{value:`"fePointLight"`},{value:`"feSpecularLighting"`},{value:`"feSpotLight"`},{value:`"feTile"`},{value:`"feTurbulence"`},{value:`"filter"`},{value:`"foreignObject"`},{value:`"g"`},{value:`"image"`},{value:`"line"`},{value:`"linearGradient"`},{value:`"marker"`},{value:`"mask"`},{value:`"metadata"`},{value:`"mpath"`},{value:`"path"`},{value:`"pattern"`},{value:`"polygon"`},{value:`"polyline"`},{value:`"radialGradient"`},{value:`"rect"`},{value:`"set"`},{value:`"stop"`},{value:`"switch"`},{value:`"textPath"`},{value:`"tspan"`},{value:`"use"`},{value:`"view"`}]}}},tags:{}}}catch{}})))()}function useToolsPanelItem(e){let{className:t,defaultShown:n,hasValue:r,isShownByDefault:o=!1,label:s,panelId:c,resetAllFilter:l=noop,onDeselect:u,onSelect:d,onShownChange:p,...m}=y(e,`ToolsPanelItem`),{panelId:h,menuItems:g,registerPanelItem:_,deregisterPanelItem:v,flagItemCustomization:b,isResetting:x,shouldRenderPlaceholderItems:S,firstDisplayedItem:C,lastDisplayedItem:w,__experimentalFirstVisibleItemClass:T,__experimentalLastVisibleItemClass:E}=useToolsPanelContext(),D=(0,i.useCallback)(r,[c]),O=a(l),k=(0,i.useRef)(n);(0,i.useLayoutEffect)(()=>{k.current=n});let A=a(p),j=h===c||h===null;(0,i.useLayoutEffect)(()=>{if(!j)return;let e={defaultShown:k.current,hasValue:D,isShownByDefault:o,label:s,onShownChange:A,panelId:c,resetAllFilter:O};return _(e),()=>{v(s,e)}},[v,j,D,o,s,A,c,_,O]);let M=g?.[o?`default`:`optional`]?.[s],N=M!==void 0,P=(0,i.useRef)(void 0),F=r();(0,i.useLayoutEffect)(()=>{j&&(o||F)&&b(F,s)},[j,F,s,b,o]),(0,i.useEffect)(()=>{let e=P.current;P.current=M,N&&e!==void 0&&!x&&j&&(M&&!F&&!e&&d?.(),!M&&F&&e&&u?.())},[j,M,N,x,F,d,u]);let I=o?N:M,L=S&&!I,R=f(H[`tools-panel-item`],L&&H[`tools-panel-item-placeholder`],!L&&t,C===s&&T,w===s&&E);return{...m,isShown:I,shouldRenderPlaceholder:S,className:R}}var noop;function init_hook$2(){return(init_hook$2=e((()=>{d(),o(),r(),init_style_module(),init_context(),S(),noop=()=>{}})))()}var J,UnconnectedToolsPanelItem,Y;function init_component$2(){return(init_component$2=e((()=>{init_hook$2(),C(),b(),J=n(),UnconnectedToolsPanelItem=(e,t)=>{let{children:n,isShown:r,shouldRenderPlaceholder:i,...a}=useToolsPanelItem(e);return r?(0,J.jsx)(w,{...a,ref:t,children:n}):i?(0,J.jsx)(w,{...a,ref:t}):null},Y=x(UnconnectedToolsPanelItem,`ToolsPanelItem`);try{Y.__docgenInfo={description:``,displayName:`ToolsPanelItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/tools-panel/tools-panel-item/component.tsx`,methods:[],props:{defaultShown:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:`For optional items only, this determines whether the item is shown on
first render even when \`hasValue()\` returns \`false\`.

An item is always shown while it has a value, so this only controls the
initial state of items without one.`,name:`defaultShown`,required:!1,tags:{},type:{name:`boolean`}},hasValue:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"This is called when building the `ToolsPanel` menu to determine the\nitem's initial checked state.",name:`hasValue`,required:!0,tags:{},type:{name:`() => boolean`}},isShownByDefault:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:`This prop identifies the current item as being displayed by default. This
means it will show regardless of whether it has a value set or is toggled
on in the panel's menu.`,name:`isShownByDefault`,required:!1,tags:{},type:{name:`boolean`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:`The supplied label is dual purpose. It is used as:
1. the human-readable label for the panel's dropdown menu
2. a key to locate the corresponding item in the panel's menu context to
determine if the panel item should be displayed.
A panel item's \`label\` should be unique among all items within a single
panel.`,name:`label`,required:!0,tags:{},type:{name:`string`}},onShownChange:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"A callback executed when the user shows or hides the item via the\n`ToolsPanel` menu, passed `true` when it was shown and `false` when it\nwas hidden.\n\nUnlike `onDeselect`, this fires whether or not the item has a value, and\nonly in response to an explicit menu action. Visibility changes with\nanother cause do not trigger it, such as an item becoming visible\nbecause it received a value or because `defaultShown` was set, or\nhiding because `Reset all` ran.\n\nItems flagged with `isShownByDefault` are always visible and stay so when\ntoggled off, so this is never called for them.\n\nA single menu action may also call `onSelect` or `onDeselect`, which are\nunchanged. Showing an item without a value calls this with `true` and\n`onSelect`; hiding an item that has a value calls this with `false` and\n`onDeselect`. Use this callback to track visibility and `onDeselect` to\nreset a value, rather than treating them as interchangeable.",name:`onShownChange`,required:!1,tags:{},type:{name:`((isShown: boolean) => void)`}},panelId:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"Panel items will ensure they are only registering with their intended panel\nby comparing the `panelId` props set on both the item and the panel itself,\nor if the `panelId` is explicitly `null`. This allows items to be injected\nfrom a shared source.",name:`panelId`,required:!1,tags:{},type:{name:`string | null`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:`The child elements.`,name:`children`,required:!1,tags:{},type:{name:`ReactNode`}},onDeselect:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"Called when this item is deselected in the `ToolsPanel` menu. This is\nnormally used to reset the panel item control's value.",name:`onDeselect`,required:!1,tags:{},type:{name:`(() => void)`}},onSelect:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"A callback to take action when this item is selected in the `ToolsPanel`\nmenu.",name:`onSelect`,required:!1,tags:{},type:{name:`(() => void)`}},resetAllFilter:{defaultValue:{value:`noop`},declarations:[{fileName:`gutenberg/packages/components/src/tools-panel/types.ts`,name:`TypeLiteral`}],description:"A `ToolsPanel` will collect each item's `resetAllFilter` and pass an\narray of these functions through to the panel's `resetAll` callback. They\ncan then be iterated over to perform additional tasks.",name:`resetAllFilter`,required:!1,tags:{},type:{name:`ResetAllFilter`}},as:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/context/wordpress-component.ts`,name:`TypeLiteral`}],description:`The HTML element to render the component as.`,name:`as`,required:!0,tags:{},type:{name:`enum`,raw:`keyof IntrinsicElements`,value:[{value:`"symbol"`},{value:`"object"`},{value:`"select"`},{value:`"text"`},{value:`"time"`},{value:`"search"`},{value:`"big"`},{value:`"link"`},{value:`"small"`},{value:`"sub"`},{value:`"sup"`},{value:`"style"`},{value:`"div"`},{value:`"a"`},{value:`"abbr"`},{value:`"address"`},{value:`"area"`},{value:`"article"`},{value:`"aside"`},{value:`"audio"`},{value:`"b"`},{value:`"base"`},{value:`"bdi"`},{value:`"bdo"`},{value:`"blockquote"`},{value:`"body"`},{value:`"br"`},{value:`"button"`},{value:`"canvas"`},{value:`"caption"`},{value:`"center"`},{value:`"cite"`},{value:`"code"`},{value:`"col"`},{value:`"colgroup"`},{value:`"data"`},{value:`"datalist"`},{value:`"dd"`},{value:`"del"`},{value:`"details"`},{value:`"dfn"`},{value:`"dialog"`},{value:`"dl"`},{value:`"dt"`},{value:`"em"`},{value:`"embed"`},{value:`"fieldset"`},{value:`"figcaption"`},{value:`"figure"`},{value:`"footer"`},{value:`"form"`},{value:`"h1"`},{value:`"h2"`},{value:`"h3"`},{value:`"h4"`},{value:`"h5"`},{value:`"h6"`},{value:`"head"`},{value:`"header"`},{value:`"hgroup"`},{value:`"hr"`},{value:`"html"`},{value:`"i"`},{value:`"iframe"`},{value:`"img"`},{value:`"input"`},{value:`"ins"`},{value:`"kbd"`},{value:`"keygen"`},{value:`"label"`},{value:`"legend"`},{value:`"li"`},{value:`"main"`},{value:`"map"`},{value:`"mark"`},{value:`"menu"`},{value:`"menuitem"`},{value:`"meta"`},{value:`"meter"`},{value:`"nav"`},{value:`"noindex"`},{value:`"noscript"`},{value:`"ol"`},{value:`"optgroup"`},{value:`"option"`},{value:`"output"`},{value:`"p"`},{value:`"param"`},{value:`"picture"`},{value:`"pre"`},{value:`"progress"`},{value:`"q"`},{value:`"rp"`},{value:`"rt"`},{value:`"ruby"`},{value:`"s"`},{value:`"samp"`},{value:`"slot"`},{value:`"script"`},{value:`"section"`},{value:`"source"`},{value:`"span"`},{value:`"strong"`},{value:`"summary"`},{value:`"table"`},{value:`"template"`},{value:`"tbody"`},{value:`"td"`},{value:`"textarea"`},{value:`"tfoot"`},{value:`"th"`},{value:`"thead"`},{value:`"title"`},{value:`"tr"`},{value:`"track"`},{value:`"u"`},{value:`"ul"`},{value:`"var"`},{value:`"video"`},{value:`"wbr"`},{value:`"webview"`},{value:`"svg"`},{value:`"animate"`},{value:`"animateMotion"`},{value:`"animateTransform"`},{value:`"circle"`},{value:`"clipPath"`},{value:`"defs"`},{value:`"desc"`},{value:`"ellipse"`},{value:`"feBlend"`},{value:`"feColorMatrix"`},{value:`"feComponentTransfer"`},{value:`"feComposite"`},{value:`"feConvolveMatrix"`},{value:`"feDiffuseLighting"`},{value:`"feDisplacementMap"`},{value:`"feDistantLight"`},{value:`"feDropShadow"`},{value:`"feFlood"`},{value:`"feFuncA"`},{value:`"feFuncB"`},{value:`"feFuncG"`},{value:`"feFuncR"`},{value:`"feGaussianBlur"`},{value:`"feImage"`},{value:`"feMerge"`},{value:`"feMergeNode"`},{value:`"feMorphology"`},{value:`"feOffset"`},{value:`"fePointLight"`},{value:`"feSpecularLighting"`},{value:`"feSpotLight"`},{value:`"feTile"`},{value:`"feTurbulence"`},{value:`"filter"`},{value:`"foreignObject"`},{value:`"g"`},{value:`"image"`},{value:`"line"`},{value:`"linearGradient"`},{value:`"marker"`},{value:`"mask"`},{value:`"metadata"`},{value:`"mpath"`},{value:`"path"`},{value:`"pattern"`},{value:`"polygon"`},{value:`"polyline"`},{value:`"radialGradient"`},{value:`"rect"`},{value:`"set"`},{value:`"stop"`},{value:`"switch"`},{value:`"textPath"`},{value:`"tspan"`},{value:`"use"`},{value:`"view"`}]}}},tags:{}}}catch{}})))()}var X;function init_style_module$1(){return(init_style_module$1=e((()=>{X={"panel-wrapper":`_panel-wrapper_1bxeb_1`,"single-column-item":`_single-column-item_1bxeb_8`,"intro-text":`_intro-text_1bxeb_12`}})))()}var Z,oe,se,ce,Default,WithNonToolsPanelItems,WithOptionalItemsPlusIcon,Q,$,WithSlotFillItems,WithConditionalDefaultControl,WithConditionallyRenderedControl;function init_index_story(){return(init_index_story=e((()=>{r(),D(),k(),init_component$1(),init_component$2(),ae(),I(),j(),init_style_module$1(),Z=n(),oe=t(),{fn:se}=__STORYBOOK_MODULE_TEST__,ce={id:`components-toolspanel`,title:`Components/@wordpress-components/ToolsPanel`,component:q,subcomponents:{ToolsPanelItem:Y},argTypes:{as:{control:!1},children:{control:!1},panelId:{control:!1},resetAll:{action:`resetAll`}},tags:[`status-experimental`],args:{resetAll:se()},parameters:{controls:{expanded:!0},docs:{canvas:{sourceState:`shown`}},componentStatus:{status:`recommended`,whereUsed:`editor`}}},Default=({resetAll:e,...t})=>{let[n,r]=(0,i.useState)(),[a,o]=(0,i.useState)(),[s,c]=(0,i.useState)(),[l,u]=(0,i.useState)(),resetAll=t=>{r(void 0),c(void 0),o(void 0),u(void 0),e(t)};return(0,Z.jsx)(`div`,{className:X[`panel-wrapper`],children:(0,Z.jsx)(V,{children:(0,Z.jsxs)(q,{...t,resetAll,children:[(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!s,label:`Width`,onDeselect:()=>c(void 0),isShownByDefault:!0,children:(0,Z.jsx)(L,{label:`Width`,value:s,onChange:e=>c(e)})}),(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!n,label:`Height`,onDeselect:()=>r(void 0),isShownByDefault:!0,children:(0,Z.jsx)(L,{label:`Height`,value:n,onChange:e=>r(e)})}),(0,Z.jsx)(Y,{hasValue:()=>!!a,label:`Minimum height`,onDeselect:()=>o(void 0),isShownByDefault:!0,children:(0,Z.jsx)(L,{label:`Minimum height`,value:a,onChange:e=>o(e)})}),(0,Z.jsx)(Y,{hasValue:()=>!!l,label:`Scale`,onDeselect:()=>u(void 0),children:(0,Z.jsxs)(O,{label:`Scale`,value:l,onChange:e=>u(e),isBlock:!0,children:[(0,Z.jsx)(A,{value:`cover`,label:`Cover`}),(0,Z.jsx)(A,{value:`contain`,label:`Contain`}),(0,Z.jsx)(A,{value:`fill`,label:`Fill`})]})})]})})})},Default.args={label:`Tools Panel (default example)`},WithNonToolsPanelItems=({resetAll:e,...t})=>{let[n,r]=(0,i.useState)(),[a,o]=(0,i.useState)(),resetAll=t=>{r(void 0),o(void 0),e(t)};return(0,Z.jsx)(`div`,{className:X[`panel-wrapper`],children:(0,Z.jsx)(V,{children:(0,Z.jsxs)(q,{...t,resetAll,children:[(0,Z.jsx)(`div`,{className:X[`intro-text`],children:`This text illustrates not all items must be wrapped in a ToolsPanelItem and represented in the panel menu.`}),(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!a,label:`Width`,onDeselect:()=>o(void 0),isShownByDefault:!0,children:(0,Z.jsx)(L,{label:`Width`,value:a,onChange:e=>o(e)})}),(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!n,label:`Height`,onDeselect:()=>r(void 0),isShownByDefault:!0,children:(0,Z.jsx)(L,{label:`Height`,value:n,onChange:e=>r(e)})})]})})})},WithNonToolsPanelItems.args={...Default.args,label:`ToolsPanel (with non-menu items)`},WithOptionalItemsPlusIcon=({resetAll:e,...t})=>{let[n,r]=(0,i.useState)(!1),[a,o]=(0,i.useState)(),[s,c]=(0,i.useState)(),[l,u]=(0,i.useState)(),resetAll=t=>{o(void 0),c(void 0),u(void 0),e(t)};return(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsx)(`div`,{className:X[`panel-wrapper`],children:(0,Z.jsx)(V,{children:(0,oe.createElement)(q,{...t,resetAll,key:n?`true`:`false`},(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!l,label:`Minimum width`,onDeselect:()=>u(void 0),isShownByDefault:n,children:(0,Z.jsx)(L,{label:`Minimum width`,value:l,onChange:e=>u(e)})}),(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!s,label:`Width`,onDeselect:()=>c(void 0),isShownByDefault:!1,children:(0,Z.jsx)(L,{label:`Width`,value:s,onChange:e=>c(e)})}),(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!a,label:`Height`,onDeselect:()=>o(void 0),isShownByDefault:!1,children:(0,Z.jsx)(L,{label:`Height`,value:a,onChange:e=>o(e)})}))})}),(0,Z.jsx)(`button`,{onClick:()=>r(!n),"aria-pressed":n?`true`:`false`,style:{marginTop:`2rem`},children:n?`Make first PanelItem hidden by default`:`Make first PanelItem shown by default`})]})},WithOptionalItemsPlusIcon.args={...Default.args,label:`Tools Panel (optional items only)`},{Fill:Q,Slot:$}=M(`ToolsPanelSlot`),WithSlotFillItems=({resetAll:e,panelId:t,...n})=>{let[r,a]=(0,i.useState)({}),{width:o,height:s}=r,resetAll=(t=[])=>{let n={};t.forEach(e=>{n={...n,...e(n)}}),a(n),e(t)},updateAttribute=(e,t)=>{a({...r,[e]:t})};return(0,Z.jsxs)(N,{children:[(0,Z.jsxs)(Q,{children:[(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!o,label:`Injected Width`,onDeselect:()=>updateAttribute(`width`,void 0),resetAllFilter:()=>({width:void 0}),panelId:t,children:(0,Z.jsx)(L,{label:`Injected Width`,value:o,onChange:e=>updateAttribute(`width`,e)})}),(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!s,label:`Injected Height`,onDeselect:()=>updateAttribute(`height`,void 0),resetAllFilter:()=>({height:void 0}),panelId:t,children:(0,Z.jsx)(L,{label:`Injected Height`,value:s,onChange:e=>updateAttribute(`height`,e)})}),(0,Z.jsx)(Y,{hasValue:()=>!0,label:`Item for alternate panel`,onDeselect:()=>void 0,resetAllFilter:()=>void 0,panelId:`intended-for-another-panel-via-shared-slot`,children:(0,Z.jsx)(`p`,{children:`This panel item will not be displayed in the demo as its panelId does not match the panel being rendered.`})})]}),(0,Z.jsx)(`div`,{className:X[`panel-wrapper`],children:(0,Z.jsx)(V,{children:(0,Z.jsx)(q,{...n,resetAll,panelId:t,children:(0,Z.jsx)($,{})})})})]})},WithSlotFillItems.args={...Default.args,label:`Tools Panel With SlotFill Items`,panelId:`unique-tools-panel-id`},WithConditionalDefaultControl=({resetAll:e,panelId:t,...n})=>{let[r,a]=(0,i.useState)({}),{height:o,scale:s}=r,resetAll=(t=[])=>{let n={};t.forEach(e=>{n={...n,...e(n)}}),a(n),e(t)},updateAttribute=(e,t)=>{a({...r,[e]:t})};return(0,Z.jsxs)(N,{children:[(0,Z.jsxs)(Q,{children:[(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!o,label:`Injected Height`,onDeselect:()=>updateAttribute(`height`,void 0),resetAllFilter:()=>({height:void 0}),panelId:t,isShownByDefault:!0,children:(0,Z.jsx)(L,{label:`Injected Height`,value:o,onChange:e=>updateAttribute(`height`,e)})}),(0,Z.jsx)(Y,{hasValue:()=>!!s,label:`Scale`,onDeselect:()=>updateAttribute(`scale`,void 0),resetAllFilter:()=>({scale:void 0}),panelId:t,isShownByDefault:!!o,children:(0,Z.jsxs)(O,{label:`Scale`,value:s,onChange:e=>updateAttribute(`scale`,e),isBlock:!0,children:[(0,Z.jsx)(A,{value:`cover`,label:`Cover`}),(0,Z.jsx)(A,{value:`contain`,label:`Contain`}),(0,Z.jsx)(A,{value:`fill`,label:`Fill`})]})})]}),(0,Z.jsx)(`div`,{className:X[`panel-wrapper`],children:(0,Z.jsx)(V,{children:(0,Z.jsx)(q,{...n,resetAll,panelId:t,children:(0,Z.jsx)($,{})})})})]})},WithConditionalDefaultControl.args={...Default.args,label:`Tools Panel With Conditional Default via SlotFill`,panelId:`unique-tools-panel-id`},WithConditionallyRenderedControl=({resetAll:e,panelId:t,...n})=>{let[r,a]=(0,i.useState)({}),{height:o,scale:s}=r,resetAll=(t=[])=>{let n={};t.forEach(e=>{n={...n,...e(n)}}),a(n),e(t)},updateAttribute=(e,t)=>{a({...r,[e]:t})};return(0,Z.jsxs)(N,{children:[(0,Z.jsxs)(Q,{children:[(0,Z.jsx)(Y,{className:X[`single-column-item`],hasValue:()=>!!o,label:`Injected Height`,onDeselect:()=>{updateAttribute(`scale`,void 0),updateAttribute(`height`,void 0)},resetAllFilter:()=>({height:void 0}),panelId:t,isShownByDefault:!0,children:(0,Z.jsx)(L,{label:`Injected Height`,value:o,onChange:e=>updateAttribute(`height`,e)})}),!!o&&(0,Z.jsx)(Y,{hasValue:()=>!!s,label:`Scale`,onDeselect:()=>updateAttribute(`scale`,void 0),resetAllFilter:()=>({scale:void 0}),panelId:t,isShownByDefault:!0,children:(0,Z.jsxs)(O,{label:`Scale`,value:s,onChange:e=>updateAttribute(`scale`,e),isBlock:!0,children:[(0,Z.jsx)(A,{value:`cover`,label:`Cover`}),(0,Z.jsx)(A,{value:`contain`,label:`Contain`}),(0,Z.jsx)(A,{value:`fill`,label:`Fill`})]})})]}),(0,Z.jsx)(`div`,{className:X[`panel-wrapper`],children:(0,Z.jsx)(V,{children:(0,Z.jsx)(q,{...n,resetAll,panelId:t,children:(0,Z.jsx)($,{})})})})]})},WithConditionallyRenderedControl.args={...Default.args,label:`Tools Panel With Conditionally Rendered Item via SlotFill`,panelId:`unique-tools-panel-id`},Default.parameters={...Default.parameters,docs:{...Default.parameters?.docs,source:{originalSource:`({
  resetAll: resetAllProp,
  ...props
}) => {
  const [height, setHeight] = useState<string | undefined>();
  const [minHeight, setMinHeight] = useState<string | undefined>();
  const [width, setWidth] = useState<string | undefined>();
  const [scale, setScale] = useState<number | string | undefined>();
  const resetAll: typeof resetAllProp = filters => {
    setHeight(undefined);
    setWidth(undefined);
    setMinHeight(undefined);
    setScale(undefined);
    resetAllProp(filters);
  };
  return <div className={styles['panel-wrapper']}>
            <Panel>
                <ToolsPanel {...props} resetAll={resetAll}>
                    <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!width} label="Width" onDeselect={() => setWidth(undefined)} isShownByDefault>
                        <UnitControl label="Width" value={width} onChange={next => setWidth(next)} />
                    </ToolsPanelItem>
                    <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!height} label="Height" onDeselect={() => setHeight(undefined)} isShownByDefault>
                        <UnitControl label="Height" value={height} onChange={next => setHeight(next)} />
                    </ToolsPanelItem>
                    <ToolsPanelItem hasValue={() => !!minHeight} label="Minimum height" onDeselect={() => setMinHeight(undefined)} isShownByDefault>
                        <UnitControl label="Minimum height" value={minHeight} onChange={next => setMinHeight(next)} />
                    </ToolsPanelItem>
                    <ToolsPanelItem hasValue={() => !!scale} label="Scale" onDeselect={() => setScale(undefined)}>
                        <ToggleGroupControl label="Scale" value={scale} onChange={next => setScale(next)} isBlock>
                            <ToggleGroupControlOption value="cover" label="Cover" />
                            <ToggleGroupControlOption value="contain" label="Contain" />
                            <ToggleGroupControlOption value="fill" label="Fill" />
                        </ToggleGroupControl>
                    </ToolsPanelItem>
                </ToolsPanel>
            </Panel>
        </div>;
}`,...Default.parameters?.docs?.source}}},WithNonToolsPanelItems.parameters={...WithNonToolsPanelItems.parameters,docs:{...WithNonToolsPanelItems.parameters?.docs,source:{originalSource:`({
  resetAll: resetAllProp,
  ...props
}) => {
  const [height, setHeight] = useState<string | undefined>();
  const [width, setWidth] = useState<string | undefined>();
  const resetAll: typeof resetAllProp = filters => {
    setHeight(undefined);
    setWidth(undefined);
    resetAllProp(filters);
  };
  return <div className={styles['panel-wrapper']}>
            <Panel>
                <ToolsPanel {...props} resetAll={resetAll}>
                    <div className={styles['intro-text']}>
                        This text illustrates not all items must be wrapped in a
                        ToolsPanelItem and represented in the panel menu.
                    </div>
                    <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!width} label="Width" onDeselect={() => setWidth(undefined)} isShownByDefault>
                        <UnitControl label="Width" value={width} onChange={next => setWidth(next)} />
                    </ToolsPanelItem>
                    <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!height} label="Height" onDeselect={() => setHeight(undefined)} isShownByDefault>
                        <UnitControl label="Height" value={height} onChange={next => setHeight(next)} />
                    </ToolsPanelItem>
                </ToolsPanel>
            </Panel>
        </div>;
}`,...WithNonToolsPanelItems.parameters?.docs?.source}}},WithOptionalItemsPlusIcon.parameters={...WithOptionalItemsPlusIcon.parameters,docs:{...WithOptionalItemsPlusIcon.parameters?.docs,source:{originalSource:`({
  resetAll: resetAllProp,
  ...props
}) => {
  const [isFirstToolsPanelItemShownByDefault, setIsFirstToolsPanelItemShownByDefault] = useState(false);
  const [height, setHeight] = useState<string | undefined>();
  const [width, setWidth] = useState<string | undefined>();
  const [minWidth, setMinWidth] = useState<string | undefined>();
  const resetAll: typeof resetAllProp = filters => {
    setHeight(undefined);
    setWidth(undefined);
    setMinWidth(undefined);
    resetAllProp(filters);
  };
  return <>
            <div className={styles['panel-wrapper']}>
                <Panel>
                    <ToolsPanel {...props} resetAll={resetAll}
        // \`key\` property here is used as a hack to force \`ToolsPanel\` to re-render
        // See https://github.com/WordPress/gutenberg/pull/38262/files#r793422991
        key={isFirstToolsPanelItemShownByDefault ? 'true' : 'false'}>
                        <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!minWidth} label="Minimum width" onDeselect={() => setMinWidth(undefined)} isShownByDefault={isFirstToolsPanelItemShownByDefault}>
                            <UnitControl label="Minimum width" value={minWidth} onChange={next => setMinWidth(next)} />
                        </ToolsPanelItem>
                        <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!width} label="Width" onDeselect={() => setWidth(undefined)} isShownByDefault={false}>
                            <UnitControl label="Width" value={width} onChange={next => setWidth(next)} />
                        </ToolsPanelItem>
                        <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!height} label="Height" onDeselect={() => setHeight(undefined)} isShownByDefault={false}>
                            <UnitControl label="Height" value={height} onChange={next => setHeight(next)} />
                        </ToolsPanelItem>
                    </ToolsPanel>
                </Panel>
            </div>

            <button onClick={() => setIsFirstToolsPanelItemShownByDefault(!isFirstToolsPanelItemShownByDefault)} aria-pressed={isFirstToolsPanelItemShownByDefault ? 'true' : 'false'} style={{
      marginTop: '2rem'
    }}>
                {isFirstToolsPanelItemShownByDefault ? 'Make first PanelItem hidden by default' : 'Make first PanelItem shown by default'}
            </button>
        </>;
}`,...WithOptionalItemsPlusIcon.parameters?.docs?.source}}},WithSlotFillItems.parameters={...WithSlotFillItems.parameters,docs:{...WithSlotFillItems.parameters?.docs,source:{originalSource:`({
  resetAll: resetAllProp,
  panelId,
  ...props
}) => {
  const [attributes, setAttributes] = useState<{
    width?: string;
    height?: string;
  }>({});
  const {
    width,
    height
  } = attributes;
  const resetAll: typeof resetAllProp = (resetFilters = []) => {
    let newAttributes: typeof attributes = {};
    resetFilters.forEach(resetFilter => {
      newAttributes = {
        ...newAttributes,
        ...resetFilter(newAttributes)
      };
    });
    setAttributes(newAttributes);
    resetAllProp(resetFilters);
  };
  const updateAttribute = (name: string, value?: any) => {
    setAttributes({
      ...attributes,
      [name]: value
    });
  };
  return <SlotFillProvider>
            <ToolsPanelItems>
                <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!width} label="Injected Width" onDeselect={() => updateAttribute('width', undefined)} resetAllFilter={() => ({
        width: undefined
      })} panelId={panelId}>
                    <UnitControl label="Injected Width" value={width} onChange={next => updateAttribute('width', next)} />
                </ToolsPanelItem>
                <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!height} label="Injected Height" onDeselect={() => updateAttribute('height', undefined)} resetAllFilter={() => ({
        height: undefined
      })} panelId={panelId}>
                    <UnitControl label="Injected Height" value={height} onChange={next => updateAttribute('height', next)} />
                </ToolsPanelItem>
                <ToolsPanelItem hasValue={() => true} label="Item for alternate panel" onDeselect={() => undefined} resetAllFilter={() => undefined} panelId="intended-for-another-panel-via-shared-slot">
                    <p>
                        This panel item will not be displayed in the demo as its
                        panelId does not match the panel being rendered.
                    </p>
                </ToolsPanelItem>
            </ToolsPanelItems>
            <div className={styles['panel-wrapper']}>
                <Panel>
                    <ToolsPanel {...props} resetAll={resetAll} panelId={panelId}>
                        <Slot />
                    </ToolsPanel>
                </Panel>
            </div>
        </SlotFillProvider>;
}`,...WithSlotFillItems.parameters?.docs?.source}}},WithConditionalDefaultControl.parameters={...WithConditionalDefaultControl.parameters,docs:{...WithConditionalDefaultControl.parameters?.docs,source:{originalSource:`({
  resetAll: resetAllProp,
  panelId,
  ...props
}) => {
  const [attributes, setAttributes] = useState<{
    height?: string;
    scale?: number | string;
  }>({});
  const {
    height,
    scale
  } = attributes;
  const resetAll: typeof resetAllProp = (resetFilters = []) => {
    let newAttributes: typeof attributes = {};
    resetFilters.forEach(resetFilter => {
      newAttributes = {
        ...newAttributes,
        ...resetFilter(newAttributes)
      };
    });
    setAttributes(newAttributes);
    resetAllProp(resetFilters);
  };
  const updateAttribute = (name: string, value?: any) => {
    setAttributes({
      ...attributes,
      [name]: value
    });
  };
  return <SlotFillProvider>
            <ToolsPanelItems>
                <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!height} label="Injected Height" onDeselect={() => updateAttribute('height', undefined)} resetAllFilter={() => ({
        height: undefined
      })} panelId={panelId} isShownByDefault>
                    <UnitControl label="Injected Height" value={height} onChange={next => updateAttribute('height', next)} />
                </ToolsPanelItem>
                <ToolsPanelItem hasValue={() => !!scale} label="Scale" onDeselect={() => updateAttribute('scale', undefined)} resetAllFilter={() => ({
        scale: undefined
      })} panelId={panelId} isShownByDefault={!!height}>
                    <ToggleGroupControl label="Scale" value={scale} onChange={next => updateAttribute('scale', next)} isBlock>
                        <ToggleGroupControlOption value="cover" label="Cover" />
                        <ToggleGroupControlOption value="contain" label="Contain" />
                        <ToggleGroupControlOption value="fill" label="Fill" />
                    </ToggleGroupControl>
                </ToolsPanelItem>
            </ToolsPanelItems>
            <div className={styles['panel-wrapper']}>
                <Panel>
                    <ToolsPanel {...props} resetAll={resetAll} panelId={panelId}>
                        <Slot />
                    </ToolsPanel>
                </Panel>
            </div>
        </SlotFillProvider>;
}`,...WithConditionalDefaultControl.parameters?.docs?.source}}},WithConditionallyRenderedControl.parameters={...WithConditionallyRenderedControl.parameters,docs:{...WithConditionallyRenderedControl.parameters?.docs,source:{originalSource:`({
  resetAll: resetAllProp,
  panelId,
  ...props
}) => {
  const [attributes, setAttributes] = useState<{
    height?: string;
    scale?: number | string;
  }>({});
  const {
    height,
    scale
  } = attributes;
  const resetAll: typeof resetAllProp = (resetFilters = []) => {
    let newAttributes: typeof attributes = {};
    resetFilters.forEach(resetFilter => {
      newAttributes = {
        ...newAttributes,
        ...resetFilter(newAttributes)
      };
    });
    setAttributes(newAttributes);
    resetAllProp(resetFilters);
  };
  const updateAttribute = (name: string, value?: any) => {
    setAttributes({
      ...attributes,
      [name]: value
    });
  };
  return <SlotFillProvider>
            <ToolsPanelItems>
                <ToolsPanelItem className={styles['single-column-item']} hasValue={() => !!height} label="Injected Height" onDeselect={() => {
        updateAttribute('scale', undefined);
        updateAttribute('height', undefined);
      }} resetAllFilter={() => ({
        height: undefined
      })} panelId={panelId} isShownByDefault>
                    <UnitControl label="Injected Height" value={height} onChange={next => updateAttribute('height', next)} />
                </ToolsPanelItem>
                {!!height && <ToolsPanelItem hasValue={() => !!scale} label="Scale" onDeselect={() => updateAttribute('scale', undefined)} resetAllFilter={() => ({
        scale: undefined
      })} panelId={panelId} isShownByDefault>
                        <ToggleGroupControl label="Scale" value={scale} onChange={next => updateAttribute('scale', next)} isBlock>
                            <ToggleGroupControlOption value="cover" label="Cover" />
                            <ToggleGroupControlOption value="contain" label="Contain" />
                            <ToggleGroupControlOption value="fill" label="Fill" />
                        </ToggleGroupControl>
                    </ToolsPanelItem>}
            </ToolsPanelItems>
            <div className={styles['panel-wrapper']}>
                <Panel>
                    <ToolsPanel {...props} resetAll={resetAll} panelId={panelId}>
                        <Slot />
                    </ToolsPanel>
                </Panel>
            </div>
        </SlotFillProvider>;
}`,...WithConditionallyRenderedControl.parameters?.docs?.source}}}})))()}init_index_story();export{Default,WithConditionalDefaultControl,WithConditionallyRenderedControl,WithNonToolsPanelItems,WithOptionalItemsPlusIcon,WithSlotFillItems,ce as default};