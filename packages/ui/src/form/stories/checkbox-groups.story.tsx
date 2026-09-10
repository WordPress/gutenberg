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
 * This example wraps the group in a `Fieldset` with a legend and description.
 * The `Fieldset` labels the outer set. Each `CheckboxGroup` still needs its own
 * accessible name, such as an `aria-label` or `aria-labelledby`.
 *
 * Control checked state through `value` or `defaultValue` and `onValueChange`.
 */
export const GroupingCheckboxes: StoryObj = {
	render: function Template() {
		return (
			<Fieldset.Root>
				<Fieldset.Legend>Notifications</Fieldset.Legend>
				<Fieldset.Description>
					Choose which updates you want to receive.
				</Fieldset.Description>
				<CheckboxGroup
					defaultValue={ [ '1' ] }
					aria-label="Notifications"
				>
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
				</CheckboxGroup>
			</Fieldset.Root>
		);
	},
};

/**
 * To control a group from a parent checkbox:
 *
 * 1. Use `CheckboxGroup` in controlled mode.
 * 2. Pass the child checkbox values to `allValues`.
 * 3. Mark the parent checkbox with the `parent` prop.
 *
 * `CheckboxGroup.NestedItems` adds standard indentation to nested items.
 *
 * This example uses two `CheckboxGroup`s in one `Fieldset`. Do not nest more
 * than one level for screen readers.
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
