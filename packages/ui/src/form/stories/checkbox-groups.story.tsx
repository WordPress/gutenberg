import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { CheckboxControl, CheckboxGroup, Fieldset } from '..';

const meta: Meta = {
	title: 'Components/@wordpress-ui/Form/Checkbox Groups',
	id: 'design-system-components-form-checkbox-groups',
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
 * To control a group from a parent checkbox:
 *
 * 1. Use `CheckboxGroup` in controlled mode.
 * 2. Pass the child checkbox values to `allValues`.
 * 3. Mark the parent checkbox with the `parent` prop.
 *
 * Pass `CheckboxGroup` to `Fieldset.Root`'s `render` prop so `Fieldset.Legend`
 * gives the group its accessible name.
 *
 * `CheckboxGroup.NestedItems` adds standard indentation to nested items.
 *
 * Limit nesting to one level to keep groups accessible to screen reader users.
 */
export const Nesting: StoryObj = {
	render: function Template() {
		const [ value, setValue ] = useState( [ 'apple' ] );

		return (
			<Fieldset.Root
				render={
					<CheckboxGroup
						value={ value }
						onValueChange={ setValue }
						allValues={ [ 'apple', 'orange', 'banana' ] }
					/>
				}
			>
				<Fieldset.Legend>Fruit</Fieldset.Legend>
				<Fieldset.Description>
					Select the fruit you want.
				</Fieldset.Description>
				<CheckboxControl parent value="fruit" label="All fruit" />
				<CheckboxGroup.NestedItems>
					<CheckboxControl value="apple" label="Apple" />
					<CheckboxControl value="orange" label="Orange" />
					<CheckboxControl value="banana" label="Banana" />
				</CheckboxGroup.NestedItems>
			</Fieldset.Root>
		);
	},
};

/**
 * For multiple groups in one `Fieldset`, render each `CheckboxGroup` inside the
 * fieldset and give it its own accessible name with `aria-label` or
 * `aria-labelledby`.
 *
 * Each group manages its own selection and parent checkbox.
 */
export const MultipleGroups: StoryObj = {
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
					<CheckboxControl parent value="fruit" label="All fruit" />
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
					aria-label="Vegetables"
				>
					<CheckboxControl
						parent
						value="vegetable"
						label="All vegetables"
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
