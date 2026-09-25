import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SearchableChipSelect } from '../';
import {
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from '../../combobox/stories/fixtures';
import { ITEMS } from './fixtures';

const meta: Meta< typeof SearchableChipSelect > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/SearchableChipSelect',
	id: 'design-system-components-form-primitives-searchablechipselect',
	component: SearchableChipSelect,
	subcomponents: {
		'SearchableChipSelect.Group': SearchableChipSelect.Group,
		'SearchableChipSelect.GroupLabel': SearchableChipSelect.GroupLabel,
		'SearchableChipSelect.Item': SearchableChipSelect.Item,
		'SearchableChipSelect.ItemLabel': SearchableChipSelect.ItemLabel,
		'SearchableChipSelect.ItemDescription':
			SearchableChipSelect.ItemDescription,
		'SearchableChipSelect.ChipWithRemove':
			SearchableChipSelect.ChipWithRemove,
		'SearchableChipSelect.Collection': SearchableChipSelect.Collection,
	},
	argTypes: {
		items: { control: false },
		onValueChange: { action: fn() },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof SearchableChipSelect >;

export const Default: Story = {
	args: {
		defaultValue: [ ITEMS[ 0 ], ITEMS[ 1 ] ],
		items: ITEMS,
		'aria-label': 'Fruit',
	},
};

/**
 * Item descriptions appear below labels in the popup and are not copied to chips.
 */
export const WithItemDescriptions: Story = {
	args: {
		...Default.args,
		defaultValue: [],
		items: [
			{ value: 'apple', label: 'Apple', description: 'A crisp fruit.' },
			{ value: 'banana', label: 'Banana', description: 'A soft fruit.' },
		],
	},
};

/**
 * To customize what is rendered inside the chips, pass a
 * render function to the `chipsContent` prop that returns an array of `ChipWithRemove` subcomponents.
 *
 * The item list can be customized by passing a render function as `children`,
 * returning an `Item` subcomponent for each item.
 */
export const WithCustomChipsAndItems: Story = {
	args: {
		...Default.args,
		chipsContent: ( value: typeof ITEMS ) =>
			value.map( ( item ) => (
				<SearchableChipSelect.ChipWithRemove
					key={ item.value }
					prefix={
						<img
							src={ `https://gravatar.com/avatar/?d=initials&initials=${ item.label }` }
							alt=""
							style={ { width: '100%' } }
						/>
					}
				>
					{ item.label }
				</SearchableChipSelect.ChipWithRemove>
			) ),
		children: ( item: ( typeof ITEMS )[ 0 ] ) => (
			<SearchableChipSelect.Item key={ item.value } value={ item }>
				<SearchableChipSelect.ItemLabel>
					😋 { item.label }
				</SearchableChipSelect.ItemLabel>
			</SearchableChipSelect.Item>
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
		emptyContent: 'No fruit found 🥺',
	},
};

/**
 * To render grouped items, pass an array of groups to `items` (each with
 * `label` and `items` properties) and provide `children` that renders each
 * group using `SearchableChipSelect.Group`, `SearchableChipSelect.GroupLabel`,
 * and `SearchableChipSelect.Collection`. Grouped items have no default
 * renderer, so `children` is required.
 */
export const Grouped: Story = {
	args: {
		'aria-label': 'Fruit',
		items: GROUPED_ITEMS,
		children: ( group: FixtureGroup ) => (
			<SearchableChipSelect.Group
				key={ group.label }
				items={ group.items }
			>
				<SearchableChipSelect.GroupLabel>
					{ group.label }
				</SearchableChipSelect.GroupLabel>
				<SearchableChipSelect.Collection>
					{ ( item: FixtureItem ) => (
						<SearchableChipSelect.Item
							key={ item.value }
							value={ item }
						>
							<SearchableChipSelect.ItemLabel>
								{ item.label }
							</SearchableChipSelect.ItemLabel>
						</SearchableChipSelect.Item>
					) }
				</SearchableChipSelect.Collection>
			</SearchableChipSelect.Group>
		),
	},
};

/**
 * Use the `showClearButton` prop to hide the clear button.
 */
export const WithoutClearButton: Story = {
	args: {
		...Default.args,
		showClearButton: false,
	},
};
