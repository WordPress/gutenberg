import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fieldset, InputControl, InputLayout } from '..';
import { Stack } from '../../stack';

const meta: Meta = {
	title: 'Design System/Components/Form/Best Practices',
	tags: [ '!dev' ],
	parameters: {
		controls: { disable: true },
	},
};
export default meta;

/**
 * When several controls share one visible group label, use a fieldset
 * legend for the group. Give each `InputControl` its own `label` and set
 * `hideLabelFromVision` so only the group label stays visible.
 */
export const LabelingComposedComponents: StoryObj = {
	render: function Template() {
		return (
			<Fieldset.Root>
				<Fieldset.Legend>Shipping weight</Fieldset.Legend>
				<Stack direction="row" gap="sm">
					<InputControl
						label="Pounds"
						hideLabelFromVision
						type="number"
						suffix={
							<InputLayout.Slot aria-hidden>lb</InputLayout.Slot>
						}
					/>
					<InputControl
						label="Ounces"
						hideLabelFromVision
						type="number"
						suffix={
							<InputLayout.Slot aria-hidden>oz</InputLayout.Slot>
						}
					/>
				</Stack>
				<Fieldset.Description>
					Enter the total weight of your shipment.
				</Fieldset.Description>
			</Fieldset.Root>
		);
	},
};
