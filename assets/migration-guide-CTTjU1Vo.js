import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,r,u as i}from"./blocks-Bi8bw4xb.js";import{t as a}from"./jsx-runtime-BxZPLZy3.js";import{i as o,r as s}from"./react-sPqhvIIV.js";import{i as c,o as l,r as u,t as d}from"./index.story-CBhOPDZO.js";import{n as f,t as p}from"./index.story-CVw5NA9X.js";import{r as m,t as h}from"./index.story-BSMrCGO2.js";function _createMdxContent(e){let t={a:`a`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,ul:`ul`,...o(),...e.components};return(0,g.jsxs)(g.Fragment,{children:[(0,g.jsx)(i,{of:p,name:`Migration Guide`}),`
`,(0,g.jsx)(t.h1,{id:`selectcontrol-migration-guide`,children:`SelectControl migration guide`}),`
`,(0,g.jsxs)(t.p,{children:[`Migrate from `,(0,g.jsx)(t.a,{href:`?path=/docs/components-selectcontrol--docs`,children:(0,g.jsx)(t.code,{children:`SelectControl`})}),` in `,(0,g.jsx)(t.code,{children:`@wordpress/components`}),` to `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-form-selectcontrol--docs`,children:(0,g.jsx)(t.code,{children:`SelectControl`})}),` in `,(0,g.jsx)(t.code,{children:`@wordpress/ui`}),` for a standard labeled, single-selection field. For the legacy `,(0,g.jsx)(t.code,{children:`minimal`}),` variant, use the `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-select--docs`,children:(0,g.jsx)(t.code,{children:`Select`})}),` primitive.`]}),`
`,(0,g.jsxs)(t.p,{children:[`The legacy control wraps a native `,(0,g.jsx)(t.code,{children:`<select>`}),`. The new control uses a button with combobox semantics and a portaled listbox. The new control does not support `,(0,g.jsx)(t.code,{children:`multiple`}),`. Choose a suitable multi-selection component, such as `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-form-searchablechipselectcontrol--docs`,children:(0,g.jsx)(t.code,{children:`SearchableChipSelectControl`})}),`, or retain the legacy control for that use case.`]}),`
`,(0,g.jsx)(t.h2,{id:`basic-migration`,children:`Basic migration`}),`
`,(0,g.jsx)(t.p,{children:`Before:`}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-jsx`,children:`import { SelectControl } from '@wordpress/components';

const sizeOptions = [
	{ value: 'small', label: 'Small' },
	{ value: 'large', label: 'Large' },
];

<SelectControl
	label="Size"
	options={ sizeOptions }
	value={ size }
	onChange={ setSize }
	help="Choose the display size."
/>;
`})}),`
`,(0,g.jsx)(t.p,{children:`After:`}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-jsx`,children:`import { SelectControl } from '@wordpress/ui';

const sizeItems = [
	{ value: 'small', label: 'Small' },
	{ value: 'large', label: 'Large' },
];

<SelectControl
	label="Size"
	items={ sizeItems }
	value={ sizeItems.find( ( item ) => item.value === size ) ?? null }
	onValueChange={ ( item ) => {
		if ( item && item.value !== null ) {
			setSize( item.value );
		}
	} }
	description="Choose the display size."
/>;
`})}),`
`,(0,g.jsxs)(t.p,{children:[`The selected `,(0,g.jsx)(t.code,{children:`value`}),` and `,(0,g.jsx)(t.code,{children:`defaultValue`}),` are item objects, and `,(0,g.jsx)(t.code,{children:`onValueChange`}),` receives an item or `,(0,g.jsx)(t.code,{children:`null`}),`. Keep the application's stored string by reading `,(0,g.jsx)(t.code,{children:`item.value`}),`. Use explicit null checks so valid values such as `,(0,g.jsx)(t.code,{children:`''`}),` and `,(0,g.jsx)(t.code,{children:`'0'`}),` are not discarded. Convert numeric identifiers to strings when building `,(0,g.jsx)(t.code,{children:`SelectControl`}),` items and convert them back at the application boundary if needed.`]}),`
`,(0,g.jsxs)(t.p,{children:[`Object values are compared by identity by default. Resolve the selected object from the same array used for `,(0,g.jsx)(t.code,{children:`items`}),` and custom item children. If that is not possible, supply `,(0,g.jsx)(t.code,{children:`isItemEqualToValue`}),` to compare stable identifiers. `,(0,g.jsx)(t.code,{children:`itemToStringValue`}),` controls serialization, not object equality.`]}),`
`,(0,g.jsx)(t.h2,{id:`prop-mapping`,children:`Prop mapping`}),`
`,(0,g.jsx)(n,{children:'\n| Legacy control | New control | Notes |\n| --- | --- | --- |\n| `options` | `items` | Items have `label`, `value`, optional `disabled`, and optional `description`. Arbitrary native option attributes are not forwarded by the array API. |\n| String `value` / `defaultValue` | Item `value` / `defaultValue` | Resolve an object from `items`, or pass `null` for no selection. |\n| `onChange` | `onValueChange` | Receives the item or `null`, followed by event details. See [Adapt change callbacks](#adapt-change-callbacks). |\n| `help` | `description` or `details` | Use `description` for plain text and `details` for links or other semantic content. |\n| `label` | `label` | Required plain string. `hideLabelFromVision` keeps it accessible while visually hidden. |\n| `disabled`, `name`, `required` | Same prop names | Review form behavior, especially when changing serialization. |\n| `onFocus`, `onBlur`, `id`, trigger ARIA attributes | `trigger` element props | Put button-specific props on `SelectControl.Trigger`. |\n| `className` | `className` or trigger `className` | The control class styles the field wrapper. Trigger classes style the trigger layout wrapper. Revisit native-element selectors. |\n| `size="default"` / `size="compact"` | Same values | The control does not support `size="small"`. The primitive supports a small trigger and items. |\n| `variant="minimal"` | `Select.Trigger variant="minimal"` | Compose the primitive. See [Migrate minimal controls with Select](#migrate-minimal-controls-with-select). |\n| `prefix`, `suffix`, `labelPosition` | Custom composition | There is no direct prop mapping. Check trigger customization before using primitives. |\n| `__next*` opt-ins | Remove | Legacy size and margin opt-ins do not apply to the new control. |\n| Native `option` / `optgroup` children | Compound components | Use `SelectControl.Item`, `Group`, and `GroupLabel`. |\n'}),`
`,(0,g.jsx)(t.h2,{id:`migrate-empty-string-options`,children:`Migrate empty-string options`}),`
`,(0,g.jsx)(t.p,{children:`Decide what each existing empty-string option means before migrating it. An empty string may be a real application value, such as the saved value for a default template, or it may mean that nothing is selected.`}),`
`,(0,g.jsxs)(t.p,{children:[`With default serialization, an item with `,(0,g.jsx)(t.code,{children:`value: ''`}),` is treated as an empty selection. Its label may be replaced by the placeholder, and supplying custom trigger text does not remove placeholder semantics or styling. Do not replace every empty string with `,(0,g.jsx)(t.code,{children:`null`}),`.`]}),`
`,(0,g.jsx)(t.h3,{id:`preserve-an-empty-string-as-a-real-choice`,children:`Preserve an empty string as a real choice`}),`
`,(0,g.jsxs)(t.p,{children:[`For application state saved through `,(0,g.jsx)(t.code,{children:`onValueChange`}),`, keep the domain values and supply a serializer that returns a unique, non-empty string for each ordinary choice:`]}),`
`,(0,g.jsx)(r,{of:u,sourceState:`none`}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-jsx`,children:`const positionItems = [
	{ value: '', label: 'Default' },
	{ value: 'sticky', label: 'Sticky' },
];

<SelectControl
	label="Position"
	items={ positionItems }
	value={ positionItems.find( ( item ) => item.value === position ) ?? null }
	itemToStringValue={ ( item ) =>
		item.value === null ? '' : \`option:\${ item.value }\`
	}
	onValueChange={ ( item ) => {
		if ( item && item.value !== null ) {
			setPosition( item.value );
		}
	} }
/>;
`})}),`
`,(0,g.jsxs)(t.p,{children:[`Prefixing every non-null value avoids collisions with a special value such as `,(0,g.jsx)(t.code,{children:`__default`}),` that might also occur in application data. Keep serialization stable and unique across the item collection.`]}),`
`,(0,g.jsxs)(t.p,{children:[`When submitting a form, `,(0,g.jsx)(t.code,{children:`itemToStringValue`}),` also determines the submitted field value. In this example, Default submits `,(0,g.jsx)(t.code,{children:`option:`}),`, while `,(0,g.jsx)(t.code,{children:`onValueChange`}),` still receives the original item with `,(0,g.jsx)(t.code,{children:`value: ''`}),`. Convert the serialized value back to the application's stored value in your form handler. Check required-field validation separately, because the non-empty serialization makes Default count as a selection.`]}),`
`,(0,g.jsx)(t.h3,{id:`provide-an-option-that-clears-the-selection`,children:`Provide an option that clears the selection`}),`
`,(0,g.jsxs)(t.p,{children:[`Use an item with `,(0,g.jsx)(t.code,{children:`value: null`}),` when the choice means no selection. Its label overrides the placeholder, but it retains empty-selection semantics:`]}),`
`,(0,g.jsx)(r,{of:c,sourceState:`shown`}),`
`,(0,g.jsxs)(t.p,{children:[`If the application's existing empty state is `,(0,g.jsx)(t.code,{children:`''`}),`, translate it to `,(0,g.jsx)(t.code,{children:`null`}),` when resolving the selection and back to `,(0,g.jsx)(t.code,{children:`''`}),` in the callback. Do this only for an actual empty state, not a named default choice.`]}),`
`,(0,g.jsx)(t.h3,{id:`show-a-placeholder-before-selection`,children:`Show a placeholder before selection`}),`
`,(0,g.jsxs)(t.p,{children:[`If there is no clearable item, pass `,(0,g.jsx)(t.code,{children:`placeholder`}),` for the unselected prompt instead of retaining a disabled empty-string option. A placeholder is not a selectable item.`]}),`
`,(0,g.jsx)(r,{of:d,sourceState:`shown`}),`
`,(0,g.jsxs)(t.p,{children:[`The development warning catches empty-string values in `,(0,g.jsx)(t.code,{children:`items`}),` when default serialization is used. It skips custom serializers and cannot inspect arbitrary custom children.`]}),`
`,(0,g.jsx)(t.h2,{id:`set-an-initial-selection`,children:`Set an initial selection`}),`
`,(0,g.jsxs)(t.p,{children:[`Without `,(0,g.jsx)(t.code,{children:`value`}),` or `,(0,g.jsx)(t.code,{children:`defaultValue`}),`, a native single select normally displays its first enabled option. This does not call `,(0,g.jsx)(t.code,{children:`onChange`}),` or initialize application state. The new control starts with no selection and shows its placeholder, or the label of a null-valued item.`]}),`
`,(0,g.jsx)(t.p,{children:`For uncontrolled usage, make the initial selection explicit:`}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-jsx`,children:`<SelectControl
	label="Size"
	items={ sizeItems }
	defaultValue={ sizeItems.find( ( item ) => ! item.disabled ) ?? null }
/>
`})}),`
`,(0,g.jsxs)(t.p,{children:[`For controlled usage, initialize application state deliberately and resolve it to an item. Do not replace a missing initial value with a fixed `,(0,g.jsx)(t.code,{children:`value={ items[ 0 ] }`}),`, which prevents subsequent changes. `,(0,g.jsx)(t.code,{children:`defaultValue`}),` only initializes the selection. When items arrive asynchronously, manage the selection after loading or mount the control once the initial items are ready.`]}),`
`,(0,g.jsx)(t.h2,{id:`handle-unavailable-values`,children:`Handle unavailable values`}),`
`,(0,g.jsx)(t.p,{children:`Preserve the consumer's policy for unavailable saved values. A missing template may need to display the default template rather than a blank trigger. A custom aspect ratio may need a display-only item instead of the first item.`}),`
`,(0,g.jsxs)(t.p,{children:[`The legacy control renders nothing when both its options and children are empty. The new control still renders a field with an empty popup. Keep an explicit rendering guard when the old omission was intentional. Guard failed lookups before reading properties such as `,(0,g.jsx)(t.code,{children:`selectedItem.label`}),`.`]}),`
`,(0,g.jsx)(t.h2,{id:`preserve-labels-and-descriptions`,children:`Preserve labels and descriptions`}),`
`,(0,g.jsxs)(t.p,{children:[`Pass a descriptive string to `,(0,g.jsx)(t.code,{children:`label`}),`, even if `,(0,g.jsx)(t.code,{children:`hideLabelFromVision`}),` is set. Use `,(0,g.jsx)(t.code,{children:`description`}),` for plain-text help and `,(0,g.jsx)(t.code,{children:`details`}),` for links or other semantic content.`]}),`
`,(0,g.jsxs)(t.p,{children:[`For a hidden description or a label containing markup, compose `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-form-primitives-field--docs`,children:(0,g.jsx)(t.code,{children:`Field`})}),` with `,(0,g.jsx)(t.code,{children:`Select`}),` and, where needed, `,(0,g.jsx)(t.a,{href:`?path=/docs/design-system-components-visuallyhidden--docs`,children:(0,g.jsx)(t.code,{children:`VisuallyHidden`})}),`.`]}),`
`,(0,g.jsx)(t.h2,{id:`move-button-props-to-the-trigger`,children:`Move button props to the trigger`}),`
`,(0,g.jsxs)(t.p,{children:[`Use the `,(0,g.jsx)(t.code,{children:`trigger`}),` slot for focus handlers, hover previews, button IDs, or ARIA attributes. Props passed to the control generally reach `,(0,g.jsx)(t.code,{children:`Select.Root`}),`, not its button:`]}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-jsx`,children:`<SelectControl
	label="Size"
	items={ sizeItems }
	value={ selectedItem }
	onValueChange={ handleValueChange }
	trigger={
		<SelectControl.Trigger
			onFocus={ showPreview }
			onBlur={ hidePreview }
			onMouseOver={ showPreview }
			onMouseOut={ hidePreview }
		/>
	}
/>
`})}),`
`,(0,g.jsxs)(t.p,{children:[`Props on the supplied trigger override the control's `,(0,g.jsx)(t.code,{children:`size`}),` and `,(0,g.jsx)(t.code,{children:`placeholder`}),`.`]}),`
`,(0,g.jsx)(t.h2,{id:`migrate-grouped-options`,children:`Migrate grouped options`}),`
`,(0,g.jsxs)(t.p,{children:[`Replace native `,(0,g.jsx)(t.code,{children:`<optgroup>`}),` children with `,(0,g.jsx)(t.code,{children:`SelectControl.Group`}),` and `,(0,g.jsx)(t.code,{children:`SelectControl.GroupLabel`}),`, and native `,(0,g.jsx)(t.code,{children:`<option>`}),` children with `,(0,g.jsx)(t.code,{children:`SelectControl.Item`}),` containing `,(0,g.jsx)(t.code,{children:`SelectControl.ItemLabel`}),`. Pass a flat `,(0,g.jsx)(t.code,{children:`items`}),` array for trigger label resolution and use those same objects as item values. See the `,(0,g.jsx)(t.a,{href:`?path=/story/design-system-components-form-selectcontrol--grouped`,children:`grouped options story`}),`.`]}),`
`,(0,g.jsx)(t.h2,{id:`migrate-minimal-controls-with-select`,children:`Migrate minimal controls with Select`}),`
`,(0,g.jsxs)(t.p,{children:[`Use minimal select triggers sparingly, because users may not recognize them as interactive controls. A small minimal trigger can suit compact pagination controls. When migrating a legacy `,(0,g.jsx)(t.code,{children:`variant="minimal"`}),` control, compose the `,(0,g.jsx)(t.code,{children:`Select`}),` primitive and give its trigger an accessible name.`]}),`
`,(0,g.jsx)(r,{of:h,sourceState:`shown`}),`
`,(0,g.jsxs)(t.p,{children:[`The primitive accepts string values directly. With string item values as in this story, `,(0,g.jsx)(t.code,{children:`onValueChange`}),` receives a string or `,(0,g.jsx)(t.code,{children:`null`}),`.`]}),`
`,(0,g.jsx)(t.h2,{id:`adapt-change-callbacks`,children:`Adapt change callbacks`}),`
`,(0,g.jsxs)(t.p,{children:[`The legacy `,(0,g.jsx)(t.code,{children:`onChange`}),` receives the selected string and an optional `,(0,g.jsx)(t.code,{children:`{ event }`}),` envelope containing a select change event. The new `,(0,g.jsx)(t.code,{children:`onValueChange`}),` receives the selected item and event details. That event comes from the popup interaction and is not a native select change event. Read the value from the callback's first argument, not `,(0,g.jsx)(t.code,{children:`event.target.value`}),`.`]}),`
`,(0,g.jsx)(t.p,{children:`When migrating a component that exposes its own callback to plugins, preserve its documented value and argument shape where possible. If forwarding an event is required, adapt the envelope explicitly and document the change in event semantics.`}),`
`,(0,g.jsx)(t.h2,{id:`update-refs-and-dom-access`,children:`Update refs and DOM access`}),`
`,(0,g.jsxs)(t.p,{children:[`Refs now target `,(0,g.jsx)(t.code,{children:`HTMLButtonElement`}),` instead of `,(0,g.jsx)(t.code,{children:`HTMLSelectElement`}),`. Update ref types and replace reads of `,(0,g.jsx)(t.code,{children:`.value`}),`, `,(0,g.jsx)(t.code,{children:`.options`}),`, or `,(0,g.jsx)(t.code,{children:`.selectedOptions`}),` with application state. Audit code that finds the native select through CSS selectors or DOM traversal.`]}),`
`,(0,g.jsx)(t.h2,{id:`check-popup-sizing`,children:`Check popup sizing`}),`
`,(0,g.jsxs)(t.p,{children:[(0,g.jsx)(t.code,{children:`SelectControl`}),` defaults to `,(0,g.jsx)(t.code,{children:`popupWidth="content"`}),`: the popup is at least as wide as the trigger and may grow for long or translated labels. Use `,(0,g.jsx)(t.code,{children:`popupWidth="anchor"`}),` only when matching the trigger width is intentional. The primitive uses `,(0,g.jsx)(t.code,{children:`Select.Popup width="content"`}),` for the corresponding behavior.`]}),`
`,(0,g.jsx)(t.p,{children:`Revisit legacy CSS hooks and native select resets. Check sizing and shrinking within the actual container, especially beside long labels. Avoid carrying over one-off popup height, positioning, or z-index workarounds without checking the shared component's current behavior.`}),`
`,(0,g.jsx)(t.h2,{id:`check-popups-inside-existing-overlays`,children:`Check popups inside existing overlays`}),`
`,(0,g.jsx)(t.p,{children:`The popup is portaled outside the field's DOM subtree. Check surrounding outside-click handlers, block selection, focus containment, and form submission in the real consumer. A click on a popup option must not dismiss its parent popover, deselect its block, or submit the surrounding form unexpectedly.`}),`
`,(0,g.jsxs)(t.p,{children:[`For directly bundled applications mixing `,(0,g.jsx)(t.code,{children:`@wordpress/components`}),` overlays with `,(0,g.jsx)(t.code,{children:`@wordpress/ui`}),`, enable `,(0,g.jsx)(t.code,{children:`useEnableWpCompatOverlaySlot()`}),` once at a long-lived application root as described in the `,(0,g.jsx)(t.a,{href:`https://github.com/WordPress/gutenberg/blob/trunk/packages/ui/README.md#mixing-with-wordpresscomponents`,rel:`nofollow`,children:`setup guide`}),`. Standard WordPress editor screens enable it automatically. Test the full overlay chain, including a select inside a popover inside a modal.`]}),`
`,(0,g.jsx)(t.h2,{id:`verify-a-migration`,children:`Verify a migration`}),`
`,(0,g.jsxs)(t.ul,{children:[`
`,(0,g.jsx)(t.li,{children:`Select each meaningful default, empty, zero, inherited, mixed, and custom value. Confirm the label, stored value, and selection survive saving and reopening. Include missing saved values, empty item arrays, disabled choices, and asynchronously loaded items where supported.`}),`
`,(0,g.jsx)(t.li,{children:`Open and select with both pointer and keyboard. Check Escape dismissal, focus return, Tab navigation, typeahead, accessible names and descriptions, and any focus or hover preview callbacks.`}),`
`,(0,g.jsx)(t.li,{children:`Exercise the actual parent popover, modal, editor, or form. Check stacking, outside-click behavior, scrolling to the last option near viewport edges, and native submission or validation when used.`}),`
`,(0,g.jsx)(t.li,{children:`Check long labels and constrained layouts. In Storybook, include WordPress Global CSS and forced colors for migrated styling. Use browser checks for layout, scrolling, and focus behavior.`}),`
`]}),`
`,(0,g.jsx)(t.p,{children:`Update tests to interact with the combobox and popup options instead of native select APIs:`}),`
`,(0,g.jsx)(t.pre,{children:(0,g.jsx)(t.code,{className:`language-js`,children:`const sizeControl = page.getByRole( 'combobox', { name: 'Size', exact: true } );
await sizeControl.click();
await page.getByRole( 'option', { name: 'Large', exact: true } ).click();
await expect( sizeControl ).toHaveText( 'Large' );
`})}),`
`,(0,g.jsxs)(t.p,{children:[`Replace Playwright `,(0,g.jsx)(t.code,{children:`selectOption()`}),` and Testing Library `,(0,g.jsx)(t.code,{children:`selectOptions()`}),` with popup interactions, and replace native `,(0,g.jsx)(t.code,{children:`.toHaveValue()`}),` assertions with trigger text and application-state assertions. Popup options are portaled, so query them from the page or screen rather than only within the field container. Keep native-select helpers for controls that still render a native select.`]})]})}function MDXContent(e={}){let{wrapper:t}={...o(),...e.components};return t?(0,g.jsx)(t,{...e,children:(0,g.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var g;function init_migration_guide(){return(init_migration_guide=e((()=>{g=a(),s(),t(),f(),l(),m()})))()}init_migration_guide();export{MDXContent as default};