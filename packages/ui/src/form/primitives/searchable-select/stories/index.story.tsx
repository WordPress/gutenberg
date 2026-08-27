import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { fn } from 'storybook/test';
import { SearchableSelect } from '../';
import { ITEMS } from './fixtures';

const meta: Meta< typeof SearchableSelect > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Form/Primitives/SearchableSelect',
	component: SearchableSelect,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <SearchableSelect { ...args } />,
	subcomponents: {
		'SearchableSelect.Item': SearchableSelect.Item,
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
		defaultValue: ITEMS[ 0 ],
		items: ITEMS,
	},
};

/**
 * Mark a creatable action with `creatable: true` on an item in `items`.
 * It renders in the list footer and is excluded from the main list
 * automatically. Handle creation in `onValueChange`.
 */
export const Creatable: Story = {
	args: {
		...Default.args,
		items: ITEMS,
		value: ITEMS[ 0 ],
	},
	render: function Template( args ) {
		const {
			items = ITEMS,
			value: initialValue = ITEMS[ 0 ],
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
			<SearchableSelect
				{ ...restArgs }
				items={ [ ...items, creatableItem ] }
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
