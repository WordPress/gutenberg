import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field as BaseField } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useRef, useState } from '@wordpress/element';
import * as Field from '../../field';
import { ControlWithError } from '../../control-with-error';
import { Stack } from '../../../../stack';
import { Button } from '../../../../button';
import { Text } from '../../../../text';
import {
	DateInputControl,
	DateRangeInputControl,
	TimeInputControl,
} from '../../../date-text-input-control/date-text-input-control';
import { DateInput } from '../date-input';
import { DateRangeInput } from '../date-range-input';
import { TimeInput } from '../time-input';

const meta: Meta = {
	title: 'Components/@wordpress-ui/Prototypes/Date text input',
	id: 'design-system-prototypes-date-text-input',
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Unexported first-party prototype. One native Base UI text input per value, without a Base UI patch. Text entry uses ISO dates and 24-hour times. Calendar labels follow the supplied locale.',
			},
		},
	},
};
export default meta;
type Story = StoryObj;

export const Overview: Story = {
	render: () => (
		<Stack direction="column" gap="xl" style={ { maxWidth: 440 } }>
			<Text render={ <h2 /> }>Date and time text inputs</Text>
			<DateInputControl
				label="Subscription date"
				description="Year, month, and day (YYYY-MM-DD)."
				defaultValue="2026-01-20"
				showCalendar
			/>
			<DateRangeInputControl
				label="Travel dates"
				description="Start and end dates, separated by a slash."
				defaultValue={ { from: '2026-01-20', to: '2026-02-09' } }
				showCalendar
			/>
			<TimeInputControl
				label="Reminder time"
				description="24-hour local time, including seconds."
				defaultValue="10:30:00"
				precision="second"
			/>
			<DateInputControl
				label="Standalone date input"
				description="The calendar button is optional."
			/>
		</Stack>
	),
};

export const BaseUiForm: Story = {
	render: function Example() {
		const [ submitted, setSubmitted ] = useState< unknown >( null );
		return (
			<Form
				onFormSubmit={ ( data ) => setSubmitted( data ) }
				render={
					<Stack
						render={ <form /> }
						direction="column"
						gap="lg"
						style={ { maxWidth: 440 } }
					/>
				}
			>
				<Text render={ <h2 /> }>Schedule a subscription</Text>
				<BaseField.Root
					name="date"
					validationMode="onBlur"
					render={ ( props, state ) => (
						<Stack { ...props } direction="column" gap="sm">
							<>{ props.children }</>
							<Text
								variant="body-sm"
								style={ {
									color: 'var(--wpds-color-foreground-content-neutral-weak)',
								} }
							>{ `Dirty: ${ state.dirty } · Touched: ${ state.touched } · Valid: ${ state.valid }` }</Text>
						</Stack>
					) }
				>
					<Field.Label>Subscription date</Field.Label>
					<DateInput
						required
						defaultValue="2026-01-20"
						min="2026-01-01"
						max="2026-12-31"
						showCalendar
					/>
					<Field.Description>
						Enter a date in 2026 (YYYY-MM-DD).
					</Field.Description>
					<BaseField.Error
						render={
							<Text
								variant="body-sm"
								style={ {
									color: 'var(--wpds-color-foreground-content-error-weak)',
								} }
							/>
						}
					/>
				</BaseField.Root>
				<BaseField.Root
					name="range"
					validationMode="onBlur"
					render={ <Stack direction="column" gap="sm" /> }
				>
					<Field.Label>Travel dates</Field.Label>
					<DateRangeInput
						defaultValue={ {
							from: '2026-01-20',
							to: '2026-02-09',
						} }
						showCalendar
					/>
					<Field.Description>YYYY-MM-DD/YYYY-MM-DD</Field.Description>
					<BaseField.Error
						render={
							<Text
								variant="body-sm"
								style={ {
									color: 'var(--wpds-color-foreground-content-error-weak)',
								} }
							/>
						}
					/>
				</BaseField.Root>
				<BaseField.Root
					name="time"
					validationMode="onBlur"
					render={ <Stack direction="column" gap="sm" /> }
				>
					<Field.Label>Reminder time</Field.Label>
					<TimeInput defaultValue="10:30" min="09:00" max="17:00" />
					<Field.Description>
						Between 09:00 and 17:00.
					</Field.Description>
					<BaseField.Error
						render={
							<Text
								variant="body-sm"
								style={ {
									color: 'var(--wpds-color-foreground-content-error-weak)',
								} }
							/>
						}
					/>
				</BaseField.Root>
				<Stack gap="sm">
					<Button type="submit">Save schedule</Button>
					<Button
						variant="outline"
						type="reset"
						onClick={ () => setSubmitted( null ) }
					>
						Reset
					</Button>
				</Stack>
				<Text render={ <pre aria-label="Submitted values" /> }>
					{ submitted
						? JSON.stringify( submitted, null, 2 )
						: 'No values submitted.' }
				</Text>
			</Form>
		);
	},
};
export const RtlCalendar: Story = {
	render: () => (
		<Stack
			direction="column"
			gap="lg"
			dir="rtl"
			style={ { maxWidth: 440 } }
		>
			<DateInputControl
				label="التاريخ"
				description="YYYY-MM-DD"
				defaultValue="2026-01-20"
				locale="ar-EG"
				showCalendar
			/>
			<DateRangeInputControl
				label="نطاق التاريخ"
				description="YYYY-MM-DD/YYYY-MM-DD"
				defaultValue={ { from: '2026-01-20', to: '2026-01-25' } }
				locale="ar-EG"
				showCalendar
			/>
		</Stack>
	),
};
export const ReadOnlyAndDisabled: Story = {
	render: () => (
		<Stack direction="column" gap="lg" style={ { maxWidth: 440 } }>
			<DateInputControl
				label="Read-only date"
				defaultValue="2026-01-20"
				readOnly
				showCalendar
			/>
			<Field.Root disabled>
				<Field.Label>Disabled date</Field.Label>
				<DateInput defaultValue="2026-01-20" showCalendar />
			</Field.Root>
		</Stack>
	),
};

export const NativeValidation: Story = {
	render: function Example() {
		const ref = useRef< HTMLInputElement >( null );
		const [ submitted, setSubmitted ] = useState( '' );
		return (
			<Stack
				direction="column"
				gap="lg"
				style={ { maxWidth: 440 } }
				render={
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							setSubmitted(
								String(
									new FormData( event.currentTarget ).get(
										'date'
									)
								)
							);
						} }
					/>
				}
			>
				<Text render={ <h2 /> }>
					Native form with WordPress validation
				</Text>
				<ControlWithError
					required
					getValidityTarget={ () => ref.current }
				>
					<DateInputControl
						ref={ ref }
						label="Subscription date"
						name="date"
						description="Enter a valid date (YYYY-MM-DD)."
						defaultValue="2026-01-20"
						showCalendar
					/>
				</ControlWithError>
				<Button type="submit">Save date</Button>
				<Text>
					{ submitted
						? `Saved: ${ submitted }`
						: 'No date submitted.' }
				</Text>
			</Stack>
		);
	},
};
