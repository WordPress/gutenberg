import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fieldset, InputControl, InputLayout } from '..';
import { Stack } from '../../stack';

const meta: Meta = {
	title: 'Components/@wordpress-ui/Form/Best Practices',
	id: 'design-system-components-form-best-practices',
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
 *
 * Hide a control's label only when other visible text still identifies that
 * control, and include that text in the `label`. The unit suffixes start
 * each accessible name (`lb, pounds`) so voice-control users can speak the
 * text they see.
 */
export const LabelingComposedComponents: StoryObj = {
	render: function Template() {
		return (
			<Fieldset.Root>
				<Fieldset.Legend>Shipping weight</Fieldset.Legend>
				<Fieldset.Description>
					Enter the total weight of your shipment.
				</Fieldset.Description>
				<Stack direction="row" gap="sm">
					<InputControl
						label="lb, pounds"
						hideLabelFromVision
						type="number"
						suffix={
							<InputLayout.Slot aria-hidden>lb</InputLayout.Slot>
						}
					/>
					<InputControl
						label="oz, ounces"
						hideLabelFromVision
						type="number"
						suffix={
							<InputLayout.Slot aria-hidden>oz</InputLayout.Slot>
						}
					/>
				</Stack>
			</Fieldset.Root>
		);
	},
};
