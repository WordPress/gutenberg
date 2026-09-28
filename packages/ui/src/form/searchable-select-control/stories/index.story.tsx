import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from '@wordpress/element';
import { fn } from 'storybook/test';
import { Spinner } from '../../../spinner';
import { Stack } from '../../../stack';
import { VisuallyHidden } from '../../../visually-hidden';
import { SearchableSelectControl } from '../';
import {
	GROUPED_ITEMS,
	type FixtureGroup,
	type FixtureItem,
} from '../../primitives/combobox/stories/fixtures';
import { ITEMS } from '../../primitives/searchable-select/stories/fixtures';
import * as SearchableSelectStories from '../../primitives/searchable-select/stories/index.story';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
	longLabelPopupItems,
	narrowContainerDecorator,
} from '../../stories/shared';

const meta: Meta< typeof SearchableSelectControl > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/SearchableSelectControl',
	id: 'design-system-components-form-searchableselectcontrol',
	component: SearchableSelectControl,
	subcomponents: {
		'SearchableSelectControl.Group': SearchableSelectControl.Group,
		'SearchableSelectControl.GroupLabel':
			SearchableSelectControl.GroupLabel,
		'SearchableSelectControl.Item': SearchableSelectControl.Item,
		'SearchableSelectControl.Collection':
			SearchableSelectControl.Collection,
	},
	argTypes: {
		items: { control: false },
		value: { control: false },
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

type Story = StoryObj< typeof SearchableSelectControl >;

export const Default: Story = {
	...SearchableSelectStories.Default,
	args: {
		...SearchableSelectStories.Default.args,
		label: 'Label',
		description: 'This is a description.',
	},
};

/**
 * When no value is selected, the trigger shows the default placeholder text.
 *
 * Use the `placeholder` prop to customize text shown.
 * Prefer a concise label without a trailing ellipsis.
 */
export const WithCustomPlaceholder: Story = {
	...SearchableSelectStories.WithCustomPlaceholder,
	args: {
		...SearchableSelectStories.WithCustomPlaceholder.args,
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
		defaultValue: disabledOptionItems[ 0 ],
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
	},
	render: function Template( args ) {
		const { items = ITEMS, ...restArgs } = args;
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState<
			React.ComponentProps< typeof SearchableSelectControl >[ 'value' ]
		>( ITEMS[ 0 ] );
		const creatableItem = {
			value: '__create__',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
			creatable: true,
		};

		return (
			<SearchableSelectControl
				{ ...restArgs }
				items={ [ ...( items as FixtureItem[] ), creatableItem ] }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( newValue, event ) => {
					if ( ! newValue ) {
						return;
					}

					if ( newValue.value === creatableItem.value ) {
						// eslint-disable-next-line no-alert
						alert( `Create new item: '${ inputValue }'` );
					} else {
						setValue( newValue );
					}
					args.onValueChange?.( newValue, event );
				} }
			/>
		);
	},
};

export const WithCustomTriggerAndItems: Story = {
	...SearchableSelectStories.WithCustomTriggerAndItems,
	args: {
		...Default.args,
		...SearchableSelectStories.WithCustomTriggerAndItems.args,
	},
};

export const WithCustomEmptyContent: Story = {
	...SearchableSelectStories.WithCustomEmptyContent,
	args: {
		...Default.args,
		...SearchableSelectStories.WithCustomEmptyContent.args,
	},
};

function HiddenResultCount() {
	const count =
		SearchableSelectControl.useFilteredItems< ( typeof ITEMS )[ number ] >()
			.length;

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
 * Loads the item list asynchronously. `statusContent` shows loading, then
 * a visually hidden result count. Pass `emptyContent={ null }` while
 * loading so Empty does not claim there are no results.
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
			<SearchableSelectControl
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

/**
 * Options can be organized into labeled groups with
 * `SearchableSelectControl.Group`, `SearchableSelectControl.GroupLabel`,
 * and `SearchableSelectControl.Collection`. Pass an array of groups to
 * `items` (each with `label` and `items` properties), and use `children` to
 * render each group.
 */
export const Grouped: Story = {
	...SearchableSelectStories.Grouped,
	args: {
		...SearchableSelectStories.Grouped.args,
		defaultValue: GROUPED_ITEMS[ 0 ].items[ 0 ],
		label: 'Fruit',
		description: 'Choose your favorite fruit.',
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
		description: 'Choose your favorite fruit.',
	},
	render: function Template( args ) {
		const [ inputValue, setInputValue ] = useState( '' );
		const [ value, setValue ] = useState< FixtureItem >(
			GROUPED_ITEMS[ 0 ].items[ 0 ]
		);
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
			<SearchableSelectControl
				{ ...args }
				items={ items }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( newValue: FixtureItem | null, event ) => {
					if ( ! newValue ) {
						return;
					}

					if ( newValue.value === creatableItem.value ) {
						// eslint-disable-next-line no-alert
						alert( `Create new item: '${ inputValue }'` );
					} else {
						setValue( newValue );
					}
					args.onValueChange?.( newValue, event );
				} }
				children={ ( group: FixtureGroup ) => (
					<SearchableSelectControl.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableSelectControl.GroupLabel>
							{ group.label }
						</SearchableSelectControl.GroupLabel>
						<SearchableSelectControl.Collection>
							{ ( item: FixtureItem ) => (
								<SearchableSelectControl.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableSelectControl.Item>
							) }
						</SearchableSelectControl.Collection>
					</SearchableSelectControl.Group>
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
		value: longLabelPopupItems[ 0 ],
	},
};
