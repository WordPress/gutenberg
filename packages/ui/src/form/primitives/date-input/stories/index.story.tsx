import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field as BaseField } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useState } from '@wordpress/element';
import { DateInput } from '../date-input';
import { DateInputControl } from '../../../date-input-control/date-input-control';
import * as Field from '../../field';

const meta: Meta< typeof DateInput > = {
	title: 'Components/@wordpress-ui/Form/Prototypes/DateInput',
	id: 'design-system-prototypes-date-input-react-aria',
	component: DateInput,
	parameters: {
		docs: {
			description: {
				component:
					'React Aria integration experiment. This component is not exported. See the adjacent README for acceptance checks and known limitations.',
			},
		},
	},
	args: { defaultValue: '2026-02-20', locale: 'en-US' },
};
export default meta;
type Story = StoryObj< typeof DateInput >;

export const FieldComposition: Story = {
	render: ( args ) => (
		<Field.Root name="date">
			<Field.Label>Date</Field.Label>
			<DateInput { ...args } />
			<Field.Description>Choose a date.</Field.Description>
		</Field.Root>
	),
};

export const InputControl: Story = {
	render: ( args ) => (
		<DateInputControl
			{ ...args }
			label="Date"
			description="Choose a date."
		/>
	),
};

function FormExample( props: React.ComponentProps< typeof DateInput > ) {
	const [ submitted, setSubmitted ] = useState< unknown >();
	return (
		<Form validationMode="onBlur" onFormSubmit={ setSubmitted }>
			<BaseField.Root
				name="date"
				render={ ( rootProps, state ) => (
					<div { ...rootProps }>
						{ rootProps.children }
						<pre>{ JSON.stringify( state, null, 2 ) }</pre>
					</div>
				) }
			>
				<BaseField.Label>Date</BaseField.Label>
				<DateInput { ...props } required />
				<BaseField.Description>
					Try clearing a segment or entering February 30.
				</BaseField.Description>
				<BaseField.Error />
			</BaseField.Root>
			<button type="submit">Save</button>
			<button type="reset">Reset</button>
			<pre aria-label="Submitted value">
				{ JSON.stringify( submitted, null, 2 ) }
			</pre>
		</Form>
	);
}

export const BaseUiForm: Story = {
	render: ( args ) => <FormExample { ...args } />,
};
