import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,u as n}from"./blocks-Bi8bw4xb.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{i,r as a}from"./react-sPqhvIIV.js";import{n as o,t as s}from"./index.story-BR7Nc2_K.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,p:`p`,pre:`pre`,...i(),...e.components};return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(n,{of:s,name:`Migration Guide`}),`
`,(0,c.jsx)(t.h1,{id:`tip-migration-guide`,children:`Tip migration guide`}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.code,{children:`Tip`}),` is deprecated since WordPress 7.2 and scheduled for removal in WordPress 7.4. Use `,(0,c.jsx)(t.a,{href:`?path=/docs/design-system-components-notice--docs`,children:(0,c.jsx)(t.code,{children:`Notice`})}),` from `,(0,c.jsx)(t.code,{children:`@wordpress/ui`}),` instead.`]}),`
`,(0,c.jsx)(t.h2,{id:`basic-migration`,children:`Basic migration`}),`
`,(0,c.jsxs)(t.p,{children:[`Use `,(0,c.jsx)(t.code,{children:`Notice.Root`}),` with `,(0,c.jsx)(t.code,{children:`intent="info"`}),` and `,(0,c.jsx)(t.code,{children:`Notice.Description`}),` for the content. Pass the `,(0,c.jsx)(t.code,{children:`tip`}),` icon from `,(0,c.jsx)(t.code,{children:`@wordpress/icons`}),` to retain the light-bulb icon. The notice uses the design system's info colors, border, and padding.`]}),`
`,(0,c.jsx)(t.pre,{children:(0,c.jsx)(t.code,{className:`language-jsx`,children:`import { tip } from '@wordpress/icons';
import { Notice } from '@wordpress/ui';

const MyTip = ( { children } ) => (
	<Notice.Root intent="info" icon={ tip }>
		<Notice.Description>{ children }</Notice.Description>
	</Notice.Root>
);
`})}),`
`,(0,c.jsxs)(t.p,{children:[`For a call to action, use `,(0,c.jsx)(t.code,{children:`Notice.Actions`}),` and `,(0,c.jsx)(t.code,{children:`Notice.ActionLink`}),`. Pass `,(0,c.jsx)(t.code,{children:`openInNewTab`}),` to retain an external link's new-tab indicator and accessible notice. Add `,(0,c.jsx)(t.code,{children:`Notice.CloseIconButton`}),` only if the consuming interface supports dismissal.`]}),`
`,(0,c.jsxs)(t.p,{children:[`Like Tip, Notice does not announce its content automatically. Consumers must announce dynamic updates when needed. See the `,(0,c.jsx)(t.a,{href:`?path=/docs/design-system-components-notice-announcements--docs`,children:`Notice announcement guidance`}),`.`]}),`
`,(0,c.jsxs)(t.p,{children:[`The `,(0,c.jsx)(t.code,{children:`.components-tip`}),` selector belongs to the legacy component. Update custom consumer styles when migrating to Notice rather than carrying this class name into the new composition.`]})]})}function MDXContent(e={}){let{wrapper:t}={...i(),...e.components};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var c;function init_migration_guide(){return(init_migration_guide=e((()=>{c=r(),a(),t(),o()})))()}init_migration_guide();export{MDXContent as default};