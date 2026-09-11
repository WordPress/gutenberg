import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { CheckboxControl, CheckboxGroup, Fieldset } from '..';

const meta: Meta = {
	title: 'Design System/Components/Form/Checkbox Groups',
	tags: [ '!autodocs', '!dev' ],
	parameters: {
		controls: { disable: true },
	},
};
export default meta;

/**
 * Compose checkbox groups from `CheckboxGroup` and `CheckboxControl`.
 *
 * This example composes `Fieldset.Root` and `CheckboxGroup` on one element.
 * The fieldset legend gives the group its accessible name.
 *
 * Control checked state through `value` or `defaultValue` and `onValueChange`.
 */
export const GroupingCheckboxes: StoryObj = {
	render: function Template() {
		return (
			<Fieldset.Root
				render={ <CheckboxGroup defaultValue={ [ '1' ] } /> }
			>
				<Fieldset.Legend>Notifications</Fieldset.Legend>
				<Fieldset.Description>
					Choose which updates you want to receive.
				</Fieldset.Description>
				<CheckboxControl
					value="1"
					label="Comments"
					description="Notify me when someone comments."
				/>
				<CheckboxControl
					value="2"
					label="Mentions"
					description="Notify me when someone mentions me."
				/>
				<CheckboxControl
					value="3"
					label="Follows"
					description="Notify me when someone follows me."
				/>
			</Fieldset.Root>
		);
	},
};

/**
 * To control a group of checkboxes from a single parent checkbox:
 *
 * 1. Use `CheckboxGroup` in controlled mode.
 * 2. Pass an array of the child checkbox values to the `allValues` prop.
 * 3. Mark the parent checkbox with the `parent` boolean prop.
 *
 * A `CheckboxGroup.NestedItems` component is also available for adding standard
 * indentation to the nested checkbox items.
 *
 * In this example, there are two `CheckboxGroup`s, one for fruits and one for
 * vegetables. The two are grouped together in a single `Fieldset`, labeled by
 * a legend.
 *
 * For screen reader accessibility, do not nest more than one level.
 */
export const Nesting: StoryObj = {
	render: function Template() {
		const [ fruitValue, setFruitValue ] = useState( [ 'apple' ] );
		const [ vegetableValue, setVegetableValue ] = useState< string[] >(
			[]
		);

		return (
			<Fieldset.Root>
				<Fieldset.Legend>Produce</Fieldset.Legend>
				<Fieldset.Description>
					Select the fruit and vegetables you want.
				</Fieldset.Description>
				<CheckboxGroup
					value={ fruitValue }
					onValueChange={ setFruitValue }
					allValues={ [ 'apple', 'orange', 'banana' ] }
					aria-label="Fruit"
				>
					<CheckboxControl parent value="fruit" label="Fruit" />
					<CheckboxGroup.NestedItems>
						<CheckboxControl value="apple" label="Apple" />
						<CheckboxControl value="orange" label="Orange" />
						<CheckboxControl value="banana" label="Banana" />
					</CheckboxGroup.NestedItems>
				</CheckboxGroup>
				<CheckboxGroup
					value={ vegetableValue }
					onValueChange={ setVegetableValue }
					allValues={ [ 'carrot', 'lettuce', 'pepper' ] }
					aria-label="Vegetable"
				>
					<CheckboxControl
						parent
						value="vegetable"
						label="Vegetable"
					/>
					<CheckboxGroup.NestedItems>
						<CheckboxControl value="carrot" label="Carrot" />
						<CheckboxControl value="lettuce" label="Lettuce" />
						<CheckboxControl value="pepper" label="Pepper" />
					</CheckboxGroup.NestedItems>
				</CheckboxGroup>
			</Fieldset.Root>
		);
	},
};
