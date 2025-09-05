/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
import {
	Button,
	__experimentalVStack as VStack,
	privateApis,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import { isItemValid } from '../../../validation';
import type {
	Field,
	Form,
	DataFormControlProps,
	Layout,
	RegularLayout,
	PanelLayout,
	CardLayout,
} from '../../../types';
import { unlock } from '../../../lock-unlock';

const { ValidatedTextControl } = unlock( privateApis );

type SamplePost = {
	title: string;
	order: number;
	author: number;
	status: string;
	reviewer: string;
	date: string;
	birthdate: string;
	password?: string;
	filesize?: number;
	dimensions?: string;
	tags?: string[];
	address1?: string;
	address2?: string;
	city?: string;
};

const fields: Field< SamplePost >[] = [
	{
		id: 'title',
		label: 'Title',
		type: 'text',
	},
	{
		id: 'order',
		label: 'Order',
		type: 'integer',
	},
	{
		id: 'date',
		label: 'Date',
		type: 'datetime',
	},
	{
		id: 'birthdate',
		label: 'Date as options',
		type: 'datetime',
		elements: [
			{ value: '', label: 'Select a date' },
			{ value: '1970-02-23T12:00:00', label: "Jane's birth date" },
			{ value: '1950-02-23T12:00:00', label: "John's birth date" },
		],
	},
	{
		id: 'author',
		label: 'Author',
		type: 'integer',
		elements: [
			{ value: 1, label: 'Jane' },
			{ value: 2, label: 'John' },
			{ value: 3, label: 'Alice' },
			{ value: 4, label: 'Bob' },
		],
	},
	{
		id: 'reviewer',
		label: 'Reviewer',
		type: 'text',
		Edit: 'radio',
		elements: [
			{ value: 'jane', label: 'Jane' },
			{ value: 'john', label: 'John' },
			{ value: 'alice', label: 'Alice' },
			{ value: 'bob', label: 'Bob' },
		],
	},
	{
		id: 'status',
		label: 'Status',
		type: 'text',
		Edit: 'toggleGroup',
		elements: [
			{ value: 'draft', label: 'Draft' },
			{ value: 'published', label: 'Published' },
			{ value: 'private', label: 'Private' },
		],
	},
	{
		id: 'email',
		label: 'Email',
		type: 'email',
	},
	{
		id: 'password',
		label: 'Password',
		type: 'text',
		isVisible: ( item: SamplePost ) => {
			return item.status !== 'private';
		},
	},
	{
		id: 'sticky',
		label: 'Sticky',
		type: 'boolean',
	},
	{
		id: 'can_comment',
		label: 'Allow people to leave a comment',
		type: 'boolean',
		Edit: 'checkbox',
	},
	{
		id: 'filesize',
		label: 'File Size',
		type: 'integer',
		readOnly: true,
	},
	{
		id: 'dimensions',
		label: 'Dimensions',
		type: 'text',
		readOnly: true,
	},
	{
		id: 'tags',
		label: 'Tags',
		type: 'array',
		placeholder: 'Enter comma-separated tags',
		description: 'Add tags separated by commas (e.g., "tag1, tag2, tag3")',
		elements: [
			{ value: 'astronomy', label: 'Astronomy' },
			{ value: 'book-review', label: 'Book review' },
			{ value: 'event', label: 'Event' },
			{ value: 'photography', label: 'Photography' },
			{ value: 'travel', label: 'Travel' },
		],
	},
	{
		id: 'address1',
		label: 'Address 1',
		type: 'text',
	},
	{
		id: 'address2',
		label: 'Address 2',
		type: 'text',
	},
	{
		id: 'city',
		label: 'City',
		type: 'text',
	},
];

const LayoutRegularComponent = ( {
	type = 'default',
	labelPosition,
}: {
	type?: 'default' | 'regular' | 'panel' | 'card';
	labelPosition: 'default' | 'top' | 'side' | 'none';
} ) => {
	const [ post, setPost ] = useState( {
		title: 'Hello, World!',
		order: 2,
		author: 1,
		status: 'draft',
		reviewer: 'fulano',
		email: 'hello@wordpress.org',
		date: '2021-01-01T12:00:00',
		birthdate: '1950-02-23T12:00:00',
		sticky: false,
		can_comment: false,
		filesize: 1024,
		dimensions: '1920x1080',
		tags: [ 'photography' ],
	} );

	const form: Form = useMemo(
		() => ( {
			layout: getLayoutFromStoryArgs( {
				type,
				labelPosition,
			} ),
			fields: [
				'title',
				'order',
				'sticky',
				'author',
				'status',
				'reviewer',
				'email',
				'password',
				'date',
				'birthdate',
				'can_comment',
				'filesize',
				'dimensions',
				'tags',
			],
		} ),
		[ type, labelPosition ]
	);

	return (
		<DataForm< SamplePost >
			data={ post }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setPost( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

const getLayoutFromStoryArgs = ( {
	type,
	labelPosition,
	openAs,
	withHeader,
}: {
	type: 'default' | 'regular' | 'panel' | 'card';
	labelPosition?: 'default' | 'top' | 'side' | 'none';
	openAs?: 'default' | 'dropdown' | 'modal';
	withHeader?: boolean;
} ): Layout | undefined => {
	let layout: Layout | undefined;

	if ( type === 'default' || type === 'regular' ) {
		const regularLayout: RegularLayout = {
			type: 'regular',
		};
		if ( labelPosition !== 'default' ) {
			regularLayout.labelPosition = labelPosition;
		}
		layout = regularLayout;
	} else if ( type === 'panel' ) {
		const panelLayout: PanelLayout = {
			type: 'panel',
		};
		if ( labelPosition !== 'default' ) {
			panelLayout.labelPosition = labelPosition;
		}
		if ( openAs !== 'default' ) {
			panelLayout.openAs = openAs;
		}
		layout = panelLayout;
	} else if ( type === 'card' ) {
		const cardLayout: CardLayout = {
			type: 'card',
		};
		if ( withHeader !== undefined ) {
			// @ts-ignore We want to demo the effects of configuring withHeader.
			cardLayout.withHeader = withHeader;
		}
		layout = cardLayout;
	}

	return layout;
};

const LayoutPanelComponent = ( {
	labelPosition,
	openAs,
}: {
	type: 'default' | 'regular' | 'panel' | 'card';
	labelPosition: 'default' | 'top' | 'side' | 'none';
	openAs: 'default' | 'dropdown' | 'modal';
} ) => {
	const [ post, setPost ] = useState< SamplePost >( {
		title: 'Hello, World!',
		order: 2,
		author: 1,
		status: 'draft',
		reviewer: 'fulano',
		date: '2021-01-01T12:00:00',
		birthdate: '1950-02-23T12:00:00',
		filesize: 1024,
		dimensions: '1920x1080',
		tags: [ 'photography' ],
		address1: '123 Main St',
		address2: 'Apt 4B',
		city: 'New York',
	} );

	const form: Form = useMemo( () => {
		return {
			layout: getLayoutFromStoryArgs( {
				type: 'panel',
				labelPosition,
				openAs,
			} ),
			fields: [
				'title',
				{
					id: 'status',
					label: 'Status & Visibility',
					children: [ 'status', 'password' ],
				},
				'order',
				'author',
				'filesize',
				'dimensions',
				'tags',
				{
					id: 'address1',
					label: 'Combined Address',
					children: [ 'address1', 'address2', 'city' ],
				},
			],
		};
	}, [ labelPosition, openAs ] );

	return (
		<DataForm< SamplePost >
			data={ post }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setPost( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

function CustomEditControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { id, label, placeholder, description } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	return (
		<ValidatedTextControl
			required={ !! field.isValid?.required }
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			help={ description }
			onChange={ onChangeControl }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}

const ValidationComponent = ( {
	required,
	type,
	custom,
}: {
	required: boolean;
	custom: boolean;
	type: 'regular' | 'panel';
} ) => {
	type ValidatedItem = {
		text: string;
		email: string;
		telephone: string;
		url: string;
		integer: number;
		boolean: boolean;
		customEdit: string;
	};

	const [ post, setPost ] = useState< ValidatedItem >( {
		text: 'Can have letters and spaces',
		email: 'hi@example.com',
		telephone: '+306978241796',
		url: 'https://example.com',
		integer: 2,
		boolean: true,
		customEdit: 'custom control',
	} );

	const customTextRule = ( value: ValidatedItem ) => {
		if ( ! /^[a-zA-Z ]+$/.test( value.text ) ) {
			return 'Value must only contain letters and spaces.';
		}

		return null;
	};
	const customEmailRule = ( value: ValidatedItem ) => {
		if ( ! /^[a-zA-Z0-9._%+-]+@example\.com$/.test( value.email ) ) {
			return 'Email address must be from @example.com domain.';
		}

		return null;
	};
	const customTelephoneRule = ( value: ValidatedItem ) => {
		if ( ! /^\+30\d{10}$/.test( value.telephone ) ) {
			return 'Telephone number must start with +30 and have 10 digits after.';
		}

		return null;
	};
	const customUrlRule = ( value: ValidatedItem ) => {
		if ( ! /^https:\/\/example\.com$/.test( value.url ) ) {
			return 'URL must be from https://example.com domain.';
		}

		return null;
	};
	const customIntegerRule = ( value: ValidatedItem ) => {
		if ( value.integer % 2 !== 0 ) {
			return 'Integer must be an even number.';
		}

		return null;
	};

	const maybeCustomRule = (
		rule: ( item: ValidatedItem ) => null | string
	) => {
		return custom ? rule : undefined;
	};

	const _fields: Field< ValidatedItem >[] = [
		{
			id: 'text',
			type: 'text',
			label: 'Text',
			isValid: {
				required,
				custom: maybeCustomRule( customTextRule ),
			},
		},
		{
			id: 'email',
			type: 'email',
			label: 'e-mail',
			isValid: {
				required,
				custom: maybeCustomRule( customEmailRule ),
			},
		},
		{
			id: 'telephone',
			type: 'telephone',
			label: 'telephone',
			isValid: {
				required,
				custom: maybeCustomRule( customTelephoneRule ),
			},
		},
		{
			id: 'url',
			type: 'url',
			label: 'URL',
			isValid: {
				required,
				custom: maybeCustomRule( customUrlRule ),
			},
		},
		{
			id: 'integer',
			type: 'integer',
			label: 'Integer',
			isValid: {
				required,
				custom: maybeCustomRule( customIntegerRule ),
			},
		},
		{
			id: 'boolean',
			type: 'boolean',
			label: 'Boolean',
			isValid: {
				required,
			},
		},
		{
			id: 'customEdit',
			label: 'Custom Control',
			Edit: CustomEditControl,
			isValid: {
				required,
			},
		},
	];

	const form = {
		layout: { type },
		fields: [
			'text',
			'email',
			'telephone',
			'url',
			'integer',
			'boolean',
			'customEdit',
		],
	};

	const canSave = isItemValid( post, _fields, form );

	return (
		<form>
			<VStack alignment="left">
				<DataForm< ValidatedItem >
					data={ post }
					fields={ _fields }
					form={ form }
					onChange={ ( edits ) =>
						setPost( ( prev ) => ( {
							...prev,
							...edits,
						} ) )
					}
				/>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					disabled={ ! canSave }
					variant="primary"
				>
					Submit
				</Button>
			</VStack>
		</form>
	);
};

const VisibilityComponent = () => {
	type Post = {
		name: string;
		email: string;
		isActive: boolean;
	};
	const [ data, setData ] = useState( {
		name: '',
		email: '',
		isActive: true,
	} );

	const _fields: Field< Post >[] = [
		{ id: 'isActive', label: 'Is module active?', type: 'boolean' },
		{
			id: 'name',
			label: 'Name',
			type: 'text',
			isVisible: ( post ) => post.isActive === true,
		},
		{
			id: 'email',
			label: 'Email',
			type: 'email',
			isVisible: ( post ) => post.isActive === true,
		},
	];
	const form: Form = {
		fields: [ 'isActive', 'name', 'email' ],
	};
	return (
		<DataForm< Post >
			data={ data }
			fields={ _fields }
			form={ form }
			onChange={ ( edits ) =>
				setData( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

const LayoutCardComponent = ( { withHeader }: { withHeader: boolean } ) => {
	type Customer = {
		name: string;
		email: string;
		phone: string;
		plan: string;
		shippingAddress: string;
		billingAddress: string;
		displayPayments: boolean;
		totalOrders: number;
		totalRevenue: number;
		averageOrderValue: number;
		hasVat: boolean;
		vat: number;
		commission: number;
	};

	const customerFields: Field< Customer >[] = [
		{
			id: 'name',
			label: 'Customer Name',
			type: 'text',
		},
		{
			id: 'phone',
			label: 'Phone',
			type: 'text',
		},
		{
			id: 'email',
			label: 'Email',
			type: 'email',
		},
		{
			id: 'plan',
			label: 'Plan',
			type: 'text',
			Edit: 'toggleGroup',
			elements: [
				{ value: 'basic', label: 'Basic' },
				{ value: 'business', label: 'Business' },
				{ value: 'vip', label: 'VIP' },
			],
		},
		{
			id: 'shippingAddress',
			label: 'Shipping Address',
			type: 'text',
		},
		{
			id: 'billingAddress',
			label: 'Billing Address',
			type: 'text',
		},
		{
			id: 'displayPayments',
			label: 'Display Payments?',
			type: 'boolean',
		},
		{
			id: 'payments',
			label: 'Payments',
			type: 'text',
			readOnly: true, // Triggers using the render method instead of Edit.
			isVisible: ( item ) => item.displayPayments,
			render: ( { item } ) => {
				return (
					<p>
						The customer has made a total of { item.totalOrders }{ ' ' }
						orders, amounting to { item.totalRevenue } dollars. The
						average order value is { item.averageOrderValue }{ ' ' }
						dollars.
					</p>
				);
			},
		},
		{
			id: 'vat',
			label: 'VAT',
			type: 'integer',
		},
		{
			id: 'commission',
			label: 'Commission',
			type: 'integer',
		},
	];

	const [ customer, setCustomer ] = useState< Customer >( {
		name: 'Danyka Romaguera',
		email: 'aromaguera@example.org',
		phone: '1-828-352-1250',
		plan: 'Business',
		shippingAddress: 'N/A',
		billingAddress: 'Danyka Romaguera, West Myrtiehaven, 80240-4282, BI',
		displayPayments: true,
		totalOrders: 2,
		totalRevenue: 1430,
		averageOrderValue: 715,
		hasVat: true,
		vat: 10,
		commission: 5,
	} );

	const form: Form = useMemo(
		() => ( {
			layout: getLayoutFromStoryArgs( {
				type: 'card',
				withHeader,
			} ),
			fields: [
				{
					id: 'customerCard',
					label: 'Customer',
					description:
						'Enter your contact details, plan type, and addresses to complete your customer information.',
					children: [
						{
							id: 'customerContact',
							label: 'Contact',
							layout: { type: 'panel', labelPosition: 'top' },
							children: [
								{
									id: 'name',
									layout: {
										type: 'regular',
										labelPosition: 'top',
									},
								},
								{
									id: 'phone',
									layout: {
										type: 'regular',
										labelPosition: 'top',
									},
								},
								{
									id: 'email',
									layout: {
										type: 'regular',
										labelPosition: 'top',
									},
								},
							],
						},
						{
							id: 'plan',
							layout: { type: 'panel', labelPosition: 'top' },
						},
						{
							id: 'shippingAddress',
							layout: { type: 'panel', labelPosition: 'top' },
						},
						{
							id: 'billingAddress',
							layout: { type: 'panel', labelPosition: 'top' },
						},
						'displayPayments',
					],
				},
				{
					id: 'payments',
					layout: {
						type: 'card',
						withHeader: false,
					},
				},
				{
					id: 'taxConfiguration',
					label: 'Taxes',
					layout: {
						type: 'card',
						isOpened: false,
					},
					children: [ 'vat', 'commission' ],
				},
			],
		} ),
		[ withHeader ]
	);

	return (
		<DataForm
			data={ customer }
			fields={ customerFields }
			form={ form }
			onChange={ ( edits ) =>
				setCustomer( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

const LayoutMixedComponent = () => {
	const [ post, setPost ] = useState< SamplePost >( {
		title: 'Hello, World!',
		order: 2,
		author: 1,
		status: 'draft',
		reviewer: 'fulano',
		date: '2021-01-01T12:00:00',
		birthdate: '1950-02-23T12:00:00',
		filesize: 1024,
		dimensions: '1920x1080',
	} );

	const form: Form = {
		fields: [
			{
				id: 'title',
				layout: {
					type: 'panel',
					labelPosition: 'top',
					openAs: 'dropdown',
				},
			},
			'status',
			{
				id: 'order',
				layout: {
					type: 'card',
				},
				children: [ { id: 'order', layout: { type: 'panel' } } ],
			},
			{
				id: 'authorDateCard',
				label: 'Author & Date',
				layout: {
					type: 'card',
				},
				children: [ 'author', 'date' ],
			},
		],
	};

	return (
		<DataForm< SamplePost >
			data={ post }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setPost( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

const meta = {
	title: 'DataViews/DataForm',
	component: DataForm,
};
export default meta;

export const Default = {
	render: LayoutRegularComponent,
	argTypes: {
		type: {
			control: { type: 'select' },
			description: 'Chooses the layout type.',
			options: [ 'default', 'card', 'panel', 'regular' ],
		},
	},
};

export const LayoutCard = {
	render: LayoutCardComponent,
	argTypes: {
		withHeader: {
			control: { type: 'boolean' },
			description: 'Whether the card has a header.',
		},
	},
	args: {
		withHeader: true,
	},
};

export const LayoutPanel = {
	render: LayoutPanelComponent,
	argTypes: {
		labelPosition: {
			control: { type: 'select' },
			description: 'Chooses the label position.',
			options: [ 'default', 'top', 'side', 'none' ],
		},
		openAs: {
			control: { type: 'select' },
			description: 'Chooses how to open the panel.',
			options: [ 'default', 'dropdown', 'modal' ],
		},
	},
};

export const LayoutRegular = {
	render: LayoutRegularComponent,
	argTypes: {
		labelPosition: {
			control: { type: 'select' },
			description: 'Chooses the label position.',
			options: [ 'default', 'top', 'side', 'none' ],
		},
	},
};

export const LayoutMixed = {
	render: LayoutMixedComponent,
};

export const Validation = {
	render: ValidationComponent,
	argTypes: {
		required: {
			control: { type: 'boolean' },
			description: 'Whether or not the fields are required.',
		},
		type: {
			control: { type: 'select' },
			description: 'Chooses the validation type.',
			options: [ 'regular', 'panel' ],
		},
		custom: {
			control: { type: 'boolean' },
			description: 'Whether or not the fields have custom validation.',
		},
	},
	args: {
		required: true,
		type: 'regular',
		custom: true,
	},
};

export const Visibility = {
	render: VisibilityComponent,
};
