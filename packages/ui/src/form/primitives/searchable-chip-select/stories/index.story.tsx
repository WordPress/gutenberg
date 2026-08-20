import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { fn } from 'storybook/test';
import { SearchableChipSelect } from '../';
import { ITEMS } from './fixtures';

const meta: Meta< typeof SearchableChipSelect > = {
	title: 'Design System/Components/Form/Primitives/SearchableChipSelect',
	component: SearchableChipSelect,
	subcomponents: {
		'SearchableChipSelect.Item': SearchableChipSelect.Item,
		'SearchableChipSelect.ChipWithRemove':
			SearchableChipSelect.ChipWithRemove,
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
 * The `creatableItem` prop is used to add some kind of "Create new item"
 * action item to the footer of the list.
 *
 * In the `onValueChange` function, add some logic to handle the creation of a new item
 * whenever the `creatableItem` is selected.
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
			value: 'create',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
		};

		return (
			<SearchableChipSelect
				{ ...args }
				creatableItem={ creatableItem }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( values: typeof ITEMS, event ) => {
					if ( values.some( ( item ) => item.value === 'create' ) ) {
						// eslint-disable-next-line no-alert
						alert( `Create new item: '${ inputValue }'` );
						setValue(
							values.filter( ( item ) => item.value !== 'create' )
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
 * Use the `showClearButton` prop to hide the clear button.
 */
export const WithoutClearButton: Story = {
	args: {
		...Default.args,
		showClearButton: false,
	},
};
