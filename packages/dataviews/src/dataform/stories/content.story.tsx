/**
 * WordPress dependencies
 */
import { useMemo, useState, useRef, useEffect } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import DataForm from '../index';
import useFormValidity from '../../hooks/use-form-validity';
import type { Field, Form } from '../../types';

const meta: Meta< typeof DataForm > = {
	title: 'DataViews/DataForm/Content',
	component: DataForm,
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' /* Hide individual story pages from sidebar */ ],
};
export default meta;

type Story = StoryObj< typeof DataForm >;

type SampleData = {
	name: string;
	email: string;
	phone: string;
};

export const Labels: Story = {
	render: () => {
		const [ data, setData ] = useState< SampleData >( {
			name: '',
			email: '',
			phone: '',
		} );

		const fields: Field< SampleData >[] = useMemo(
			() => [
				{
					id: 'name',
					label: 'Name',
					type: 'text',
				},
				{
					id: 'email',
					label: 'Email',
					type: 'email',
				},
				{
					id: 'phone',
					label: 'Phone number',
					type: 'telephone',
				},
			],
			[]
		);

		const form: Form = useMemo(
			() => ( {
				layout: { type: 'regular' },
				fields: [ 'name', 'email', 'phone' ],
			} ),
			[]
		);

		return (
			<Stack direction="column" gap="md">
				<DataForm< SampleData >
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ ( edits ) =>
						setData( ( prev ) => ( { ...prev, ...edits } ) )
					}
				/>
			</Stack>
		);
	},
};

type HelpTextData = {
	name: string;
	email: string;
	phone: string;
};

export const HelpText: Story = {
	render: () => {
		const [ data, setData ] = useState< HelpTextData >( {
			name: '',
			email: '',
			phone: '',
		} );

		const fields: Field< HelpTextData >[] = useMemo(
			() => [
				{
					id: 'name',
					label: 'Name',
					type: 'text',
					placeholder: 'Jane Doe',
					description:
						'Enter your full legal name as it appears on official documents.',
				},
				{
					id: 'email',
					label: 'Email',
					type: 'email',
					placeholder: 'you@example.com',
					description:
						'We will use this to send you important account notifications and updates.',
				},
				{
					id: 'phone',
					label: 'Phone number',
					type: 'telephone',
					placeholder: '+1 (555) 123-4567',
					description:
						'Include your country code. This number will be used for account verification.',
				},
			],
			[]
		);

		const form: Form = useMemo(
			() => ( {
				layout: { type: 'regular' },
				fields: [ 'name', 'email', 'phone' ],
			} ),
			[]
		);

		return (
			<Stack direction="column" gap="md">
				<DataForm< HelpTextData >
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ ( edits ) =>
						setData( ( prev ) => ( { ...prev, ...edits } ) )
					}
				/>
			</Stack>
		);
	},
};

type ValidationMessagesData = {
	name: string;
	email: string;
	phone: string;
};

