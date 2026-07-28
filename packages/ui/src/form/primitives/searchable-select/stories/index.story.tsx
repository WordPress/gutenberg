import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { fn } from 'storybook/test';
import { SearchableSelect } from '../';
import { ITEMS } from './fixtures';

const meta: Meta< typeof SearchableSelect > = {
	title: 'Design System/Components/Form/Primitives/SearchableSelect',
	component: SearchableSelect,
	subcomponents: {
		Item: SearchableSelect.Item,
	},
	argTypes: {
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
		defaultValue: ITEMS[ 0 ],
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
		const [ value, setValue ] = useState<
			React.ComponentProps< typeof SearchableSelect >[ 'value' ]
		>( ITEMS[ 0 ] );
		const creatableItem = {
			value: 'create',
			label:
				'Create new item' + ( inputValue ? `: ${ inputValue }` : '' ),
		};

		return (
			<SearchableSelect
				{ ...args }
				creatableItem={ creatableItem }
				inputValue={ inputValue }
				onInputValueChange={ setInputValue }
				value={ value }
				onValueChange={ ( newValue, event ) => {
					if ( ! newValue ) {
						return;
					}

					if ( newValue.value === 'create' ) {
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
		triggerContent: ( item: ( typeof ITEMS )[ 0 ] ) => (
			<CustomFruitItem label={ item.label } />
		),
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
