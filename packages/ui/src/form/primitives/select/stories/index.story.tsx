import type { Meta, StoryObj } from '@storybook/react-vite';
import '@wordpress/theme/design-tokens.css';
import { Select } from '../../../..';

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

export const Default: Story = {
	args: {
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					{ Array.from( { length: 6 }, ( _, index ) => (
						<Select.Item
							key={ index }
							value={ `Item ${ index + 1 }` }
						/>
					) ) }
				</Select.Popup>
			</>
		),
	},
};

export const Compact: Story = {
	args: {
		children: (
			<>
				<Select.Trigger size="compact" />
				<Select.Popup>
					{ Array.from( { length: 6 }, ( _, index ) => (
						<Select.Item
							key={ index }
							value={ `Item ${ index + 1 }` }
							size="compact"
						/>
					) ) }
				</Select.Popup>
			</>
		),
		defaultValue: 'Item 1',
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
		children: (
			<>
				<Select.Trigger size="small" variant="minimal" />
				<Select.Popup>
					{ Array.from( { length: 6 }, ( _, index ) => (
						<Select.Item
							key={ index }
							value={ `${ index + 1 }` }
							size="small"
						/>
					) ) }
				</Select.Popup>
			</>
		),
		defaultValue: '1',
	},
};

const withEmptyOptionItems = [
	{
		value: '',
		label: 'Select',
		disabled: true,
	},
	{
		value: 'Item 2',
		label: 'Item 2',
	},
];

/**
 * By passing an `items` array to `Select.Root`, the `Select.Trigger` will be able to
 * render a `label` string for each item rather than the raw `value` string. In this
 * case, the option with an empty string value has a `"Select"` label string.
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
							value={ item.value }
							label={ item.label }
							disabled={ item.disabled }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
		defaultValue: '',
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
		children: (
			<>
				<Select.Trigger aria-label="User role" />
				<Select.Popup>
					<Select.Item value="Administrator" />
					<Select.Item value="Editor" />
				</Select.Popup>
			</>
		),
		defaultValue: 'Administrator',
	},
};

const longItemValue =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

export const WithOverflow: Story = {
	args: {
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value={ longItemValue } />
					<Select.Item value="Item 2" />
				</Select.Popup>
			</>
		),
		defaultValue: longItemValue,
	},
};

export const Disabled: Story = {
	args: {
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="Item 1" />
					<Select.Item value="Item 2" />
				</Select.Popup>
			</>
		),
		defaultValue: 'Item 1',
		disabled: true,
	},
};

export const WithDisabledItem: Story = {
	args: {
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="Item 1" />
					<Select.Item value="Item 2" disabled />
				</Select.Popup>
			</>
		),
		defaultValue: 'Item 1',
	},
};

const customOptions = [
	{
		value: 'User 1',
		label: 'User 1 (Admin)',
	},
	{
		value: 'User 2',
		label: 'User 2 (Editor)',
	},
];

/**
 * For custom needs, a `Select.Trigger` can take a custom render function as its children,
 * while `Select.Item` can take arbitrary content as children.
 */
export const WithCustomTriggerAndItem: Story = {
	args: {
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
								src={ `https://gravatar.com/avatar/?d=initials&name=${ value }` }
								alt=""
								width="20"
								style={ {
									borderRadius: '50%',
								} }
							/>
							{ value }
						</span>
					) }
				</Select.Trigger>
				<Select.Popup>
					{ customOptions.map( ( item ) => (
						<Select.Item
							key={ item.value }
							value={ item.value }
							label={ item.label }
						>
							{ item.label }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
		defaultValue: 'User 1',
	},
};

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can create
 * situations where a popover renders below another popover, when you want it to be rendered above.
 *
 * The `--wp-ui-select-z-index` CSS variable, available on the `Select.Popup` component,
 * is an escape hatch that can be used to override the z-index of a given `Select` popover
 * on a case-by-case basis.
 */
export const WithCustomZIndex: Story = {
	name: 'With Custom z-index',
	args: {
		children: (
			<>
				<Select.Trigger />
				<Select.Popup style={ { '--wp-ui-select-z-index': '1000001' } }>
					<Select.Item value="Item 1" />
					<Select.Item value="Item 2" />
				</Select.Popup>
			</>
		),
		defaultValue: 'Item 1',
	},
};
