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
 * 1. Pass the child checkbox values to `allValues`.
 * 1. Mark the parent checkbox with the `parent` prop.
 *
 * Pass `CheckboxGroup` to `Fieldset.Root`'s `render` prop so `Fieldset.Legend`
 * gives the group its accessible name.
 *
 * `CheckboxGroup.NestedItems` adds standard indentation to nested items.
 *
 * For multiple groups in one `Fieldset`, render each `CheckboxGroup` inside the
 * fieldset and give it its own accessible name with `aria-label` or
 * `aria-labelledby`. Do not nest more than one level for screen readers.
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
