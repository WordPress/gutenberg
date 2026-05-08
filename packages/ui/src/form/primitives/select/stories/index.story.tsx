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

const placeholderItems = [ 'Item 1', 'Item 2' ];

/**
 * Use the `placeholder` prop on `Select.Trigger` to show text when no
 * value is selected. The default placeholder is `"Select"`.
 */
export const WithCustomPlaceholder: Story = {
	args: {
		children: (
			<>
				<Select.Trigger placeholder="Choose an item" />
				<Select.Popup>
					{ placeholderItems.map( ( item ) => (
						<Select.Item key={ item } value={ item }>
							{ item }
						</Select.Item>
					) ) }
				</Select.Popup>
			</>
		),
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
		children: (
			<>
				<Select.Trigger />
				<Select.Popup>
					{ nullValueOptionItems.map( ( item ) => (
						<Select.Item
							key={ item.value ?? 'null' }
							value={ item.value }
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
					<Select.Item value="Item 1" />
					<Select.Item value="Item 2" />
				</Select.Popup>
			</>
		),
		defaultValue: 'Item 1',
	},
};
