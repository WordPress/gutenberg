import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Checkbox } from '../../checkbox';
import { CheckboxGroup } from '../';

const meta: Meta< typeof CheckboxGroup > = {
	title: 'Design System/Components/Form/Primitives/CheckboxGroup',
	component: CheckboxGroup,
	subcomponents: {
		'CheckboxGroup.NestedItems': CheckboxGroup.NestedItems,
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and component set completeness. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
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
 * A parent checkbox can control which values in the group are selected.
 *
 * Do not nest more than one level. Deeper nesting is hard for screen readers.
 *
 * See the [Checkbox Groups](?path=/docs/design-system-components-form-checkbox-groups--docs)
 * page for labeled `CheckboxControl` examples.
 */
export const WithParentCheckbox: Story = {
	render: function Template() {
		const [ fruitValue, setFruitValue ] = useState( [ 'apple' ] );

		return (
			<CheckboxGroup
				value={ fruitValue }
				onValueChange={ setFruitValue }
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
