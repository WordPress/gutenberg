import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{a as i,i as a}from"./iframe-y9psNcyg.js";import{n as o,wi as s}from"./build-module-CPA2Y5FH.js";import{i as c,n as l,o as u,t as d}from"./use-context-system-CiYx-c7e.js";import{n as f,t as p}from"./button-8ccnOjTA.js";import{n as m,t as h}from"./dropdown-Q5LPKa4v.js";import{n as g,t as _}from"./menu-CGEEGcXg.js";function mergeProps(e={},t={}){let n={...e,...t};return t.className&&e.className&&(n.className=a(t.className,e.className)),n}function isFunction(e){return typeof e==`function`}function UnconnectedDropdownMenu(e){let{children:t,className:n,controls:i,icon:o=s,label:c,popoverProps:u,toggleProps:d,menuProps:f,disableOpenOnArrowDown:m=!1,text:g,noIcons:y,open:b,defaultOpen:x,onToggle:S,variant:C}=l(e,`DropdownMenu`),[w,T]=(0,r.useState)(!0);if((0,r.useEffect)(()=>{b===!1&&T(!0)},[b]),!i?.length&&!isFunction(t))return null;let E;i?.length&&(E=i,Array.isArray(E[0])||(E=[i]));let D=mergeProps({className:`components-dropdown-menu__popover`,variant:C},u),onPopoverFocusCapture=e=>{u?.onFocusCapture?.(e),!w&&u?.focusOnMount===void 0&&e.target===e.currentTarget&&e.currentTarget.ownerDocument.activeElement===e.currentTarget&&e.currentTarget.querySelector(`[role="menu"]`)?.focus({preventScroll:!0})};return(0,v.jsx)(h,{className:n,popoverProps:{...D,focusOnMount:u?.focusOnMount??(!w||`firstElement`),onFocusCapture:onPopoverFocusCapture},renderToggle:({isOpen:e,onToggle:t})=>{let openOnArrowDown=n=>{m||d?.disabled||!e&&n.code===`ArrowDown`&&(n.preventDefault(),T(!0),t())},{as:n=p,...r}=d??{},i=mergeProps({className:a(`components-dropdown-menu__toggle`,{"is-opened":e})},r);return(0,v.jsx)(n,{...i,icon:o,onClick:(n=>{if(!e){let e=n.nativeEvent;T(n.detail===0||`pointerType`in e&&e.pointerType===``)}t(),i.onClick&&i.onClick(n)}),onKeyDown:(e=>{openOnArrowDown(e),i.onKeyDown&&i.onKeyDown(e)}),"aria-haspopup":`true`,"aria-expanded":e,label:c,text:g,showTooltip:d?.showTooltip??!0,children:i.children})},renderContent:e=>{let n=mergeProps({"aria-label":c,className:a(`components-dropdown-menu__menu`,{"no-icons":y})},f);return(0,v.jsxs)(_,{...n,role:`menu`,tabIndex:n.tabIndex??-1,children:[isFunction(t)?t(e):null,E?.flatMap((t,n)=>t.map((t,r)=>(0,v.jsx)(p,{size:`compact`,onClick:n=>{n.stopPropagation(),e.onClose(),t.onClick&&t.onClick()},className:a(`components-dropdown-menu__menu-item`,{"has-separator":n>0&&r===0,"is-active":t.isActive,"is-icon-only":!t.title}),icon:t.icon,label:t.label,onMouseMove:e=>e.currentTarget.focus({preventScroll:!0}),"aria-checked":t.role===`menuitemcheckbox`||t.role===`menuitemradio`?t.isActive:void 0,role:t.role===`menuitemcheckbox`||t.role===`menuitemradio`?t.role:`menuitem`,accessibleWhenDisabled:!0,disabled:t.isDisabled,children:t.title},[n,r].join())))]})},open:b,defaultOpen:x,onToggle:S})}var v,y;function init_dropdown_menu(){return(init_dropdown_menu=e((()=>{i(),o(),n(),u(),d(),f(),m(),g(),v=t(),y=c(UnconnectedDropdownMenu,`DropdownMenu`);try{y.__docgenInfo={description:`
The DropdownMenu displays a list of actions (each contained in a MenuItem,
MenuItemsChoice, or MenuGroup) in a compact way. It appears in a Popover
after the user has interacted with an element (a button or icon) or when
they perform a specific action.

When building for the Gutenberg repo, use \`Menu\` from \`@wordpress/ui\` instead.
Otherwise, continue using \`DropdownMenu\` for now.

Render a Dropdown Menu with a set of controls:

\`\`\`jsx
import { DropdownMenu } from '@wordpress/components';
import {
	more,
	arrowLeft,
	arrowRight,
	arrowUp,
	arrowDown,
} from '@wordpress/icons';

const MyDropdownMenu = () => (
	<DropdownMenu
		icon={ more }
		label="Select a direction"
		controls={ [
			{
				title: 'Up',
				icon: arrowUp,
				onClick: () => console.log( 'up' ),
			},
			{
				title: 'Right',
				icon: arrowRight,
				onClick: () => console.log( 'right' ),
			},
			{
				title: 'Down',
				icon: arrowDown,
				onClick: () => console.log( 'down' ),
			},
			{
				title: 'Left',
				icon: arrowLeft,
				onClick: () => console.log( 'left' ),
			},
		] }
	/>
);
\`\`\`

Alternatively, specify a \`children\` function which returns elements valid for
use in a DropdownMenu: \`MenuItem\`, \`MenuItemsChoice\`, or \`MenuGroup\`.

\`\`\`jsx
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { more, arrowUp, arrowDown, trash } from '@wordpress/icons';

const MyDropdownMenu = () => (
	<DropdownMenu icon={ more } label="Select a direction">
		{ ( { onClose } ) => (
			<>
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
			</>
		) }
	</DropdownMenu>
);
\`\`\``,displayName:`DropdownMenu`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/dropdown-menu/index.tsx`,methods:[],props:{icon:{defaultValue:{value:`"menu"`},declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:`The icon to be shown in the collapsed menu button.`,name:`icon`,required:!1,tags:{},type:{name:`IconType | null`}},label:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:`A human-readable label to present as accessibility text on the focused
collapsed menu button.`,name:`label`,required:!0,tags:{},type:{name:`string`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:`A class name to apply to the dropdown menu's toggle element wrapper.`,name:`className`,required:!1,tags:{},type:{name:`string`}},popoverProps:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"Properties of `popoverProps` object will be passed as props to the nested\n`Popover` component.\nUse this object to modify props available for the `Popover` component that\nare not already exposed in the `DropdownMenu` component, e.g.: the\ndirection in which the popover should open relative to its parent node\nset with `position` prop.",name:`popoverProps`,required:!1,tags:{},type:{name:`Omit<Omit<Omit<WordPressComponentProps<PopoverProps, "div", false>, "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart" | "inherit" | ... 52 more ... | "whileTap"> & Pick<...>, "ref">, "children">`}},toggleProps:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"Properties of `toggleProps` object will be passed as props to the nested\n`Button` component in the `renderToggle` implementation of the `Dropdown`\ncomponent used internally.\nUse this object to modify props available for the `Button` component that\nare not already exposed in the `DropdownMenu` component, e.g.: the tooltip\ntext displayed on hover set with `tooltip` prop.",name:`toggleProps`,required:!1,tags:{},type:{name:`ToggleProps`}},menuProps:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"Properties of `menuProps` object will be passed as props to the nested\n`NavigableMenu` component in the `renderContent` implementation of the\n`Dropdown` component used internally.\nUse this object to modify props available for the `NavigableMenu`\ncomponent that are not already exposed in the `DropdownMenu` component,\ne.g.: the orientation of the menu set with `orientation` prop.",name:`menuProps`,required:!1,tags:{},type:{name:`Omit<Partial<NavigableMenuProps>, "children">`}},disableOpenOnArrowDown:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:`In some contexts, the arrow down key used to open the dropdown menu might
need to be disabled—for example when that key is used to perform another
action.`,name:`disableOpenOnArrowDown`,required:!1,tags:{},type:{name:`boolean`}},text:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"Text to display on the nested `Button` component in the `renderToggle`\nimplementation of the `Dropdown` component used internally.",name:`text`,required:!1,tags:{},type:{name:`string`}},noIcons:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"Whether or not `no-icons` should be added to the menu's `className`.",name:`noIcons`,required:!1,tags:{},type:{name:`boolean`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"A [function render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render)\nwhich should return an element or elements valid for use in a DropdownMenu:\n`MenuItem`, `MenuItemsChoice`, or `MenuGroup`. Its first argument is a\nprops object including the same values as given to a `Dropdown`'s\n`renderContent` (`isOpen`, `onToggle`, `onClose`).\n\nA valid DropdownMenu must specify a `controls` or `children` prop, or both.",name:`children`,required:!1,tags:{},type:{name:`((callbackProps: DropdownCallbackProps) => ReactNode)`}},controls:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"An array or nested array of objects describing the options to be shown in\nthe expanded menu. Each object should include an `icon` Dashicon slug\nstring, a human-readable `title` string, `isDisabled` boolean flag, and\nan `onClick` function callback to invoke when the option is selected.\n\nA valid DropdownMenu must specify a `controls` or `children` prop, or both.",name:`controls`,required:!1,tags:{},type:{name:`DropdownOption[] | DropdownOption[][]`}},open:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:"The controlled open state of the dropdown menu.\nMust be used in conjunction with `onToggle`.",name:`open`,required:!1,tags:{},type:{name:`boolean`}},defaultOpen:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:`The open state of the dropdown menu when initially rendered.
Use when you do not need to control its open state. It will be overridden
by the \`open\` prop if it is specified on the component's first render.`,name:`defaultOpen`,required:!1,tags:{},type:{name:`boolean`}},onToggle:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/dropdown-menu/types.ts`,name:`TypeLiteral`}],description:`A callback invoked when the state of the dropdown menu changes
from open to closed and vice versa.`,name:`onToggle`,required:!1,tags:{},type:{name:`((willOpen: boolean) => void)`}}},tags:{}}}catch{}})))()}export{init_dropdown_menu as n,y as t};