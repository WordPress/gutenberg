import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field as BaseField } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { useRef, useState } from '@wordpress/element';
import * as Field from '../../field';
import { ControlWithError } from '../../control-with-error';
import { Stack } from '../../../../stack';
import { Button } from '../../../../button';
import { Text } from '../../../../text';
import { DateInputControl } from '../../../date-text-input-control/date-text-input-control';
import { DateInput } from '../date-input';

const meta: Meta = {
	title: 'Components/@wordpress-ui/Prototypes/Date text input',
	id: 'design-system-prototypes-date-text-input',
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Blocked, unexported experiment. Localized text editing with ISO React values and native form values. Base UI Form and Field.validate still receive displayed text. Base UI is unpatched.',
			},
		},
	},
};
export default meta;
type Story = StoryObj;

export const Overview: Story = {
	render: () => (
		<Stack direction="column" gap="lg" style={ { maxWidth: 480 } }>
			<Text render={ <h2 /> }>Localized single-date input</Text>
			<Text>Each field represents the ISO date 2026-02-20.</Text>
			<DateInputControl
				locale="it-IT"
				label="Italian"
				description="Day / month / year"
				defaultValue="2026-02-20"
			/>
			<DateInputControl
				locale="en-US"
				label="English (United States)"
				description="Month / day / year"
				defaultValue="2026-02-20"
			/>
			<DateInputControl
				locale="ja-JP"
				label="Japanese"
				description="Year / month / day"
				defaultValue="2026-02-20"
			/>
			<Stack direction="column" dir="rtl">
				<DateInputControl
					locale="ar-EG"
					label="العربية (مصر)"
					defaultValue="2026-02-20"
				/>
			</Stack>
		</Stack>
	),
};

export const BaseUiForm: Story = {
	render: function Example() {
		const [ submitted, setSubmitted ] = useState< unknown >( null );
		const [ native, setNative ] = useState< unknown >( null );
		const [ value, setValue ] = useState< string | null >( '2026-02-20' );
		return (
			<Form
				onSubmit={ ( event ) =>
					setNative(
						Object.fromEntries(
							new FormData( event.currentTarget )
						)
					)
				}
				onFormSubmit={ setSubmitted }
				onReset={ () => {
					setSubmitted( null );
					setNative( null );
					setValue( '2026-02-20' );
				} }
				render={
					<Stack
						render={ <form /> }
						direction="column"
						gap="md"
						style={ { maxWidth: 520 } }
					/>
				}
			>
				<Text render={ <h2 /> }>
					Base UI form integration experiment
				</Text>
				<Text>
					Blocked: Base UI Form submits the displayed text. The
					required value is an ISO date.
				</Text>
				<BaseField.Root
					name="date"
					validationMode="onBlur"
					render={ ( props, state ) => (
						<Stack { ...props } direction="column" gap="sm">
							<>{ props.children }</>
							<Text variant="body-sm">{ `Dirty: ${ state.dirty } · Touched: ${ state.touched } · Valid: ${ state.valid }` }</Text>
						</Stack>
					) }
				>
					<Field.Label>Subscription date</Field.Label>
					<DateInput
						locale="it-IT"
						required
						defaultValue="2026-02-20"
						onValueChange={ setValue }
						min="2026-01-01"
						max="2026-12-31"
					/>
					<Field.Description>
						Enter a date in 2026 (DD/MM/YYYY).
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
					<Button type="submit">Save date</Button>
					<Button variant="outline" type="reset">
						Reset
					</Button>
				</Stack>
				<Text
					render={ <pre aria-label="React value" /> }
				>{ `React value: ${ JSON.stringify( value ) }` }</Text>
				<Text
					render={ <pre aria-label="Native form values" /> }
				>{ `Native FormData: ${ native ? JSON.stringify( native ) : 'not submitted' }` }</Text>
				<Text
					render={ <pre aria-label="Base UI form values" /> }
				>{ `Base UI Form: ${ submitted ? JSON.stringify( submitted ) : 'not submitted' }` }</Text>
			</Form>
		);
	},
};

export const ReadOnlyAndDisabled: Story = {
	render: () => (
		<Stack direction="column" gap="lg" style={ { maxWidth: 440 } }>
			<DateInputControl
				locale="it-IT"
				label="Read-only date"
				defaultValue="2026-02-20"
				readOnly
			/>
			<Field.Root disabled>
				<Field.Label>Disabled date</Field.Label>
				<DateInput locale="it-IT" defaultValue="2026-02-20" />
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
				style={ { maxWidth: 480 } }
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
						locale="it-IT"
						label="Subscription date"
						name="date"
						description="Enter a valid date (DD/MM/YYYY)."
						defaultValue="2026-02-20"
					/>
				</ControlWithError>
				<Button type="submit">Save date</Button>
				<Text>
					{ submitted
						? `Saved ISO date: ${ submitted }`
						: 'No date submitted.' }
				</Text>
			</Stack>
		);
	},
};
