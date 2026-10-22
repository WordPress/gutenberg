import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '../../../text';
import { Fieldset, RadioGroup } from '../../primitives';
import { CardRadio } from '../';

const meta: Meta< typeof CardRadio > = {
	title: 'Components/@wordpress-ui/Form/CardRadio',
	id: 'design-system-components-form-cardradio',
	component: CardRadio,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'New component. Its API and styles may change while the design is finalized. See [WordPress/gutenberg#76850](https://github.com/WordPress/gutenberg/issues/76850).',
		},
	},
	render: ( args ) => (
		<Fieldset.Root render={ <RadioGroup defaultValue="visa" /> }>
			<Fieldset.Legend>Payment method</Fieldset.Legend>
			<CardRadio { ...args } />
			<CardRadio
				value="mastercard"
				label="Mastercard"
				description="Ending 5678"
			/>
			<CardRadio
				value="amex"
				label="American Express"
				description="Expired"
				disabled
			/>
		</Fieldset.Root>
	),
};
export default meta;

type Story = StoryObj< typeof CardRadio >;

/**
 * Render `CardRadio` options inside a `RadioGroup`. To label the group, pass
 * `RadioGroup` to `Fieldset.Root`'s `render` prop. Clicking anywhere on a
 * card selects its radio.
 */
export const Default: Story = {
	args: {
		value: 'visa',
		label: 'Visa',
		description: 'Ending 1234',
	},
};

/**
 * Pass additional content as children. It appears below the label and
 * description, but is not part of the radio's accessible name or
 * description. Do not include interactive elements such as links or buttons.
 *
 * To arrange the options in a grid, wrap them in a layout element inside the
 * group.
 */
export const WithAdditionalContent: Story = {
	render: () => (
		<Fieldset.Root render={ <RadioGroup defaultValue="personal" /> }>
			<Fieldset.Legend>Plan</Fieldset.Legend>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns:
						'repeat(auto-fill, minmax(200px, 1fr))',
					gap: 12,
				} }
			>
				{ [
					{
						value: 'personal',
						label: 'Personal',
						price: '$4 per month',
					},
					{
						value: 'business',
						label: 'Business',
						price: '$25 per month',
					},
					{
						value: 'commerce',
						label: 'Commerce',
						price: '$45 per month',
					},
				].map( ( plan ) => (
					<CardRadio
						key={ plan.value }
						value={ plan.value }
						label={ plan.label }
						description={ plan.price }
					>
						<div
							aria-hidden
							style={ {
								height: 80,
								borderRadius: 4,
								background:
									'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							} }
						/>
						<Text variant="body-sm">Includes a custom domain.</Text>
					</CardRadio>
				) ) }
			</div>
		</Fieldset.Root>
	),
};
