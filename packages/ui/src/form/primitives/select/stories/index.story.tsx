import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Select from '../';

const meta: Meta< typeof Select.Root > = {
	title: 'Design System/Components/Form/Primitives/Select',
	component: Select.Root,
	subcomponents: {
		'Select.Trigger': Select.Trigger,
		'Select.Portal': Select.Portal,
		'Select.Positioner': Select.Positioner,
		'Select.Popup': Select.Popup,
		'Select.Group': Select.Group,
		'Select.GroupLabel': Select.GroupLabel,
		'Select.Item': Select.Item,
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Select.Root >;

const defaultItems = Array.from( { length: 6 }, ( _, index ) => ( {
	value: `item-${ index + 1 }`,
	label: `Item ${ index + 1 }`,
} ) );

export const Default: Story = {
	args: {
		items: defaultItems,
		children: [
			<Select.Trigger key="trigger" />,
			<Select.Popup key="popup">
				{ defaultItems.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],
	},
};

export const Compact: Story = {
	args: {
		...Default.args,
		children: [
			<Select.Trigger size="compact" key="trigger" />,
			<Select.Popup key="popup">
				{ defaultItems.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],
	},
};

/**
 * The `minimal` variant must be used judiciously, because in many
 * contexts it can be unclear to users that it is a select trigger.
 *
 * Combined with the `small` size, `minimal` can be used to create a
 * very low-profile `Select`, intended for rare use cases like
 * a pagination control.
 */
export const Minimal: Story = {
	args: {
		children: [
			<Select.Trigger size="small" variant="minimal" key="trigger" />,
			<Select.Popup key="popup">
				{ Array.from( { length: 6 }, ( _, index ) => (
					<Select.Item
						key={ index }
						value={ `${ index + 1 }` }
						size="small"
					>
						{ `${ index + 1 }` }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],

		defaultValue: '1',
	},
};

const groupedItems = [
	{
		label: 'Common',
		items: [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' },
			{ value: 'orange', label: 'Orange' },
		],
	},
	{
		label: 'Berries',
		items: [
			{ value: 'strawberry', label: 'Strawberry' },
			{ value: 'blueberry', label: 'Blueberry' },
			{ value: 'raspberry', label: 'Raspberry' },
		],
	},
	{
		label: 'Tropical',
		items: [
			{ value: 'mango', label: 'Mango' },
			{ value: 'pineapple', label: 'Pineapple' },
			{ value: 'papaya', label: 'Papaya' },
		],
	},
];

/**
 * Options can be organized into labeled groups with `Select.Group`
 * and `Select.GroupLabel`.
 */
export const Grouped: Story = {
	args: {
		items: groupedItems.flatMap( ( group ) => group.items ),
		children: [
			<Select.Trigger key="trigger" />,
			<Select.Popup key="popup">
				{ groupedItems.map( ( group ) => (
					<Select.Group key={ group.label }>
						<Select.GroupLabel>{ group.label }</Select.GroupLabel>
						{ group.items.map( ( item ) => (
							<Select.Item key={ item.value } value={ item }>
								{ item.label }
							</Select.Item>
						) ) }
					</Select.Group>
				) ) }
			</Select.Popup>,
		],
	},
};

/**
 * Use the `placeholder` prop on `Select.Trigger` to show text when no
 * value is selected. The default placeholder is `"Select"`.
 */
export const WithCustomPlaceholder: Story = {
	args: {
		items: defaultItems,
		children: [
			<Select.Trigger placeholder="Choose an item" key="trigger" />,
			<Select.Popup key="popup">
				{ defaultItems.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],
	},
};

const nullValueOptionItems = [
	{ value: null, label: 'Select theme' },
	{ value: 'system', label: 'System default' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
];

/**
 * Use a `null` item when users should be able to clear the selected value from
 * the popup. When `items` includes a `null` item, its label is used as the
 * placeholder text.
 */
export const WithNullValueOption: Story = {
	args: {
		items: nullValueOptionItems,
		children: [
			<Select.Trigger key="trigger" />,
			<Select.Popup key="popup">
				{ nullValueOptionItems.map( ( item ) => (
					<Select.Item
						key={ item.value ?? 'null' }
						value={ item.value }
					>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],
	},
};

/**
 * When accessibly labeling a `Select`, note that the label must be associated with the `Select.Trigger`,
 * not the `Select.Root`.
 *
 * Whether labeling with `aria-label`, `htmlFor`, or `aria-labelledby`, the association must be made to the `Select.Trigger`.
 */
export const Labeling: Story = {
	args: {
		...Default.args,
		children: [
			<Select.Trigger aria-label="User role" key="trigger" />,
			<Select.Popup key="popup">
				{ defaultItems.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],
	},
};

const longItemValue =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

const overflowItems = [
	{
		value: 'long-item',
		label: longItemValue,
	},
	{
		value: 'item-2',
		label: 'Item 2',
	},
];

export const WithOverflow: Story = {
	args: {
		items: overflowItems,
		children: [
			<Select.Trigger key="trigger" />,
			<Select.Popup key="popup">
				{ overflowItems.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],

		defaultValue: overflowItems[ 0 ],
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		children: [
			<Select.Trigger key="trigger" />,
			<Select.Popup key="popup">
				{ defaultItems.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],

		defaultValue: defaultItems[ 0 ],
		disabled: true,
	},
};

const disabledItemItems = [
	{
		value: 'item-1',
		label: 'Item 1',
	},
	{
		value: 'item-2',
		label: 'Item 2',
		disabled: true,
	},
];

export const WithDisabledItem: Story = {
	args: {
		items: disabledItemItems,
		children: [
			<Select.Trigger key="trigger" />,
			<Select.Popup key="popup">
				{ disabledItemItems.map( ( item ) => (
					<Select.Item
						key={ item.value }
						value={ item }
						disabled={ item.disabled }
					>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],

		defaultValue: disabledItemItems[ 0 ],
	},
};

const customOptions = [
	{
		value: 'user-1',
		label: 'User 1 (Admin)',
	},
	{
		value: 'user-2',
		label: 'User 2 (Editor)',
	},
];

/**
 * For custom needs, a `Select.Trigger` can take a custom render function as its children,
 * while `Select.Item` can take arbitrary content as children.
 */
export const WithCustomTriggerAndItem: Story = {
	args: {
		items: customOptions,
		children: [
			<Select.Trigger key="trigger">
				{ ( item ) => (
					<span
						style={ {
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						} }
					>
						<img
							src={ `https://gravatar.com/avatar/?d=initials&name=${ item.value }` }
							alt=""
							width="20"
							style={ {
								borderRadius: '50%',
							} }
						/>

						{ item.label }
					</span>
				) }
			</Select.Trigger>,
			<Select.Popup key="popup">
				{ customOptions.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],

		defaultValue: customOptions[ 0 ],
	},
};

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can
 * create situations where a select popup renders below another popover when
 * you want it above.
 *
 * The `--wp-ui-select-z-index` CSS variable controls the z-index of the
 * `Select` positioner. Override it either:
 *
 * - **Globally**, by setting the variable on `:root` or `body` (raises every
 *   `Select` popover in the page), or
 * - **Per instance**, by passing a `Select.Portal` with a `style` (or
 *   `className`) to `Select.Popup`'s `portal` prop. The variable cascades
 *   from the portal wrapper to everything rendered inside it.
 *
 * This story demonstrates the per-instance approach.
 */
export const WithCustomZIndex: Story = {
	name: 'With Custom z-index',
	args: {
		...Default.args,
		children: [
			<Select.Trigger key="trigger" />,
			<Select.Popup
				portal={
					<Select.Portal
						style={ { '--wp-ui-select-z-index': '9999' } }
					/>
				}
				key="popup"
			>
				{ defaultItems.map( ( item ) => (
					<Select.Item key={ item.value } value={ item }>
						{ item.label }
					</Select.Item>
				) ) }
			</Select.Popup>,
		],
	},
};
