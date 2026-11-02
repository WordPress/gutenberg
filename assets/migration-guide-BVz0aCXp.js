import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{n as s,t as c}from"./index.story-BFwU4w2v.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,p:`p`,pre:`pre`,...a(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r,{of:c,name:`Migration Guide`}),`
`,(0,l.jsx)(t.h1,{id:`toggle-family-migration-guide`,children:`Toggle family migration guide`}),`
`,(0,l.jsxs)(t.p,{children:[`Migrate from `,(0,l.jsx)(t.a,{href:`?path=/docs/components-togglecontrol--docs`,children:(0,l.jsx)(t.code,{children:`ToggleControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/components`}),` to `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-switchcontrol--docs`,children:(0,l.jsx)(t.code,{children:`SwitchControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),`. For custom compositions, replace `,(0,l.jsx)(t.a,{href:`?path=/docs/components-formtoggle--docs`,children:(0,l.jsx)(t.code,{children:`FormToggle`})}),` with `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-switch--docs`,children:(0,l.jsx)(t.code,{children:`Switch`})}),`.`]}),`
`,(0,l.jsx)(t.h2,{id:`basic-migration`,children:`Basic migration`}),`
`,(0,l.jsx)(t.p,{children:`Rename the component, callback, and help props:`}),`
`,(0,l.jsx)(t.p,{children:`Before:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { ToggleControl } from '@wordpress/components';

<ToggleControl
	label="Fixed background"
	checked={ hasFixedBackground }
	onChange={ setHasFixedBackground }
	help="Keep the background fixed while scrolling."
/>;
`})}),`
`,(0,l.jsx)(t.p,{children:`After:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { SwitchControl } from '@wordpress/ui';

<SwitchControl
	label="Fixed background"
	checked={ hasFixedBackground }
	onCheckedChange={ setHasFixedBackground }
	description="Keep the background fixed while scrolling."
/>;
`})}),`
`,(0,l.jsx)(t.h2,{id:`prop-mapping`,children:`Prop mapping`}),`
`,(0,l.jsx)(n,{children:"\n| `ToggleControl` | `SwitchControl` | Notes |\n| --- | --- | --- |\n| `checked` | `checked` | Continue passing the state for a controlled switch. |\n| `onChange` | `onCheckedChange` | Receives the next checked state as a boolean. |\n| `help` | `description` | Use plain text only. |\n| `help` with links or other markup | `details` | Use when the help text needs semantic content. |\n| `label` | `label` | The new control requires a plain string. See [Labels](#labels). |\n"}),`
`,(0,l.jsxs)(t.p,{children:[`If `,(0,l.jsx)(t.code,{children:`help`}),` is a function, evaluate it with the current checked state and pass the result to `,(0,l.jsx)(t.code,{children:`description`}),` or `,(0,l.jsx)(t.code,{children:`details`}),`:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<SwitchControl
	label="Fixed background"
	checked={ hasFixedBackground }
	onCheckedChange={ setHasFixedBackground }
	description={ getHelpText( hasFixedBackground ) }
/>
`})}),`
`,(0,l.jsx)(t.h2,{id:`labels`,children:`Labels`}),`
`,(0,l.jsxs)(t.p,{children:[(0,l.jsx)(t.code,{children:`SwitchControl`}),` requires a `,(0,l.jsx)(t.code,{children:`label`}),` prop with a plain `,(0,l.jsx)(t.code,{children:`string`}),` value. The legacy `,(0,l.jsx)(t.code,{children:`ToggleControl`}),` accepts a `,(0,l.jsx)(t.code,{children:`ReactNode`}),`.`]}),`
`,(0,l.jsx)(t.p,{children:`When the label text is already visible elsewhere, pass a descriptive string and hide it visually:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<SwitchControl
	label="Fixed background"
	hideLabelFromVision
	checked={ hasFixedBackground }
	onCheckedChange={ setHasFixedBackground }
/>
`})}),`
`,(0,l.jsxs)(t.p,{children:[`To customize the label typography, compose `,(0,l.jsx)(t.code,{children:`Switch`}),` with `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,l.jsx)(t.code,{children:`Field`})}),`:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { Field, Stack, Switch } from '@wordpress/ui';

<Field.Root render={ <Stack gap="sm" align="start" /> }>
	<Switch
		checked={ hasFixedBackground }
		onCheckedChange={ setHasFixedBackground }
	/>
	<Field.Label
		variant="plain"
		style={ { fontFamily: 'var(--wpds-typography-font-family-mono)' } }
	>
		Fixed background
	</Field.Label>
</Field.Root>;
`})}),`
`,(0,l.jsx)(t.h2,{id:`formtoggle`,children:`FormToggle`}),`
`,(0,l.jsxs)(t.p,{children:[(0,l.jsx)(t.code,{children:`FormToggle.onChange`}),` receives an input change event. `,(0,l.jsx)(t.code,{children:`Switch.onCheckedChange`}),` receives the next checked state as a boolean, so remove any `,(0,l.jsx)(t.code,{children:`event.target.checked`}),` access:`]}),`
`,(0,l.jsx)(t.p,{children:`Before:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { FormToggle } from '@wordpress/components';

<FormToggle
	aria-label="Fixed background"
	checked={ hasFixedBackground }
	onChange={ ( event ) => setHasFixedBackground( event.target.checked ) }
/>;
`})}),`
`,(0,l.jsx)(t.p,{children:`After:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { Switch } from '@wordpress/ui';

<Switch
	aria-label="Fixed background"
	checked={ hasFixedBackground }
	onCheckedChange={ setHasFixedBackground }
/>;
`})}),`
`,(0,l.jsxs)(t.p,{children:[`Prefer `,(0,l.jsx)(t.code,{children:`SwitchControl`}),` for a standard labeled switch. Use `,(0,l.jsx)(t.code,{children:`Field.Label`}),` for a visible label in custom compositions.`]}),`
`,(0,l.jsx)(t.h2,{id:`refs-and-semantics`,children:`Refs and semantics`}),`
`,(0,l.jsxs)(t.p,{children:[`The legacy components forward refs to an `,(0,l.jsx)(t.code,{children:`HTMLInputElement`}),`. The new components forward refs to an `,(0,l.jsx)(t.code,{children:`HTMLSpanElement`}),` with switch semantics. Update ref types and any code that reads input properties such as `,(0,l.jsx)(t.code,{children:`ref.current.checked`}),` to use the controlled state instead.`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var l;function init_migration_guide(){return(init_migration_guide=e((()=>{l=i(),o(),t(),s()})))()}init_migration_guide();export{MDXContent as default};