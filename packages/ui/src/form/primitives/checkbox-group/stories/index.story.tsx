import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Checkbox } from '../../checkbox';
import { CheckboxGroup } from '../';

const meta: Meta< typeof CheckboxGroup > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/CheckboxGroup',
	id: 'design-system-components-form-primitives-checkboxgroup',
	component: CheckboxGroup,
	subcomponents: {
		'CheckboxGroup.NestedItems': CheckboxGroup.NestedItems,
	},
	argTypes: {
		onValueChange: { action: 'onValueChange' },
	},
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};

export default meta;

type Story = StoryObj< typeof CheckboxGroup >;

export const Default: Story = {
	args: {
		defaultValue: [],
		'aria-label': 'Fruit',
	},
	render: ( args ) => (
		<CheckboxGroup { ...args }>
			{ [ 'Apple', 'Banana', 'Orange' ].map( ( label ) => (
				<Checkbox key={ label } value={ label } aria-label={ label } />
			) ) }
		</CheckboxGroup>
	),
};

/**
 * `CheckboxGroup` can be used to control a group of checkboxes from a single
 * parent checkbox.
 *
 * For screen reader accessibility, do not nest more than one level.
 *
 * See the [Checkbox Groups](?path=/docs/design-system-components-form-checkbox-groups--docs#nesting)
 * documentation for a full example.
 */
export const WithParentCheckbox: Story = {
	render: function Template( args ) {
		const [ fruitValue, setFruitValue ] = useState( [ 'apple' ] );

		return (
			<CheckboxGroup
				value={ fruitValue }
				onValueChange={ ( nextValue, ...changeArgs ) => {
					setFruitValue( nextValue );
					args.onValueChange?.( nextValue, ...changeArgs );
				} }
				allValues={ [ 'apple', 'orange', 'banana' ] }
				aria-label="Fruit"
			>
				<Checkbox parent value="fruit" aria-label="Fruit" />
				<CheckboxGroup.NestedItems>
					<Checkbox value="apple" aria-label="Apple" />
					<Checkbox value="orange" aria-label="Orange" />
					<Checkbox value="banana" aria-label="Banana" />
				</CheckboxGroup.NestedItems>
			</CheckboxGroup>
		);
	},
};
