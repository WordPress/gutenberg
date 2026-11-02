import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{Fc as n,n as r}from"./build-module-CPA2Y5FH.js";import{i,r as a}from"./menu-group-COjzD6Q4.js";function MenuItemsChoice({choices:e=[],onHover:t=noop,onSelect:r,value:i}){return(0,o.jsx)(o.Fragment,{children:e.map(e=>{let s=i===e.value;return(0,o.jsx)(a,{role:`menuitemradio`,disabled:e.disabled,icon:s?n:null,info:e.info,isSelected:s,shortcut:e.shortcut,className:`components-menu-items-choice`,onClick:()=>{s||r(e.value)},onMouseEnter:()=>t(e.value),onMouseLeave:()=>t(null),"aria-label":e[`aria-label`],children:e.label},e.value)})})}var o,noop;function init_menu_items_choice(){return(init_menu_items_choice=e((()=>{r(),i(),o=t(),noop=()=>{};try{MenuItemsChoice.__docgenInfo={description:`\`MenuItemsChoice\` functions similarly to a set of \`MenuItem\`s, but allows the user to select one option from a set of multiple choices.


\`\`\`jsx
import { MenuGroup, MenuItemsChoice } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyMenuItemsChoice = () => {
	const [ mode, setMode ] = useState( 'visual' );
	const choices = [
		{
			value: 'visual',
			label: 'Visual editor',
		},
		{
			value: 'text',
			label: 'Code editor',
		},
	];

	return (
		<MenuGroup label="Editor">
			<MenuItemsChoice
				choices={ choices }
				value={ mode }
				onSelect={ ( newMode ) => setMode( newMode ) }
			/>
		</MenuGroup>
	);
};
\`\`\``,displayName:`MenuItemsChoice`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/menu-items-choice/index.tsx`,methods:[],props:{choices:{defaultValue:{value:`[]`},declarations:[{fileName:`gutenberg/packages/components/src/menu-items-choice/types.ts`,name:`TypeLiteral`}],description:`Array of choices.`,name:`choices`,required:!1,tags:{},type:{name:`readonly MenuItemChoice[]`}},value:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu-items-choice/types.ts`,name:`TypeLiteral`}],description:"Value of currently selected choice (should match a `value` property\nfrom a choice in `choices`).",name:`value`,required:!0,tags:{},type:{name:`string`}},onSelect:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/menu-items-choice/types.ts`,name:`TypeLiteral`}],description:`Callback function to be called with the selected choice when user
selects a new choice.`,name:`onSelect`,required:!0,tags:{},type:{name:`(value: string) => void`}},onHover:{defaultValue:{value:`() => {}`},declarations:[{fileName:`gutenberg/packages/components/src/menu-items-choice/types.ts`,name:`TypeLiteral`}],description:`Callback function to be called with a choice when user
hovers over a new choice (will be empty on mouse leave).`,name:`onHover`,required:!1,tags:{},type:{name:`((value: string | null) => void)`}}},tags:{}}}catch{}})))()}export{init_menu_items_choice as n,MenuItemsChoice as t};