export const ValidationMessages: Story = {
	render: () => {
		const [ data, setData ] = useState< ValidationMessagesData >( {
			name: '',
			email: 'invalid-email',
			phone: '123',
		} );

		const fields: Field< ValidationMessagesData >[] = useMemo(
			() => [
				{
					id: 'name',
					label: 'Name',
					type: 'text',
					placeholder: 'Jane Doe',
					isValid: {
						required: true,
					},
				},
				{
					id: 'email',
					label: 'Email',
					type: 'email',
					placeholder: 'you@example.com',
					isValid: {
						required: true,
						custom: ( item ) => {
							if ( ! item.email ) {
								return null;
							}
							if ( ! item.email.includes( '@' ) ) {
								return 'Please enter a valid email address.';
							}
							return null;
						},
					},
				},
				{
					id: 'phone',
					label: 'Phone number',
					type: 'telephone',
					placeholder: '+1 (555) 123-4567',
					isValid: {
						required: true,
						custom: ( item ) => {
							if ( ! item.phone ) {
								return null;
							}
							if ( item.phone.length < 10 ) {
								return 'Phone number must be at least 10 digits long.';
							}
							return null;
						},
					},
				},
			],
			[]
		);

		const form: Form = useMemo(
			() => ( {
				layout: { type: 'regular' },
				fields: [ 'name', 'email', 'phone' ],
			} ),
			[]
		);

		const { validity } = useFormValidity( data, fields, form );
		const containerRef = useRef< HTMLDivElement >( null );

		// Show validation messages on load without focusing
		useEffect( () => {
			if ( validity && containerRef.current ) {
				const inputs = containerRef.current.querySelectorAll( 'input' );
				inputs.forEach( ( input ) => {
					// Dispatch 'invalid' event to trigger the validation message display
					input.dispatchEvent(
						new Event( 'invalid', { bubbles: false } )
					);
				} );
			}
		}, [ validity ] );

		return (
			<div ref={ containerRef }>
				<Stack direction="column" gap="lg">
					<DataForm< ValidationMessagesData >
						data={ data }
						fields={ fields }
						form={ form }
						validity={ validity }
						onChange={ ( edits ) =>
							setData( ( prev ) => ( { ...prev, ...edits } ) )
						}
					/>
				</Stack>
			</div>
		);
	},
};

type HighLevelHelpTextData = {
	name: string;
	email: string;
	phone: string;
};

export const HighLevelHelpText: Story = {
	render: () => {
		const [ data, setData ] = useState< HighLevelHelpTextData >( {
			name: '',
			email: '',
			phone: '',
		} );

		const fields: Field< HighLevelHelpTextData >[] = useMemo(
			() => [
				{
					id: 'name',
					label: 'Name',
					type: 'text',
				},
				{
					id: 'email',
					label: 'Email',
					type: 'email',
				},
				{
					id: 'phone',
					label: 'Phone number',
					type: 'telephone',
				},
			],
			[]
		);

		const form: Form = useMemo(
			() => ( {
				layout: { type: 'regular' },
				fields: [
					{
						id: 'accountForm',
						label: 'Account Information',
						description:
							'We collect this information to create your account and provide personalized services. Your data will be kept secure and used only for account management and service improvements.',
						children: [ 'name', 'email', 'phone' ],
						layout: {
							isCollapsible: false,
							summary: 'account-form',
							type: 'card',
							withHeader: true,
						},
					},
				],
			} ),
			[]
		);

		return (
			<Stack direction="column" gap="md">
				<DataForm< HighLevelHelpTextData >
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ ( edits ) =>
						setData( ( prev ) => ( { ...prev, ...edits } ) )
					}
				/>
			</Stack>
		);
	},
};

type PlaceholdersData = {
	name: string;
	email: string;
	phone: string;
};

export const Placeholders: Story = {
	render: () => {
		const [ data, setData ] = useState< PlaceholdersData >( {
			name: '',
			email: '',
			phone: '',
		} );

		const fields: Field< PlaceholdersData >[] = useMemo(
			() => [
				{
					id: 'name',
					label: 'Name',
					type: 'text',
					placeholder: 'Jane Doe',
				},
				{
					id: 'email',
					label: 'Email',
					type: 'email',
					placeholder: 'you@example.com',
				},
				{
					id: 'phone',
					label: 'Phone number',
					type: 'telephone',
					placeholder: '+1 (555) 123-4567',
				},
			],
			[]
		);

		const form: Form = useMemo(
			() => ( {
				layout: { type: 'regular' },
				fields: [ 'name', 'email', 'phone' ],
			} ),
			[]
		);

		return (
			<Stack direction="column" gap="md">
				<DataForm< PlaceholdersData >
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ ( edits ) =>
						setData( ( prev ) => ( { ...prev, ...edits } ) )
					}
				/>
			</Stack>
		);
	},
};
