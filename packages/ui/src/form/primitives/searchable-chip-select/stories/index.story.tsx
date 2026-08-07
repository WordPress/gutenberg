import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { fn } from 'storybook/test';
import { SearchableChipSelect } from '../';
import {
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from '../../combobox/stories/fixtures';
import { ITEMS } from './fixtures';

const meta: Meta< typeof SearchableChipSelect > = {
	title: 'Design System/Components/Form/Primitives/SearchableChipSelect',
	component: SearchableChipSelect,
	subcomponents: {
		'SearchableChipSelect.Group': SearchableChipSelect.Group,
		'SearchableChipSelect.GroupLabel': SearchableChipSelect.GroupLabel,
		'SearchableChipSelect.Item': SearchableChipSelect.Item,
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
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, overlays compatibility, and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof SearchableChipSelect >;

export const Default: Story = {
	args: {
		defaultValue: [ ITEMS[ 0 ], ITEMS[ 1 ] ],
		items: ITEMS,
	},
};

/**
 * The `creatableItem` prop renders a creatable action in the list footer.
 * The same item must also be included in `items`, excluded from the main
 * list via `children`, and handled in `onValueChange`.
 */
export const Creatable: Story = {
	args: {
		...Default.args,
	},
	render: function Template( args ) {
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState< typeof ITEMS >( [
			ITEMS[ 0 ],
			ITEMS[ 1 ],
		] );
		const creatableItem = {
			value: '__create__',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
		};

		return (
			<SearchableChipSelect
				{ ...args }
				items={ [ ...ITEMS, creatableItem ] }
				creatableItem={ creatableItem }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( values: typeof ITEMS, event ) => {
					if (
						values.some(
							( item ) => item.value === creatableItem.value
						)
					) {
						// eslint-disable-next-line no-alert
						alert( `Create new item: '${ inputValue }'` );
						setValue(
							values.filter(
								( item ) => item.value !== creatableItem.value
							)
						);
					} else {
						setValue( values );
					}
					args.onValueChange?.( values, event );
				} }
				children={ ( item: ( typeof ITEMS )[ 0 ] ) =>
					item.value !== creatableItem.value && (
						<SearchableChipSelect.Item
							key={ item.value }
							value={ item }
						>
							{ item.label }
						</SearchableChipSelect.Item>
					)
				}
			/>
		);
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
				😋 { item.label }
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
 * and `SearchableChipSelect.Collection`.
 */
export const Grouped: Story = {
	args: {
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
							{ item.label }
						</SearchableChipSelect.Item>
					) }
				</SearchableChipSelect.Collection>
			</SearchableChipSelect.Group>
		),
	},
};

/**
 * Grouped items with a creatable footer item. Include the creatable item in
 * `items` as a group, exclude it from the main list in `children`, and handle
 * creation in `onValueChange`.
 */
export const GroupedCreatable: Story = {
	render: function Template( args ) {
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState< FixtureItem[] >( [
			GROUPED_ITEMS[ 0 ].items[ 0 ],
			GROUPED_ITEMS[ 1 ].items[ 0 ],
		] );
		const creatableItem = {
			value: '__create__',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
		};
		const items = [
			...GROUPED_ITEMS,
			{ label: '', items: [ creatableItem ] },
		];

		return (
			<SearchableChipSelect
				{ ...args }
				items={ items }
				creatableItem={ creatableItem }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( values: FixtureItem[], event ) => {
					if (
						values.some(
							( item ) => item.value === creatableItem.value
						)
					) {
						// eslint-disable-next-line no-alert
						alert( `Create new item: '${ inputValue }'` );
						setValue(
							values.filter(
								( item ) => item.value !== creatableItem.value
							)
						);
					} else {
						setValue( values );
					}
					args.onValueChange?.( values, event );
				} }
				children={ ( group: FixtureGroup ) => {
					if ( group.items[ 0 ]?.value === creatableItem.value ) {
						return null;
					}

					return (
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
										{ item.label }
									</SearchableChipSelect.Item>
								) }
							</SearchableChipSelect.Collection>
						</SearchableChipSelect.Group>
					);
				} }
			/>
		);
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
