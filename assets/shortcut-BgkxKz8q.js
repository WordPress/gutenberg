import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";function Shortcut(e){let{shortcut:t,className:r}=e;if(!t)return null;let i,a;return typeof t==`string`&&(i=t),typeof t==`object`&&t&&(i=t.display,a=t.ariaLabel),(0,n.jsx)(`span`,{className:r,"aria-label":a,children:i})}var n;function init_shortcut(){return(init_shortcut=e((()=>{n=t();try{Shortcut.__docgenInfo={description:`Shortcut component is used to display keyboard shortcuts, and it can be customized with a custom display and aria label if needed.

\`\`\`jsx
import { Shortcut } from '@wordpress/components';

const MyShortcut = () => {
	return (
		<Shortcut shortcut={{ display: 'Ctrl + S', ariaLabel: 'Save' }} />
	);
};
\`\`\``,displayName:`Shortcut`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/components/src/shortcut/index.tsx`,methods:[],props:{className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/shortcut/types.ts`,name:`TypeLiteral`}],description:`Classname to apply to the shortcut.`,name:`className`,required:!1,tags:{},type:{name:`string`}},shortcut:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/components/src/shortcut/types.ts`,name:`TypeLiteral`}],description:`Shortcut configuration`,name:`shortcut`,required:!1,tags:{},type:{name:`string | { display: string; ariaLabel: string; }`}}},tags:{}}}catch{}})))()}export{init_shortcut as n,Shortcut as t};