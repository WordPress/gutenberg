import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Select from '../';

const meta: Meta< typeof Select.Root > = {
	title: 'Design System/Components/Form/Primitives/Select',
	component: Select.Root,
	subcomponents: {
		Trigger: Select.Trigger,
		Popup: Select.Popup,
		Item: Select.Item,
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
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					{ defaultItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
		defaultValue: defaultItems[ 0 ],
	},
};

export const Compact: Story = {
	args: {
		...Default.args,
		children: (
			<>
				<Select.Trigger size="compact" />
				<Select.Popup>
					{ defaultItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
							size="compact"
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
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
		...Default.args,
		children: (
			<>
				<Select.Trigger size="small" variant="minimal" />
				<Select.Popup>
					{ defaultItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
							size="small"
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
	},
};

const withEmptyOptionItems = [
	{
		value: '',
		label: 'Select',
		disabled: true,
	},
	{
		value: 'item-2',
		label: 'Item 2',
	},
];

/**
 * By passing an `items` array to `Select.Root`, the `Select.Trigger` can render
 * a `label` string for each item rather than the raw item object. In this case,
 * the option object with an empty string `value` has a `"Select"` label string.
 *
 * This may be easier than writing a custom render function for the `Select.Trigger`.
 */
export const WithEmptyValueOption: Story = {
	args: {
		items: withEmptyOptionItems,
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					{ withEmptyOptionItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
							disabled={ item.disabled }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
		defaultValue: withEmptyOptionItems[ 0 ],
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
		children: (
			<>
				<Select.Trigger aria-label="User role" />
				<Select.Popup>
					{ defaultItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
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
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					{ overflowItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
		defaultValue: overflowItems[ 0 ],
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					{ defaultItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
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
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					{ disabledItemItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
							disabled={ item.disabled }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
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
		children: (
			<>
				<Select.Trigger>
					{ ( value ) => (
						<span
							style={ {
								display: 'flex',
								alignItems: 'center',
								gap: 8,
							} }
						>
							<img
								src={ `https://gravatar.com/avatar/?d=initials&name=${ value.label }` }
								alt=""
								width="20"
								style={ {
									borderRadius: '50%',
								} }
							/>
							{ value.label }
						</span>
					) }
				</Select.Trigger>
				<Select.Popup>
					{ customOptions.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
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
		children: (
			<>
				<Select.Trigger />
				<Select.Popup
					portal={
						<Select.Portal
							style={ { '--wp-ui-select-z-index': '9999' } }
						/>
					}
				>
					{ defaultItems.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item }
							label={ item.label }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
	},
};
