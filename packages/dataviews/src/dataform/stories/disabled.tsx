/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field, Form } from '../../types';

type DisabledDemoItem = {
	textField: string;
	textareaField: string;
	selectField: string;
	radioField: string;
	toggleField: boolean;
	toggleGroupField: string;
	checkboxField: boolean;
	integerField: number;
	numberField: number;
	emailField: string;
	passwordField: string;
	urlField: string;
	telephoneField: string;
	colorField: string;
	arrayField: string[];
	dateField: string;
	dateTimeField: string;
};

const DisabledFieldsComponent = () => {
	const [ data, setData ] = useState< DisabledDemoItem >( {
		textField: 'This is a disabled text field',
		textareaField: 'This is a disabled textarea',
		selectField: 'option2',
		radioField: 'radio2',
		toggleField: true,
		toggleGroupField: 'toggle2',
		checkboxField: true,
		integerField: 42,
		numberField: 3.14,
		emailField: 'disabled@example.com',
		passwordField: 'secret123',
		urlField: 'https://example.com',
		telephoneField: '+1234567890',
		colorField: '#ff6600',
		arrayField: [ 'tag1', 'tag2' ],
		dateField: '2024-01-15',
		dateTimeField: '2024-01-15T10:00:00',
	} );

	const disabledFields: Field< DisabledDemoItem >[] = [
		{
			id: 'textField',
			label: 'Disabled Text Field',
			type: 'text',
			Edit: {
				control: 'text',
				disabled: true,
			},
		},
		{
			id: 'textareaField',
			label: 'Disabled Textarea',
			type: 'text',
			Edit: {
				control: 'textarea',
				disabled: true,
				rows: 3,
			},
		},
		{
			id: 'selectField',
			label: 'Disabled Select',
			type: 'text',
			Edit: {
				control: 'select',
				disabled: true,
			},
			elements: [
				{ value: 'option1', label: 'Option 1' },
				{ value: 'option2', label: 'Option 2' },
				{ value: 'option3', label: 'Option 3' },
			],
		},
		{
			id: 'radioField',
			label: 'Disabled Radio',
			type: 'text',
			Edit: {
				control: 'radio',
				disabled: true,
			},
			elements: [
				{ value: 'radio1', label: 'Radio 1' },
				{ value: 'radio2', label: 'Radio 2' },
				{ value: 'radio3', label: 'Radio 3' },
			],
		},
		{
			id: 'toggleField',
			label: 'Disabled Toggle',
			type: 'boolean',
			Edit: {
				control: 'toggle',
				disabled: true,
			},
		},
		{
			id: 'toggleGroupField',
			label: 'Disabled Toggle Group',
			type: 'text',
			Edit: {
				control: 'toggleGroup',
				disabled: true,
			},
			elements: [
				{ value: 'toggle1', label: 'Toggle 1' },
				{ value: 'toggle2', label: 'Toggle 2' },
				{ value: 'toggle3', label: 'Toggle 3' },
			],
		},
		{
			id: 'checkboxField',
			label: 'Disabled Checkbox',
			type: 'boolean',
			Edit: {
				control: 'checkbox',
				disabled: true,
			},
		},
		{
			id: 'integerField',
			label: 'Disabled Integer',
			type: 'integer',
			Edit: {
				control: 'integer',
				disabled: true,
			},
		},
		{
			id: 'numberField',
			label: 'Disabled Number',
			type: 'number',
			Edit: {
				control: 'number',
				disabled: true,
			},
		},
		{
			id: 'emailField',
			label: 'Disabled Email',
			type: 'email',
			Edit: {
				control: 'email',
				disabled: true,
			},
		},
		{
			id: 'passwordField',
			label: 'Disabled Password',
			type: 'password',
			Edit: {
				control: 'password',
				disabled: true,
			},
		},
		{
			id: 'urlField',
			label: 'Disabled URL',
			type: 'url',
			Edit: {
				control: 'url',
				disabled: true,
			},
		},
		{
			id: 'telephoneField',
			label: 'Disabled Telephone',
			type: 'telephone',
			Edit: {
				control: 'telephone',
				disabled: true,
			},
		},
		{
			id: 'colorField',
			label: 'Disabled Color',
			type: 'color',
			Edit: {
				control: 'color',
				disabled: true,
			},
		},
		{
			id: 'arrayField',
			label: 'Disabled Array',
			type: 'array',
			Edit: {
				control: 'array',
				disabled: true,
			},
			elements: [
				{ value: 'tag1', label: 'Tag 1' },
				{ value: 'tag2', label: 'Tag 2' },
				{ value: 'tag3', label: 'Tag 3' },
				{ value: 'tag4', label: 'Tag 4' },
			],
		},
		{
			id: 'dateField',
			label: 'Disabled Date',
			type: 'date',
			Edit: {
				control: 'date',
				disabled: true,
			},
		},
		{
			id: 'dateTimeField',
			label: 'Disabled DateTime',
			type: 'datetime',
			Edit: {
				control: 'datetime',
				disabled: true,
			},
		},
	];

	const form: Form = useMemo(
		() => ( {
			layout: { type: 'regular', labelPosition: 'top' },
			fields: [
				'textField',
				'textareaField',
				'selectField',
				'radioField',
				'toggleField',
				'toggleGroupField',
				'checkboxField',
				'integerField',
				'numberField',
				'emailField',
				'passwordField',
				'urlField',
				'telephoneField',
				'colorField',
				'arrayField',
				'dateField',
				'dateTimeField',
			],
		} ),
		[]
	);

	return (
		<>
			<h1>Disabled Fields Demo</h1>
			<p>
				This story demonstrates the `disabled` config option for all
				dataform controls. All fields below are disabled and cannot be
				edited.
			</p>
			<DataForm< DisabledDemoItem >
				data={ data }
				fields={ disabledFields }
				form={ form }
				onChange={ ( edits ) =>
					setData( ( prev ) => ( {
						...prev,
						...edits,
					} ) )
				}
			/>
		</>
	);
};

export default DisabledFieldsComponent;
