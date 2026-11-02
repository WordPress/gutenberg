import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{n as s,t as c}from"./index.story-vGTPyZ7p.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,p:`p`,pre:`pre`,...a(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r,{of:c,name:`Migration Guide`}),`
`,(0,l.jsx)(t.h1,{id:`radiocontrol-migration-guide`,children:`RadioControl migration guide`}),`
`,(0,l.jsxs)(t.p,{children:[`Migrate from `,(0,l.jsx)(t.a,{href:`?path=/docs/components-radiocontrol--docs`,children:(0,l.jsx)(t.code,{children:`RadioControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/components`}),` to `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-radiogroupcontrol--docs`,children:(0,l.jsx)(t.code,{children:`RadioGroupControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),`.`]}),`
`,(0,l.jsx)(t.h2,{id:`basic-migration`,children:`Basic migration`}),`
`,(0,l.jsx)(t.p,{children:`Rename the options and controlled value props, and use the new callback name:`}),`
`,(0,l.jsx)(t.p,{children:`Before:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { RadioControl } from '@wordpress/components';

<RadioControl
	label="Post visibility"
	options={ visibilityOptions }
	selected={ visibility }
	onChange={ setVisibility }
	help="Choose who can see this post."
/>;
`})}),`
`,(0,l.jsx)(t.p,{children:`After:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { RadioGroupControl } from '@wordpress/ui';

<RadioGroupControl
	label="Post visibility"
	items={ visibilityOptions }
	value={ visibility }
	onValueChange={ setVisibility }
	description="Choose who can see this post."
/>;
`})}),`
`,(0,l.jsx)(t.h2,{id:`prop-mapping`,children:`Prop mapping`}),`
`,(0,l.jsx)(n,{children:"\n| `@wordpress/components` | `@wordpress/ui` | Notes |\n| --- | --- | --- |\n| `options` | `items` | Pass an array of items with `label` and `value`. The item `description` and `disabled` props also carry over. |\n| `selected` | `value` | Continue passing the selected string for a controlled group. |\n| `onChange` | `onValueChange` | Receives the next selected value. |\n| `help` | `description` | Use plain text only. |\n| `help` with links or other markup | `details` | Use when the help text needs semantic content. |\n| `label` | `label` | The new control requires a plain string. See [Labels](#labels). |\n"}),`
`,(0,l.jsxs)(t.p,{children:[`The new control requires `,(0,l.jsx)(t.code,{children:`items`}),`. The legacy control accepts an omitted or empty `,(0,l.jsx)(t.code,{children:`options`}),` array and renders nothing. Pass an empty `,(0,l.jsx)(t.code,{children:`items`}),` array only when an empty labeled group is intentional.`]}),`
`,(0,l.jsx)(t.h2,{id:`labels`,children:`Labels`}),`
`,(0,l.jsxs)(t.p,{children:[(0,l.jsx)(t.code,{children:`RadioGroupControl`}),` requires a `,(0,l.jsx)(t.code,{children:`label`}),` prop with a plain `,(0,l.jsx)(t.code,{children:`string`}),` value. The legacy `,(0,l.jsx)(t.code,{children:`RadioControl`}),` accepts an optional `,(0,l.jsx)(t.code,{children:`label`}),` that can be a `,(0,l.jsx)(t.code,{children:`ReactNode`}),`.`]}),`
`,(0,l.jsx)(t.p,{children:`When the visible label text already exists elsewhere, pass a descriptive string and hide it visually:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<RadioGroupControl
	label="Post visibility"
	hideLabelFromVision
	items={ visibilityOptions }
	value={ visibility }
	onValueChange={ setVisibility }
/>
`})}),`
`,(0,l.jsxs)(t.p,{children:[`When the label contains markup, or you need a custom layout, compose the `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-radiogroup--docs`,children:(0,l.jsx)(t.code,{children:`RadioGroup`})}),`, `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-radio--docs`,children:(0,l.jsx)(t.code,{children:`Radio`})}),`, `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,l.jsx)(t.code,{children:`Field`})}),`, and `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-fieldset--docs`,children:(0,l.jsx)(t.code,{children:`Fieldset`})}),` primitives instead of `,(0,l.jsx)(t.code,{children:`RadioGroupControl`}),`. Pass `,(0,l.jsx)(t.code,{children:`RadioGroup`}),` to `,(0,l.jsx)(t.code,{children:`Fieldset.Root`}),`'s `,(0,l.jsx)(t.code,{children:`render`}),` prop so `,(0,l.jsx)(t.code,{children:`Fieldset.Legend`}),` gives the group its accessible name:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { Field, Fieldset, Radio, RadioGroup, Stack } from '@wordpress/ui';

<Field.Root>
	<Fieldset.Root
		render={
			<RadioGroup value={ visibility } onValueChange={ setVisibility } />
		}
	>
		<Fieldset.Legend>
			Post <strong>visibility</strong>
		</Fieldset.Legend>
		{ visibilityOptions.map( ( option ) => (
			<Field.Item
				key={ option.value }
				render={ <Stack gap="sm" align="start" /> }
			>
				<Radio value={ option.value } disabled={ option.disabled } />
				<Field.Label variant="plain">{ option.label }</Field.Label>
			</Field.Item>
		) ) }
	</Fieldset.Root>
</Field.Root>;
`})}),`
`,(0,l.jsx)(t.h2,{id:`form-submission`,children:`Form submission`}),`
`,(0,l.jsxs)(t.p,{children:[`The legacy control generates a name for its radio inputs. When the selected value must be submitted with a form, pass an explicit `,(0,l.jsx)(t.code,{children:`name`}),` to the new control so the form data has a stable key:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<RadioGroupControl
	name="visibility"
	label="Post visibility"
	items={ visibilityOptions }
	value={ visibility }
	onValueChange={ setVisibility }
/>
`})})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var l;function init_migration_guide(){return(init_migration_guide=e((()=>{l=i(),o(),t(),s()})))()}init_migration_guide();export{MDXContent as default};