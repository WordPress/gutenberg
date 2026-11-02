import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";import{n as s,t as c}from"./index.story-DFeiv-vW.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...a(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r,{of:c,name:`Migration Guide`}),`
`,(0,l.jsx)(t.h1,{id:`inputcontrol-migration-guide`,children:`InputControl migration guide`}),`
`,(0,l.jsxs)(t.p,{children:[`Migrate from `,(0,l.jsx)(t.a,{href:`?path=/docs/components-inputcontrol--docs`,children:(0,l.jsx)(t.code,{children:`InputControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/components`}),` to `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-inputcontrol--docs`,children:(0,l.jsx)(t.code,{children:`InputControl`})}),` in `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),`.`]}),`
`,(0,l.jsxs)(t.p,{children:[`The same guidance applies when replacing legacy `,(0,l.jsx)(t.a,{href:`?path=/docs/components-textcontrol--docs`,children:(0,l.jsx)(t.code,{children:`TextControl`})}),` and `,(0,l.jsx)(t.a,{href:`?path=/docs/components-numbercontrol--docs`,children:(0,l.jsx)(t.code,{children:`NumberControl`})}),` usages.`]}),`
`,(0,l.jsx)(t.h2,{id:`basic-migration`,children:`Basic migration`}),`
`,(0,l.jsx)(t.p,{children:`Update the import and swap the callback prop:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`// Before
import { __experimentalInputControl as InputControl } from '@wordpress/components';

<InputControl
	label="Width"
	value={ value }
	onChange={ ( nextValue ) => setValue( nextValue ?? '' ) }
	help="Enter a value in pixels."
/>;

// After
import { InputControl } from '@wordpress/ui';

<InputControl
	label="Width"
	value={ value }
	onValueChange={ ( nextValue ) => setValue( nextValue ) }
	description="Enter a value in pixels."
/>;
`})}),`
`,(0,l.jsx)(t.h2,{id:`prop-mapping`,children:`Prop mapping`}),`
`,(0,l.jsx)(n,{children:"\n| `@wordpress/components` | `@wordpress/ui` | Notes |\n| --- | --- | --- |\n| `onChange` | `onValueChange` | Receives the next string value on every change. Legacy `NumberControl` also rewrites values to match `min`, `max`, and `step` on Enter and blur; see [Number inputs](#number-inputs). |\n| `help` | `description` | Use plain text only. |\n| `help` with links or other markup | `details` | Use when the help text needs semantic content. |\n| `hideLabelFromVision` | `hideLabelFromVision` | Same behavior. |\n| `prefix` / `suffix` | `prefix` / `suffix` | Wrap slot content in [`InputLayout.Slot`](?path=/docs/design-system-components-form-primitives-input--docs#with-prefix) instead of `InputControlPrefixWrapper` / `InputControlSuffixWrapper`. |\n| `size` | `size` | Supports `default` and `compact`. |\n| `type` | `type` | Same HTML input types, including `number`. |\n"}),`
`,(0,l.jsx)(t.h2,{id:`labels`,children:`Labels`}),`
`,(0,l.jsxs)(t.p,{children:[(0,l.jsx)(t.code,{children:`InputControl`}),` requires a `,(0,l.jsx)(t.code,{children:`label`}),` prop with a plain `,(0,l.jsx)(t.code,{children:`string`}),` value. Legacy `,(0,l.jsx)(t.code,{children:`InputControl`}),`, `,(0,l.jsx)(t.code,{children:`TextControl`}),`, and `,(0,l.jsx)(t.code,{children:`NumberControl`}),` accept an optional `,(0,l.jsx)(t.code,{children:`label`}),`, and the legacy `,(0,l.jsx)(t.code,{children:`InputControl`}),` `,(0,l.jsx)(t.code,{children:`label`}),` can be a `,(0,l.jsx)(t.code,{children:`ReactNode`}),`.`]}),`
`,(0,l.jsx)(t.p,{children:`When the visible label text already exists elsewhere, pass a descriptive string and hide it visually:`}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`<InputControl
	label="Search"
	hideLabelFromVision
	value={ value }
	onValueChange={ setValue }
/>;
`})}),`
`,(0,l.jsxs)(t.p,{children:[`When the label is not a plain string, or you need a custom layout, compose the `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-input--docs`,children:(0,l.jsx)(t.code,{children:`Input`})}),` and `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,l.jsx)(t.code,{children:`Field`})}),` primitives instead of `,(0,l.jsx)(t.code,{children:`InputControl`}),`:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { Field, Input } from '@wordpress/ui';

<Field.Root>
	<Field.Label>
		Custom <strong>label</strong> content
	</Field.Label>
	<Input
		value={ value }
		onValueChange={ setValue }
	/>
</Field.Root>
`})}),`
`,(0,l.jsxs)(t.p,{children:[`See the `,(0,l.jsxs)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:[(0,l.jsx)(t.code,{children:`Field`}),` stories`]}),` for other association patterns, such as external labels with `,(0,l.jsx)(t.code,{children:`aria-labelledby`}),`.`]}),`
`,(0,l.jsx)(t.h2,{id:`prefix-and-suffix-slots`,children:`Prefix and suffix slots`}),`
`,(0,l.jsxs)(t.p,{children:[`Replace the wrapper components with `,(0,l.jsx)(t.code,{children:`InputLayout.Slot`}),`:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`// Before
import { Icon } from '@wordpress/components';
import {
	__experimentalInputControl as InputControl,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { link } from '@wordpress/icons';

<InputControl
	prefix={
		<InputControlPrefixWrapper variant="icon">
			<Icon icon={ link } />
		</InputControlPrefixWrapper>
	}
/>;

// After
import { Icon, InputControl, InputLayout } from '@wordpress/ui';
import { link } from '@wordpress/icons';

<InputControl
	prefix={
		<InputLayout.Slot padding="minimal">
			<Icon icon={ link } />
		</InputLayout.Slot>
	}
/>;
`})}),`
`,(0,l.jsxs)(t.p,{children:[`Use `,(0,l.jsx)(t.code,{children:`padding="minimal"`}),` for icons and controls. Omit it for text prefixes and suffixes such as `,(0,l.jsx)(t.code,{children:`@`}),` or `,(0,l.jsx)(t.code,{children:`%`}),`.`]}),`
`,(0,l.jsx)(t.h2,{id:`number-inputs`,children:`Number inputs`}),`
`,(0,l.jsxs)(t.p,{children:[`Replace `,(0,l.jsx)(t.code,{children:`NumberControl`}),` usages with `,(0,l.jsx)(t.code,{children:`InputControl`}),` and `,(0,l.jsx)(t.code,{children:`type="number"`}),`:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { InputControl } from '@wordpress/ui';

<InputControl
	label="Quantity"
	type="number"
	min={ 1 }
	max={ 10 }
	step={ 1 }
	value={ value }
	onValueChange={ setValue }
/>;
`})}),`
`,(0,l.jsx)(t.h3,{id:`value-clamping-and-step-alignment`,children:`Value clamping and step alignment`}),`
`,(0,l.jsxs)(t.p,{children:[`Legacy `,(0,l.jsx)(t.code,{children:`NumberControl`}),` rewrites the value on Enter and blur: it clamps to `,(0,l.jsx)(t.code,{children:`min`}),`/`,(0,l.jsx)(t.code,{children:`max`}),` and aligns to `,(0,l.jsx)(t.code,{children:`step`}),`. `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),` `,(0,l.jsx)(t.code,{children:`InputControl`}),` passes these constraints to the native `,(0,l.jsx)(t.code,{children:`<input type="number">`}),` for validation, but does not rewrite invalid values when the field loses focus.`]}),`
`,(0,l.jsxs)(t.p,{children:[`If you relied on the legacy rewrite behavior, normalize the value yourself. A common pattern is to keep accepting edits in `,(0,l.jsx)(t.code,{children:`onValueChange`}),`, then clamp on blur:`]}),`
`,(0,l.jsx)(t.pre,{children:(0,l.jsx)(t.code,{className:`language-jsx`,children:`import { InputControl } from '@wordpress/ui';

function constrainValue( value, min, max, step ) {
	const num = parseFloat( value );
	if ( Number.isNaN( num ) ) {
		return value;
	}

	const clamped = Math.min( max, Math.max( min, num ) );
	if ( step === 'any' ) {
		return String( clamped );
	}

	const stepNum = parseFloat( step );
	const aligned =
		min + Math.round( ( clamped - min ) / stepNum ) * stepNum;
	return String( aligned );
}

<InputControl
	label="Quantity"
	type="number"
	min={ min }
	max={ max }
	step={ step }
	value={ value }
	onValueChange={ setValue }
	onBlur={ ( event ) => {
		setValue( constrainValue( event.target.value, min, max, step ) );
	} }
/>;
`})}),`
`,(0,l.jsxs)(t.p,{children:[`Adapt the helper to match your product requirements. The legacy component also fires `,(0,l.jsx)(t.code,{children:`onChange`}),` while typing with unclamped values, then again with the clamped value on blur.`]}),`
`,(0,l.jsx)(t.h3,{id:`removed-numbercontrol-features`,children:`Removed NumberControl features`}),`
`,(0,l.jsxs)(t.p,{children:[`The `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),` `,(0,l.jsx)(t.code,{children:`InputControl`}),` does not support these `,(0,l.jsx)(t.code,{children:`@wordpress/components`}),` `,(0,l.jsx)(t.code,{children:`NumberControl`}),` features:`]}),`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:(0,l.jsx)(t.code,{children:`spinControls`})}),` — When desired, use explicit controls in a `,(0,l.jsx)(t.code,{children:`suffix`}),` slot. See the `,(0,l.jsxs)(t.a,{href:`?path=/story/design-system-components-form-inputcontrol--number-with-steppers`,children:[(0,l.jsx)(t.code,{children:`NumberWithSteppers`}),` story`]}),`.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsxs)(t.strong,{children:[(0,l.jsx)(t.code,{children:`isShiftStepEnabled`}),` / `,(0,l.jsx)(t.code,{children:`shiftStep`})]}),` — Apply larger increments in your stepper handlers or `,(0,l.jsx)(t.code,{children:`onValueChange`}),` logic.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Mouse-drag value changes`}),` — Not recommended, as they can be confusing and are not supported on touch devices.`]}),`
`]}),`
`,(0,l.jsx)(t.h2,{id:`removed-features`,children:`Removed features`}),`
`,(0,l.jsxs)(t.p,{children:[`The `,(0,l.jsx)(t.code,{children:`@wordpress/ui`}),` `,(0,l.jsx)(t.code,{children:`InputControl`}),` does not support these `,(0,l.jsx)(t.code,{children:`@wordpress/components`}),` features:`]}),`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:(0,l.jsx)(t.code,{children:`labelPosition`})}),` — Only top labels are recommended. If other layouts are necessary, compose using the `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-input--docs`,children:(0,l.jsx)(t.code,{children:`Input`})}),` and `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,l.jsx)(t.code,{children:`Field`})}),` primitives.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:(0,l.jsx)(t.code,{children:`isPressEnterToChange`})}),` — Keep a local draft value and commit to your state on `,(0,l.jsx)(t.code,{children:`Enter`}),` or `,(0,l.jsx)(t.code,{children:`blur`}),` if you need deferred updates.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:(0,l.jsx)(t.code,{children:`onValidate`})}),` — Run validation in your `,(0,l.jsx)(t.code,{children:`onValueChange`}),` handler instead.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsxs)(t.strong,{children:[(0,l.jsx)(t.code,{children:`isDragEnabled`}),`, `,(0,l.jsx)(t.code,{children:`dragDirection`}),`, and related drag callbacks`]}),` — Not recommended, as they can be confusing and are not supported on touch devices.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:(0,l.jsx)(t.code,{children:`__unstableInputWidth`})}),` — If the label needs to be a different width from the input field, compose using the `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-input--docs`,children:(0,l.jsx)(t.code,{children:`Input`})}),` and `,(0,l.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,l.jsx)(t.code,{children:`Field`})}),` primitives.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:(0,l.jsx)(t.code,{children:`__unstableStateReducer`})}),` — This hook intercepted the internal state machine. Some workarounds for known patterns:`,`
`,(0,l.jsxs)(t.ul,{children:[`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Display formatting`}),` (for example, zero-padded time segments): always pass a formatted `,(0,l.jsx)(t.code,{children:`value`}),`, or format in an `,(0,l.jsx)(t.code,{children:`onBlur`}),` handler if updates should be deferred until the field loses focus.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Paste normalization`}),`: normalize in `,(0,l.jsx)(t.code,{children:`onValueChange`}),`, or handle `,(0,l.jsx)(t.code,{children:`onPaste`}),` on `,(0,l.jsx)(t.code,{children:`InputControl`}),`.`]}),`
`,(0,l.jsxs)(t.li,{children:[(0,l.jsx)(t.strong,{children:`Custom step or spin behavior`}),`: apply adjustments in `,(0,l.jsx)(t.code,{children:`onValueChange`}),`, in an `,(0,l.jsx)(t.code,{children:`onBlur`}),` handler, or with explicit controls in a `,(0,l.jsx)(t.code,{children:`suffix`}),` slot.`]}),`
`]}),`
`]}),`
`]})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var l;function init_migration_guide(){return(init_migration_guide=e((()=>{l=i(),o(),t(),s()})))()}init_migration_guide();export{MDXContent as default};