# CustomSelectControl migration guide

Migrate from [`CustomSelectControl`](https://wordpress.github.io/gutenberg/?path=/docs/components-customselectcontrol--docs) in `@wordpress/components` to [`SelectControl`](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-form-selectcontrol--docs) in `@wordpress/ui`. `SelectControl` supports custom trigger content and styled items, so most migrations do not need lower-level components. Use the [`Select`](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-form-primitives-select--docs) primitive only when you need the small size or a custom field layout.

## Basic migration

Before:

```jsx
import { useState } from 'react';
import { CustomSelectControl } from '@wordpress/components';

const options = [
	{ key: 'thumbnail', name: 'Thumbnail', hint: '150 × 150' },
	{ key: 'medium', name: 'Medium', hint: '300 × 300' },
	{ key: 'full', name: 'Full size', hint: 'Original dimensions' },
];

function ImageSize() {
	const [ imageSize, setImageSize ] = useState( 'medium' );

	return (
		<CustomSelectControl
			label="Image size"
			options={ options }
			value={ options.find( ( option ) => option.key === imageSize ) }
			onChange={ ( { selectedItem } ) =>
				setImageSize( selectedItem.key )
			}
		/>
	);
}
```

After, with the stored value shown below the control:

<!-- story: StoredValue sourceState="shown" -->

```jsx
import { useState } from '@wordpress/element';
import { SelectControl } from '@wordpress/ui';

const items = [
	{ value: 'thumbnail', label: 'Thumbnail', description: '150 × 150' },
	{ value: 'medium', label: 'Medium', description: '300 × 300' },
	{ value: 'full', label: 'Full size', description: 'Original dimensions' },
];

function ImageSize() {
	const [ imageSize, setImageSize ] = useState( 'medium' );
	const selectedItem =
		items.find( ( item ) => item.value === imageSize ) ?? null;

	return (
		<>
			<SelectControl
				label="Image size"
				items={ items }
				value={ selectedItem }
				onValueChange={ ( item ) => setImageSize( item?.value ?? null ) }
			/>
			<p>
				Stored value: <code>{ JSON.stringify( imageSize ) }</code>
			</p>
		</>
	);
}
```

<!-- /story -->

In each option, rename `key` to `value`, `name` to `label`, and `hint` (or `__experimentalHint`) to `description`. The selected `value` is still an item object. `onValueChange` receives the selected item, or `null`, instead of an object with a `selectedItem` property. The other fields of the legacy change object, such as `isOpen` and `highlightedIndex`, have no equivalent. Use `onOpenChange` if you need to know when the popup opens or closes.

Unlike the legacy `onChange`, `onValueChange` also fires when the user selects the item that is already selected. Compare the new item with the current selection before running side effects, as described in [Adapt change callbacks](https://wordpress.github.io/gutenberg/?path=/docs/components-selectcontrol--migration-guide#adapt-change-callbacks).

Object values are compared by identity by default. Pass an object from the current `items` array to `value`, as the example does by looking up the stored key on every render. If you keep a selected object across changes to `items` instead, supply `isItemEqualToValue={ ( item, value ) => item.value === value.value }`.

## Prop mapping

| Legacy control | New control | Notes |
| --- | --- | --- |
| `options` | `items` | Convert `{ key, name, hint }` to `{ value, label, description }`. |
| `value` | `value` | Pass an object from `items`, or `null` for no selection. |
| `onChange` | `onValueChange` | Receives the item or `null`, followed by event details. Check for `null` before reading the item. |
| `label` | `label` | Required plain string. `hideLabelFromVision` keeps it accessible while visually hidden. |
| `describedBy` | `description` | The legacy control always adds a hidden description, and the new control adds none. `description` is visible below the control. See [Replace the hidden description](#replace-the-hidden-description). |
| `hint`, `__experimentalHint` | Item `description` | Shown in the popup, not in the trigger. |
| `showSelectedHint`, `__experimentalShowSelectedHint` | Trigger children | See [Show the selected hint](#show-the-selected-hint). |
| Option `style`, `className` | `SelectControl.Item` and `SelectControl.ItemLabel` props | See [Style items](#style-items). |
| `onFocus`, `onBlur`, `onMouseOver`, `onMouseOut` | `trigger` element props | See [Move event handlers to the trigger](#move-event-handlers-to-the-trigger). |
| `className` | `className` or trigger `className` | The control class styles the field wrapper, and a trigger class styles the trigger. Update selectors that target the legacy markup. |
| `size="default"` | `size="default"` | The control also supports `size="compact"`. |
| `size="small"` | `Select.Trigger size="small"` | See [Use the small size](#use-the-small-size). |
| `__next40pxDefaultSize`, `__nextUnconstrainedWidth` | Remove | These opt-ins do not apply to the new control. |

## Set an initial selection

When `value` is omitted, the legacy control selects the first option without calling `onChange`. The new control starts with no selection and shows its placeholder.

To keep the first option selected in an uncontrolled control, pass `defaultValue={ items[ 0 ] ?? null }`. In a controlled control, initialize the stored value explicitly.

## Handle unavailable values

When the stored value matches no option, the legacy control displays the first option. Decide what the new control should display instead, and never pass `undefined` as `value`:

- `items.find( matchesStoredValue ) ?? null` shows the placeholder.
- `items.find( matchesStoredValue ) ?? items[ 0 ] ?? null` shows the first item, like the legacy control.

Either lookup only changes what is displayed, not the stored value. If an unavailable value should be cleared or replaced, update the stored value explicitly, or add an item that represents it.

An empty `items` array, such as an empty list of custom options, should stay empty. Do not replace it with default options. Resolve the selection to `null`, check for `null` before reading `.label` or `.description`, and disable or omit the control when there are no choices.

## Move event handlers to the trigger

Pass focus and mouse handlers, button attributes, and trigger classes to a `SelectControl.Trigger` element in the `trigger` prop. Props on that element override the control's `size` and `placeholder`.

Trigger children change how the selected value is displayed. They can be static content or a function that receives the selected item. Check that an item is selected before reading its label, and pass `undefined` as children when nothing is selected to keep the placeholder. Items in the popup are customized separately, as described in [Style items](#style-items).

<!-- story: WithCustomTrigger -->

```jsx
import { Avatar, SelectControl } from '@wordpress/ui';

const userOptions = [
	{ value: '1', label: 'User 1 (Admin)' },
	{ value: '2', label: 'User 2 (Editor)' },
	{ value: '3', label: 'User 3 (Author)' },
];

<SelectControl
	label="Label"
	description="This is the description."
	items={ userOptions }
	defaultValue={ userOptions[ 0 ] }
	trigger={
		<SelectControl.Trigger onFocus={ handleFocus } onBlur={ handleBlur }>
			{ ( item ) =>
				item ? (
					<span style={ { display: 'flex', alignItems: 'center', gap: 8 } }>
						<Avatar name={ item.value } size="xs" aria-hidden />
						{ item.label }
					</span>
				) : undefined
			}
		</SelectControl.Trigger>
	}
/>;
```

<!-- /story -->

## Style items

For plain hints, set `description` on each item and let `SelectControl` render the popup. Other fields on an item object, such as `style` or `className`, are not applied automatically.

To style items, render `SelectControl.Item` children and set each `value` to the matching object from `items`. Put a class or style for the whole row on `SelectControl.Item`. Put a font preview or other style for the label only on `SelectControl.ItemLabel`, so the description and selection indicator are not affected.

Inside each `SelectControl.Item`, render `SelectControl.ItemLabel` first, optionally followed by `SelectControl.ItemDescription` elements. Pass a plain-text `label` prop to each `SelectControl.Item` for typeahead, especially when the visible label contains markup. The trigger shows the selected item's `label` from `items` unless you supply trigger children.

The [selected hint example](#show-the-selected-hint) combines styled items with custom trigger content. See also the [grouped](https://wordpress.github.io/gutenberg/?path=/story/design-system-components-form-selectcontrol--grouped) and [custom items](https://wordpress.github.io/gutenberg/?path=/story/design-system-components-form-selectcontrol--with-custom-items) examples.

## Replace the hidden description

The legacy control always gives its trigger a visually hidden description: the `describedBy` text, or a generated "Currently selected: …" text when `describedBy` is not set. The new control adds no hidden description.

To keep `describedBy` text hidden, render it in a [`VisuallyHidden`](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-visuallyhidden--docs) element with a unique ID, and pass that ID to `aria-describedby` on `SelectControl.Trigger`. To show it below the control instead, pass it to the `description` prop.

How a screen reader announces the description depends on the screen reader. Test with assistive technology when the exact announcement matters.

## Show the selected hint

With `showSelectedHint`, the legacy control also shows the selected option's hint in the trigger. The new control does not.

To keep the hint, render it in the trigger children with `aria-hidden="true"`, and add it to the [hidden description](#replace-the-hidden-description), so that it is announced once.

<!-- story: SelectedHints sourceState="shown" -->

```jsx
import { useId, useState } from '@wordpress/element';
import { SelectControl, VisuallyHidden } from '@wordpress/ui';

const options = [
	{
		key: 'serif',
		name: 'Serif',
		hint: 'Traditional',
		style: { fontFamily: 'serif' },
		className: 'font-preview',
	},
	{
		key: 'sans-serif',
		name: 'Sans serif',
		hint: 'Modern',
		style: { fontFamily: 'sans-serif' },
		className: 'font-preview',
	},
];

function FontPicker() {
	const [ font, setFont ] = useState( 'serif' );
	const descriptionId = useId();
	const items = options.map( ( option ) => ( {
		value: option.key,
		label: option.name,
		description: option.hint,
		style: option.style,
		className: option.className,
	} ) );
	const selectedItem = items.find( ( item ) => item.value === font ) ?? null;
	const selectedHint = selectedItem?.description;
	const describedBy = 'Choose a font for the heading.';
	const description = [ selectedHint, describedBy ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<>
			<SelectControl
				label="Font"
				items={ items }
				value={ selectedItem }
				onValueChange={ ( item ) => {
					if ( item ) {
						setFont( item.value );
					}
				} }
				trigger={
					<SelectControl.Trigger aria-describedby={ descriptionId }>
						{ selectedItem ? (
							<>
								{ selectedItem.label }
								{ selectedHint && (
									<span aria-hidden="true"> ({ selectedHint })</span>
								) }
							</>
						) : undefined }
					</SelectControl.Trigger>
				}
			>
				{ items.map( ( item ) => (
					<SelectControl.Item
						key={ item.value }
						value={ item }
						label={ item.label }
						className={ item.className }
					>
						<SelectControl.ItemLabel style={ item.style }>
							{ item.label }
						</SelectControl.ItemLabel>
						<SelectControl.ItemDescription>
							{ item.description }
						</SelectControl.ItemDescription>
					</SelectControl.Item>
				) ) }
			</SelectControl>
			<VisuallyHidden id={ descriptionId }>{ description }</VisuallyHidden>
		</>
	);
}
```

<!-- /story -->

## Migrate empty-string options

The legacy control matches an empty `key` like any other key. In the new control, an item with `value: ''` is treated as no selection by default. Decide what each empty key means before migrating it:

- If it means that nothing is selected, use an item with `value: null`.
- If it is a real choice, such as "Use theme font", keep `''` and supply `itemToStringValue`.

See [Migrate empty-string options](https://wordpress.github.io/gutenberg/?path=/docs/components-selectcontrol--migration-guide#migrate-empty-string-options) in the SelectControl migration guide for both cases and their effect on form submission.

## Disable the control

Pass `disabled` to `SelectControl` to disable the whole control, or set `disabled: true` on an item to disable one choice. When composing primitives, pass `disabled` to both [`Field.Root`](https://wordpress.github.io/gutenberg/?path=/docs/design-system-components-form-primitives-field--docs) and `Select.Root`.

## Use the small size

`SelectControl` supports the `default` and `compact` sizes. Use the small size sparingly, for rare compact contexts such as a pagination control, and consider whether `compact` fits first. If a control needs the legacy `small` size, compose the `Field` and `Select` primitives, and pass `size="small"` to `Select.Trigger` and each `Select.Item`:

<!-- story: SmallSize sourceState="shown" -->

```jsx
import { useState } from '@wordpress/element';
import { Field, Select } from '@wordpress/ui';

const items = [
	{ value: '10', label: '10' },
	{ value: '20', label: '20' },
	{ value: '50', label: '50' },
];

function ItemsPerPage() {
	const [ perPage, setPerPage ] = useState( '20' );

	return (
		<Field.Root>
			<Field.Label>Items per page</Field.Label>
			<Select.Root
				items={ items }
				value={ perPage }
				onValueChange={ setPerPage }
			>
				<Select.Trigger size="small" />
				<Select.Popup width="content">
					{ items.map( ( item ) => (
						<Select.Item key={ item.value } value={ item.value } size="small">
							<Select.ItemLabel>{ item.label }</Select.ItemLabel>
						</Select.Item>
					) ) }
				</Select.Popup>
			</Select.Root>
		</Field.Root>
	);
}
```

<!-- /story -->

## Other checks

The [SelectControl migration guide](https://wordpress.github.io/gutenberg/?path=/docs/components-selectcontrol--migration-guide) describes further checks that also apply here, including popup sizing and popups inside existing overlays.
