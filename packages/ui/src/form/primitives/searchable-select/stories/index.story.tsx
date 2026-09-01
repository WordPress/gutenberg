import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SearchableSelect } from '../';
import {
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from '../../combobox/stories/fixtures';
import { ITEMS } from './fixtures';

const meta: Meta< typeof SearchableSelect > = {
	title: 'Design System/Components/Form/Primitives/SearchableSelect',
	component: SearchableSelect,
	subcomponents: {
		'SearchableSelect.Group': SearchableSelect.Group,
		'SearchableSelect.GroupLabel': SearchableSelect.GroupLabel,
		'SearchableSelect.Item': SearchableSelect.Item,
		'SearchableSelect.Collection': SearchableSelect.Collection,
	},
	argTypes: {
		items: { control: false },
		onValueChange: { action: fn() },
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

type Story = StoryObj< typeof SearchableSelect >;

export const Default: Story = {
	args: {
		'aria-label': 'Fruit',
		items: ITEMS,
	},
};

/**
 * When no value is selected, the trigger shows the default placeholder text.
 *
 * Use the `placeholder` prop to customize text shown.
 * Prefer a concise label without a trailing ellipsis.
 */
export const WithCustomPlaceholder: Story = {
	args: {
		'aria-label': 'Fruit',
		items: ITEMS,
		placeholder: 'Choose an item',
	},
};

const CustomFruitItem = ( { label }: { label: string } ) => (
	<span
		style={ {
			display: 'flex',
			alignItems: 'center',
			gap: 8,
		} }
	>
		<img
			src={ `https://gravatar.com/avatar/?d=initials&initials=${ label }` }
			alt=""
			width="20"
			style={ {
				borderRadius: '50%',
			} }
		/>
		{ label }
	</span>
);

/**
 * To customize what is rendered inside the trigger element, pass a
 * render function to the `triggerContent` prop.
 *
 * The item list can be customized by passing a render function as `children`,
 * returning a `Item` subcomponent for each item.
 */
export const WithCustomTriggerAndItems: Story = {
	args: {
		...Default.args,
		defaultValue: ITEMS[ 0 ],
		triggerContent: ( item: ( typeof ITEMS )[ 0 ] | null ) =>
			item ? <CustomFruitItem label={ item.label } /> : null,
		children: ( item: ( typeof ITEMS )[ 0 ] ) => (
			<SearchableSelect.Item key={ item.value } value={ item }>
				😋 { item.label }
			</SearchableSelect.Item>
		),
	},
};

/**
 * Use the `emptyContent` prop to customize the empty state,
 * which shows whenever there are no matching items.
 */
export const WithCustomEmptyContent: Story = {
	args: {
		...Default.args,
		emptyContent: 'No fruits found 🥺',
	},
};

/**
 * To render grouped items, pass an array of groups to `items` (each with
 * `label` and `items` properties) and provide `children` that renders each
 * group using `SearchableSelect.Group`, `SearchableSelect.GroupLabel`,
 * and `SearchableSelect.Collection`. Grouped items have no default
 * renderer, so `children` is required.
 */
export const Grouped: Story = {
	args: {
		...Default.args,
		items: GROUPED_ITEMS,
		children: ( group: FixtureGroup ) => (
			<SearchableSelect.Group key={ group.label } items={ group.items }>
				<SearchableSelect.GroupLabel>
					{ group.label }
				</SearchableSelect.GroupLabel>
				<SearchableSelect.Collection>
					{ ( item: FixtureItem ) => (
						<SearchableSelect.Item
							key={ item.value }
							value={ item }
						>
							{ item.label }
						</SearchableSelect.Item>
					) }
				</SearchableSelect.Collection>
			</SearchableSelect.Group>
		),
	},
};
