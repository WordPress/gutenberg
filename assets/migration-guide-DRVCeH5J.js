import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{n as s,t as c}from"./index.story-BAFYi1tg.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,p:`p`,pre:`pre`,...a(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r,{of:c,name:`Migration Guide`}),`
`,(0,l.jsx)(t.h1,{id:`checkboxcontrol-migration-guide`,children:`CheckboxControl migration guide`}),`
`,(0,l.jsxs)(t.p,{children:[`Migrate from `,(0,l.jsx)(t.a,{href:`?path=/docs/components-checkboxcontrol--docs`,children:(0,l.jsx)(t.code,{children:`CheckboxControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/components`}),` to `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-checkboxcontrol--docs`,children:(0,l.jsx)(t.code,{children:`CheckboxControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),`.`]}),`
`,(0,l.jsx)(t.h2,{id:`basic-migration`,children:`Basic migration`}),`
`,(0,l.jsx)(t.p,{children:`Update the import and replace the callback and help props:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`// Before
import { CheckboxControl } from '@wordpress/components';

<CheckboxControl
	label="Is author"
	checked={ isChecked }
	onChange={ setChecked }
	help="Give this user author permissions."
/>;

// After
import { CheckboxControl } from '@wordpress/ui';

<CheckboxControl
	label="Is author"
	checked={ isChecked }
	onCheckedChange={ setChecked }
	description="Give this user author permissions."
/>;
`})}),`
`,(0,l.jsx)(t.h2,{id:`prop-mapping`,children:`Prop mapping`}),`
`,(0,l.jsx)(n,{children:"\n| `@wordpress/components` | `@wordpress/ui` | Notes |\n| --- | --- | --- |\n| `onChange` | `onCheckedChange` | Receives the next checked state as a boolean. |\n| `help` | `description` | Use plain text only. |\n| `help` with links or other markup | `details` | Use when the help text needs semantic content. |\n| `checked` | `checked` | Continue passing the state for a controlled checkbox. |\n"}),`
`,(0,l.jsx)(t.h2,{id:`form-values`,children:`Form values`}),`
`,(0,l.jsxs)(t.p,{children:[`When a checked checkbox has a `,(0,l.jsx)(t.code,{children:`name`}),` but no `,(0,l.jsx)(t.code,{children:`value`}),`, the legacy component submits `,(0,l.jsx)(t.code,{children:`"1"`}),` with the form, while the new component submits `,(0,l.jsx)(t.code,{children:`"on"`}),`, the native default for checkboxes. If your form handler expects the legacy value, pass `,(0,l.jsx)(t.code,{children:`value="1"`}),` to the new component:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<CheckboxControl
	name="isAuthor"
	value="1"
	label="Is author"
	checked={ isChecked }
	onCheckedChange={ setChecked }
/>
`})}),`
`,(0,l.jsxs)(t.p,{children:[`If the legacy component already has a custom `,(0,l.jsx)(t.code,{children:`value`}),`, keep that value instead.`]}),`
`,(0,l.jsx)(t.h2,{id:`labels`,children:`Labels`}),`
`,(0,l.jsxs)(t.p,{children:[`The new `,(0,l.jsx)(t.code,{children:`CheckboxControl`}),` requires a `,(0,l.jsx)(t.code,{children:`label`}),` prop with a plain `,(0,l.jsx)(t.code,{children:`string`}),` value. The legacy component treats `,(0,l.jsx)(t.code,{children:`label`}),` as optional. Give every checkbox a descriptive label, even when the text is already visible elsewhere:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<CheckboxControl
	label="Receive notifications"
	hideLabelFromVision
	checked={ isChecked }
	onCheckedChange={ setChecked }
/>
`})}),`
`,(0,l.jsxs)(t.p,{children:[`For a custom label layout, compose the `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-checkbox--docs`,children:(0,l.jsx)(t.code,{children:`Checkbox`})}),` and `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,l.jsx)(t.code,{children:`Field`})}),` primitives.`]}),`
`,(0,l.jsx)(t.h2,{id:`checkbox-groups`,children:`Checkbox groups`}),`
`,(0,l.jsxs)(t.p,{children:[`If a legacy checkbox uses `,(0,l.jsx)(t.code,{children:`indeterminate`}),` to show that only some items are selected, move the selected items into a `,(0,l.jsx)(t.code,{children:`CheckboxGroup`}),` instead of calculating the parent checkbox state yourself. Pass the child values to `,(0,l.jsx)(t.code,{children:`allValues`}),` and mark the select-all checkbox with `,(0,l.jsx)(t.code,{children:`parent`}),`. The group updates the parent checkbox when children change and selects or clears all children when the parent is clicked.`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { useState } from '@wordpress/element';
import { CheckboxControl, CheckboxGroup } from '@wordpress/ui';

function FruitCheckboxes() {
	const [ selectedFruits, setSelectedFruits ] = useState( [ 'apple' ] );

	return (
		<CheckboxGroup
			value={ selectedFruits }
			onValueChange={ setSelectedFruits }
			allValues={ [ 'apple', 'orange' ] }
			aria-label="Fruit"
		>
			<CheckboxControl parent value="fruit" label="Select all fruit" />
			<CheckboxGroup.NestedItems>
				<CheckboxControl value="apple" label="Apple" />
				<CheckboxControl value="orange" label="Orange" />
			</CheckboxGroup.NestedItems>
		</CheckboxGroup>
	);
}
`})}),`
`,(0,l.jsxs)(t.p,{children:[`See the `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-checkbox-groups--docs`,children:`Checkbox Groups stories`}),` for other grouping patterns.`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var l;function init_migration_guide(){return(init_migration_guide=e((()=>{l=i(),o(),t(),s()})))()}init_migration_guide();export{MDXContent as default};