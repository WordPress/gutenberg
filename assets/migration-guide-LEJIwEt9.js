import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{n as s,t as c}from"./index.story-B8-O7jqV.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,p:`p`,pre:`pre`,...a(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r,{of:c,name:`Migration Guide`}),`
`,(0,l.jsx)(t.h1,{id:`textareacontrol-migration-guide`,children:`TextareaControl migration guide`}),`
`,(0,l.jsxs)(t.p,{children:[`Migrate from `,(0,l.jsx)(t.a,{href:`?path=/docs/components-textareacontrol--docs`,children:(0,l.jsx)(t.code,{children:`TextareaControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/components`}),` to `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-textareacontrol--docs`,children:(0,l.jsx)(t.code,{children:`TextareaControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),`.`]}),`
`,(0,l.jsx)(t.h2,{id:`basic-migration`,children:`Basic migration`}),`
`,(0,l.jsx)(t.p,{children:`Update the import and swap the callback prop:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`// Before
import { TextareaControl } from '@wordpress/components';

<TextareaControl
	label="Description"
	value={ value }
	onChange={ setValue }
	help="Enter a short description."
/>;

// After
import { TextareaControl } from '@wordpress/ui';

<TextareaControl
	label="Description"
	value={ value }
	onValueChange={ setValue }
	description="Enter a short description."
/>;
`})}),`
`,(0,l.jsx)(t.h2,{id:`prop-mapping`,children:`Prop mapping`}),`
`,(0,l.jsx)(n,{children:"\n| `@wordpress/components` | `@wordpress/ui` | Notes |\n| --- | --- | --- |\n| `onChange` | `onValueChange` | Receives the next string value on every change. |\n| `help` | `description` | Use plain text only. |\n| `help` with links or other markup | `details` | Use when the help text needs semantic content. |\n| `hideLabelFromVision` | `hideLabelFromVision` | Same behavior. |\n| `rows` | `rows` | Same default (`4`). |\n"}),`
`,(0,l.jsx)(t.h2,{id:`labels`,children:`Labels`}),`
`,(0,l.jsxs)(t.p,{children:[(0,l.jsx)(t.code,{children:`TextareaControl`}),` requires a `,(0,l.jsx)(t.code,{children:`label`}),` prop with a plain `,(0,l.jsx)(t.code,{children:`string`}),` value. The legacy component treats `,(0,l.jsx)(t.code,{children:`label`}),` as optional.`]}),`
`,(0,l.jsx)(t.p,{children:`When the visible label text already exists elsewhere, pass a descriptive string and hide it visually:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<TextareaControl
	label="Notes"
	hideLabelFromVision
	value={ value }
	onValueChange={ setValue }
/>;
`})}),`
`,(0,l.jsxs)(t.p,{children:[`When the label is not a plain string, or you need a custom layout, compose the `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-textarea--docs`,children:(0,l.jsx)(t.code,{children:`Textarea`})}),` and `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,l.jsx)(t.code,{children:`Field`})}),` primitives instead of `,(0,l.jsx)(t.code,{children:`TextareaControl`}),`:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { Field, Textarea } from '@wordpress/ui';

<Field.Root>
	<Field.Label>
		Custom <strong>label</strong> content
	</Field.Label>
	<Textarea
		value={ value }
		onValueChange={ setValue }
	/>
</Field.Root>
`})}),`
`,(0,l.jsxs)(t.p,{children:[`See the `,(0,l.jsxs)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:[(0,l.jsx)(t.code,{children:`Field`}),` stories`]}),` for other association patterns, such as external labels with `,(0,l.jsx)(t.code,{children:`aria-labelledby`}),`.`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var l;function init_migration_guide(){return(init_migration_guide=e((()=>{l=i(),o(),t(),s()})))()}init_migration_guide();export{MDXContent as default};