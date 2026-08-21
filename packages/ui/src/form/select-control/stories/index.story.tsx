import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelectControl } from '../';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

const meta: Meta< typeof SelectControl > = {
	title: 'Design System/Components/Form/SelectControl',
	component: SelectControl,
	subcomponents: {
		'SelectControl.Group': SelectControl.Group,
		'SelectControl.GroupLabel': SelectControl.GroupLabel,
		'SelectControl.Item': SelectControl.Item,
	},
	argTypes: {
		onValueChange: { action: 'onValueChange' },
	},
};

export default meta;

type Story = StoryObj< typeof SelectControl >;

const defaultItems = [
	{
		value: '1',
		label: 'Item 1',
	},
	{
		value: '2',
		label: 'Item 2',
	},
];

export const Default: Story = {
	parameters: {
		// FIXME: Placeholder-like trigger text fails color-contrast (WCAG 1.4.3 applies to placeholder text).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
	args: {
		items: defaultItems,
		label: 'Label',
		description: 'This is the description.',
	},
};

/**
 * When no value is selected, the trigger shows the default placeholder text.
 *
 * Use the `placeholder` prop to customize text shown.
 * Prefer a concise label without a trailing ellipsis.
 */
export const WithCustomPlaceholder: Story = {
	parameters: {
		// FIXME: Placeholder-like trigger text fails color-contrast (WCAG 1.4.3 applies to placeholder text).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
	args: {
		...Default.args,
		placeholder: 'Choose an item',
	},
};

const nullValueOptionItems = [
	{
		value: null,
		label: 'Select theme',
	},
	{
		value: 'system',
		label: 'System default',
	},
	{
		value: 'light',
		label: 'Light',
	},
	{
		value: 'dark',
		label: 'Dark',
	},
];

/**
 * Use a `null` item value when users should be able to clear the selected value
 * from the popup.
 */
export const WithNullValueOption: Story = {
	parameters: {
		// FIXME: Placeholder-like trigger text fails color-contrast (WCAG 1.4.3 applies to placeholder text).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
	args: {
		items: nullValueOptionItems,
		label: 'Theme',
		description: 'Choose a theme preference.',
		defaultValue: nullValueOptionItems[ 0 ],
	},
};

export const VisuallyHiddenLabel: Story = {
	parameters: {
		// FIXME: Placeholder-like trigger text fails color-contrast (WCAG 1.4.3 applies to placeholder text).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
	args: {
		...Default.args,
		hideLabelFromVision: true,
	},
};

export const WithDetails: Story = {
	parameters: {
		// FIXME: Placeholder-like trigger text fails color-contrast (WCAG 1.4.3 applies to placeholder text).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
		docs: { description: { story: WITH_DETAILS_DESCRIPTION } },
	},
	args: {
		...Default.args,
		description: undefined,
		details: DETAILS_EXAMPLE,
	},
};

const disabledOptionItems = [
	{
		value: '1',
		label: 'Item 1',
	},
	{
		value: '2',
		label: 'Item 2',
		disabled: true,
	},
];

export const WithDisabledOption: Story = {
	args: {
		items: disabledOptionItems,
		label: 'Label',
		description: 'This is the description.',
		defaultValue: disabledOptionItems[ 0 ],
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
 * Options can be organized into labeled groups with `SelectControl.Group`
 * and `SelectControl.GroupLabel`. Pass a flat `items` array for trigger label
 * resolution, and use `children` to render the grouped popup content.
 */
export const Grouped: Story = {
	parameters: {
		// FIXME: Placeholder-like trigger text fails color-contrast (WCAG 1.4.3 applies to placeholder text).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
	args: {
		label: 'Fruit',
		description: 'Choose a fruit.',
		items: groupedItems.flatMap( ( group ) => group.items ),
		children: [
			groupedItems.map( ( group ) => (
				<SelectControl.Group key={ group.label }>
					<SelectControl.GroupLabel>
						{ group.label }
					</SelectControl.GroupLabel>
					{ group.items.map( ( item ) => (
						<SelectControl.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							{ item.label }
						</SelectControl.Item>
					) ) }
				</SelectControl.Group>
			) ),
		],
	},
};

const userOptions: React.ComponentProps< typeof SelectControl >[ 'items' ] = [
	{
		value: '1',
		label: 'User 1 (Admin)',
	},
	{
		value: '2',
		label: 'User 2 (Editor)',
	},
	{
		value: '3',
		label: 'User 3 (Author)',
	},
];

const User = ( { user }: { user: ( typeof userOptions )[ number ] } ) => (
	<span
		style={ {
			display: 'flex',
			alignItems: 'center',
			gap: 8,
		} }
	>
		<img
			src={ `https://gravatar.com/avatar/?d=initials&name=${
				user.value ?? 'null'
			}` }
			alt=""
			width="20"
			style={ {
				borderRadius: '50%',
			} }
		/>

		{ user.label }
	</span>
);

/**
 * To customize what is rendered inside the trigger element, pass a
 * render function to the `triggerContent` prop.
 *
 * The item list can be customized by passing an array of
 * `SelectControl.Item` as children. Note that the `label` prop of a `SelectControl.Item`
 * is used as the string to match against in the typeahead functionality, while the
 * item content is determined by `children`.
 */
export const WithCustomTriggerAndItems: Story = {
	args: {
		items: userOptions,
		label: 'Label',
		description: 'This is the description.',
		triggerContent: ( item ) => <User user={ item } />,
		children: [
			userOptions.map( ( item ) => (
				<SelectControl.Item
					key={ item.value }
					value={ item }
					label={ item.label }
				>
					<User user={ item } />
				</SelectControl.Item>
			) ),
		],

		defaultValue: userOptions[ 0 ],
	},
};

/**
 * By default, the `items` array is used to render both the Trigger
 * and the Item list. Passing a custom `triggerContent` or `children` in addition
 * to `items` will override that particular aspect of the behavior.
 * In other words, if you pass both an `items` array and a custom `triggerContent`,
 * the Item list in the popover will still be rendered based on the `items` array.
 */
export const WithItemsArrayAndPartialCustomization: Story = {
	parameters: {
		// FIXME: Placeholder-like trigger text fails color-contrast (WCAG 1.4.3 applies to placeholder text).
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
	args: {
		...Default.args,
		children: [
			Default.args?.items?.map( ( item ) => (
				<SelectControl.Item
					key={ item.value ?? 'null' }
					value={ item }
					label={ item.label }
					disabled={ item.disabled }
				>
					✨ { item.label }
				</SelectControl.Item>
			) ),
		],
	},
};
