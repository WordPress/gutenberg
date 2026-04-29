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
		Item: SelectControl.Item,
	},
	argTypes: {
		onValueChange: { action: 'onValueChange' },
	},
};

export default meta;

type Story = StoryObj< typeof SelectControl >;

/**
 * When showing a "placeholder" item, prefer a concise label such as "Select"
 * without a trailing ellipsis. By default, items with an empty string value
 * will be rendered with a lighter color in the trigger.
 *
 * It is recommended to also add `disabled` to the placeholder item so it cannot be reselected.
 */
export const Default: Story = {
	args: {
		items: [
			{
				value: '',
				label: 'Select',
				disabled: true,
			},
			{
				value: '1',
				label: 'Item 1',
			},
			{
				value: '2',
				label: 'Item 2',
			},
		],
		label: 'Label',
		description: 'This is the description.',
		defaultValue: '',
	},
};

export const VisuallyHiddenLabel: Story = {
	args: {
		...Default.args,
		hideLabelFromVision: true,
	},
};

export const WithDetails: Story = {
	parameters: {
		docs: { description: { story: WITH_DETAILS_DESCRIPTION } },
	},
	args: {
		...Default.args,
		description: undefined,
		details: DETAILS_EXAMPLE,
	},
};

export const WithDisabledOption: Story = {
	args: {
		items: [
			{
				value: '1',
				label: 'Item 1',
			},
			{
				value: '2',
				label: 'Item 2',
				disabled: true,
			},
		],
		label: 'Label',
		description: 'This is the description.',
		defaultValue: '1',
	},
};

const User = ( { uuid }: { uuid: string } ) => (
	<span
		style={ {
			display: 'flex',
			alignItems: 'center',
			gap: 8,
		} }
	>
		<img
			src={ `https://gravatar.com/avatar/?d=initials&initials=U${ uuid }` }
			alt=""
			width="20"
			style={ {
				borderRadius: '50%',
			} }
		/>
		{ `User ${ uuid }` }
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
		label: 'Label',
		description: 'This is the description.',
		triggerContent: ( value: string ) => <User uuid={ value } />,
		children: (
			<>
				{ [ '1', '2', '3' ].map( ( item ) => (
					<SelectControl.Item
						key={ item }
						value={ item }
						label={ `User ${ item }` }
					>
						<User uuid={ item } />
					</SelectControl.Item>
				) ) }
			</>
		),
		defaultValue: '1',
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
	args: {
		...Default.args,
		children: (
			<>
				{ Default.args?.items?.map( ( item ) => (
					<SelectControl.Item
						key={ item.value }
						value={ item.value }
						label={ item.label }
						disabled={ item.disabled }
					>
						✨ { item.label }
					</SelectControl.Item>
				) ) }
			</>
		),
	},
};
