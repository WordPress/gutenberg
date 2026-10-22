import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Card from '../../../../card';
import { Stack } from '../../../../stack';
import { Radio } from '../';
import * as Field from '../../field';
import * as Fieldset from '../../fieldset';
import { RadioGroup } from '../../radio-group';
import styles from './radio-card.module.scss';

const meta: Meta< typeof Radio > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Form/Primitives/Radio',
	id: 'design-system-components-form-primitives-radio',
	component: Radio,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Radio >;

export const Default: Story = {
	args: {
		value: 'option',
		'aria-label': 'Option',
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options">
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const Checked: Story = {
	args: {
		...Default.args,
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options" defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options">
			<Radio { ...args } />
		</RadioGroup>
	),
};

export const DisabledChecked: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
	render: ( args ) => (
		<RadioGroup aria-label="Options" defaultValue="option">
			<Radio { ...args } />
		</RadioGroup>
	),
};

/**
 * Compose `Radio` with `Card` for options that need more emphasis than a
 * plain radio list.
 *
 * - Wrap the group in `Field.Root`, as `RadioGroupControl` does, and render
 *   each `Field.Item` as a `Card.Root`, so the label and description are
 *   associated with the radio inside it.
 * - Stretch the label over the card with a positioned `::after`, so that
 *   clicking anywhere on the card selects the radio. Do not wrap the card in
 *   a `<label>`, because all of its text would become the accessible name.
 * - Disable an option on `Field.Item`, which disables both the radio and
 *   the label, and sets `data-disabled` on the card.
 * - Style the checked card with `:has()` on the radio's `data-checked`
 *   attribute.
 * - Move the focus ring from the radio to the card with `:has(:focus-visible)`.
 * - Do not put interactive elements inside the card.
 *
 * See `radio-card.module.scss` in this story's folder for the styles.
 */
export const WithCard: Story = {
	render: () => (
		<Field.Root>
			<Fieldset.Root render={ <RadioGroup defaultValue="visa" /> }>
				<Fieldset.Legend>Payment method</Fieldset.Legend>
				{ [
					{
						value: 'visa',
						label: 'Visa',
						description: 'Ending 1234',
					},
					{
						value: 'mastercard',
						label: 'Mastercard',
						description: 'Ending 5678',
					},
					{
						value: 'amex',
						label: 'American Express',
						description: 'Expired',
						disabled: true,
					},
				].map( ( item ) => (
					<Field.Item
						key={ item.value }
						disabled={ item.disabled }
						render={ <Card.Root className={ styles.card } /> }
					>
						<Card.Content
							render={ <Stack direction="column" gap="xs" /> }
						>
							<Stack
								justify="space-between"
								align="center"
								gap="md"
							>
								<Field.Label
									variant="plain"
									className={ styles.label }
								>
									{ item.label }
								</Field.Label>
								<Radio
									value={ item.value }
									className={ styles.radio }
								/>
							</Stack>
							<Field.Description>
								{ item.description }
							</Field.Description>
						</Card.Content>
					</Field.Item>
				) ) }
			</Fieldset.Root>
		</Field.Root>
	),
};
