import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from '@wordpress/element';
import { fn } from 'storybook/test';
import { Spinner } from '../../../spinner';
import { Stack } from '../../../stack';
import { VisuallyHidden } from '../../../visually-hidden';
import { SearchableChipSelectControl } from '../';
import {
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from '../../primitives/combobox/stories/fixtures';
import { ITEMS } from '../../primitives/searchable-chip-select/stories/fixtures';
import * as SearchableChipSelectStories from '../../primitives/searchable-chip-select/stories/index.story';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
	longLabelPopupItems,
	narrowContainerDecorator,
} from '../../stories/shared';

const meta: Meta< typeof SearchableChipSelectControl > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/SearchableChipSelectControl',
	component: SearchableChipSelectControl,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <SearchableChipSelectControl { ...args } />,
	subcomponents: {
		'SearchableChipSelectControl.Group': SearchableChipSelectControl.Group,
		'SearchableChipSelectControl.GroupLabel':
			SearchableChipSelectControl.GroupLabel,
		'SearchableChipSelectControl.Item': SearchableChipSelectControl.Item,
		'SearchableChipSelectControl.ChipWithRemove':
			SearchableChipSelectControl.ChipWithRemove,
		'SearchableChipSelectControl.Collection':
			SearchableChipSelectControl.Collection,
	},
	argTypes: {
		items: { control: false },
		value: { control: false },
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

type Story = StoryObj< typeof SearchableChipSelectControl >;

export const Default: Story = {
	...SearchableChipSelectStories.Default,
	args: {
		...SearchableChipSelectStories.Default.args,
		label: 'Label',
		description: 'This is a description.',
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

/**
 * Use the `searchPlaceholder` prop to customize the search input placeholder
 * text. Prefer a concise label without a trailing ellipsis.
 */
export const WithCustomSearchPlaceholder: Story = {
	args: {
		...Default.args,
		searchPlaceholder: 'Search fruit',
	},
};

const disabledOptionItems = [
	{
		value: 'apple',
		label: 'Apple',
	},
	{
		value: 'banana',
		label: 'Banana',
		disabled: true,
	},
	{
		value: 'cherry',
		label: 'Cherry',
	},
];

export const WithDisabledOption: Story = {
	args: {
		...Default.args,
		items: disabledOptionItems,
		defaultValue: [ disabledOptionItems[ 0 ] ],
	},
};

/**
 * Mark a creatable action with `creatable: true` on an item in `items`.
 * It renders in the list footer, not the main list, when it is in the
 * filtered items. Handle the creation of the item in `onValueChange`.
 */
export const Creatable: Story = {
	args: {
		...Default.args,
		items: ITEMS,
		value: [ ITEMS[ 0 ], ITEMS[ 1 ] ],
	},
	render: function Template( args ) {
		const {
			items = ITEMS,
			value: initialValue = [ ITEMS[ 0 ], ITEMS[ 1 ] ],
			...restArgs
		} = args;
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState( initialValue );
		const creatableItem = {
			value: '__create__',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
			creatable: true,
		};

		return (
			<SearchableChipSelectControl
				{ ...restArgs }
				items={ [ ...( items as FixtureItem[] ), creatableItem ] }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( values, event ) => {
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
			/>
		);
	},
};

export const WithCustomChipsAndItems: Story = {
	...SearchableChipSelectStories.WithCustomChipsAndItems,
	args: {
		...Default.args,
		...SearchableChipSelectStories.WithCustomChipsAndItems.args,
	},
};

export const WithCustomEmptyContent: Story = {
	...SearchableChipSelectStories.WithCustomEmptyContent,
	args: {
		...Default.args,
		...SearchableChipSelectStories.WithCustomEmptyContent.args,
	},
};

function HiddenResultCount() {
	const count =
		SearchableChipSelectControl.useFilteredItems<
			( typeof ITEMS )[ number ]
		>().length;

	if ( count === 0 ) {
		return null;
	}

	return (
		<VisuallyHidden>
			{ count === 1 ? '1 result found.' : `${ count } results found.` }
		</VisuallyHidden>
	);
}

/**
 * Loads the item list asynchronously. Keep `statusContent` on the live
 * region. It shows loading, then a visually hidden result count. Pass
 * `emptyContent={ null }` while loading so Empty does not claim there are
 * no results.
 */
export const AsyncItems: Story = {
	args: {
		label: 'Label',
		description: 'This is a description.',
	},
	render: function Template( args ) {
		const [ loading, setLoading ] = useState( false );
		const [ items, setItems ] = useState< typeof ITEMS >( [] );
		const timeoutRef = useRef< ReturnType< typeof setTimeout > >();

		return (
			<SearchableChipSelectControl
				{ ...args }
				items={ items }
				statusContent={
					loading ? (
						<Stack direction="row" gap="sm" align="center">
							<Spinner />
							Loading…
						</Stack>
					) : (
						<HiddenResultCount />
					)
				}
				emptyContent={ loading ? null : undefined }
				onOpenChange={ ( open ) => {
					if ( ! open ) {
						clearTimeout( timeoutRef.current );
						return;
					}
					setLoading( true );
					setItems( [] );
					clearTimeout( timeoutRef.current );
					timeoutRef.current = setTimeout( () => {
						setItems( ITEMS );
						setLoading( false );
					}, 500 );
				} }
			/>
		);
	},
};

export const WithoutClearButton: Story = {
	...SearchableChipSelectStories.WithoutClearButton,
	args: {
		...Default.args,
		...SearchableChipSelectStories.WithoutClearButton.args,
	},
};

/**
 * Options can be organized into labeled groups with
 * `SearchableChipSelectControl.Group`, `SearchableChipSelectControl.GroupLabel`,
 * and `SearchableChipSelectControl.Collection`. Pass an array of groups to
 * `items` (each with `label` and `items` properties), and use `children` to
 * render each group.
 */
export const Grouped: Story = {
	...SearchableChipSelectStories.Grouped,
	args: {
		...SearchableChipSelectStories.Grouped.args,
		defaultValue: [
			GROUPED_ITEMS[ 0 ].items[ 0 ],
			GROUPED_ITEMS[ 1 ].items[ 0 ],
		],
		label: 'Fruit',
		description: 'Choose your favorite fruits.',
	},
};

/**
 * Grouped items with a creatable footer item. Include the creatable item in
 * `items` as a creatable-only group. Handle the creation of the item in
 * `onValueChange`.
 */
export const GroupedCreatable: Story = {
	args: {
		...Default.args,
		label: 'Fruit',
		description: 'Choose your favorite fruits.',
	},
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
			creatable: true,
		};
		const items = [
			...GROUPED_ITEMS,
			{ label: '', items: [ creatableItem ] },
		];

		return (
			<SearchableChipSelectControl
				{ ...args }
				items={ items }
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
				children={ ( group: FixtureGroup ) => (
					<SearchableChipSelectControl.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableChipSelectControl.GroupLabel>
							{ group.label }
						</SearchableChipSelectControl.GroupLabel>
						<SearchableChipSelectControl.Collection>
							{ ( item: FixtureItem ) => (
								<SearchableChipSelectControl.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableChipSelectControl.Item>
							) }
						</SearchableChipSelectControl.Collection>
					</SearchableChipSelectControl.Group>
				) }
			/>
		);
	},
};

/**
 * Use `popupWidth` to control how the popup width is constrained relative to
 * its anchor.
 *
 * This example uses `sm`, allowing the popup to extend beyond the narrow anchor width.
 */
export const PopupWidth: Story = {
	...Creatable,
	decorators: [ narrowContainerDecorator ],
	args: {
		...Creatable.args,
		label: 'Tags',
		popupWidth: 'sm',
		items: longLabelPopupItems,
		value: [ longLabelPopupItems[ 0 ] ],
	},
};
