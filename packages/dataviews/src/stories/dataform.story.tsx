/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

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
import DataForm from '../components/dataform';
import useFormValidity from '../hooks/use-form-validity';

import type {
	CardLayout,
	DataFormControlProps,
	Field,
	FieldValidity,
	Form,
	Layout,
	PanelLayout,
	RegularLayout,
	Rules,
} from '../types';
import { unlock } from '../lock-unlock';
import DateControl from '../dataform-controls/date';

const { ValidatedTextControl, Badge } = unlock( privateApis );

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
	comment_status?: string;
	ping_status?: boolean;
	longDescription?: string;
	origin?: string;
	destination?: string;
	flight_status?: string;
	gate?: string;
	seat?: string;
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
		setValue: ( { value } ) => ( {
			author: Number( value ),
		} ),
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
	{
		id: 'description',
		label: 'Description',
		type: 'text',
		Edit: 'textarea',
	},
	{
		id: 'longDescription',
		label: 'Long Description',
		type: 'text',
		Edit: {
			control: 'textarea',
			rows: 5,
		},
	},
	{
		id: 'comment_status',
		label: 'Comment Status',
		type: 'text',
		Edit: 'radio',
		elements: [
			{ value: 'open', label: 'Allow comments' },
			{ value: 'closed', label: 'Comments closed' },
		],
	},
	{
		id: 'ping_status',
		label: 'Allow Pings/Trackbacks',
		type: 'boolean',
	},
	{
		id: 'discussion',
		label: 'Discussion',
		type: 'text',
		render: ( { item } ) => {
			const commentLabel =
				item.comment_status === 'open'
					? 'Allow comments'
					: 'Comments closed';
			const pingLabel = item.ping_status
				? 'Pings enabled'
				: 'Pings disabled';
			return (
				<span>
					{ commentLabel }, { pingLabel }
				</span>
			);
		},
	},
	{
		id: 'origin',
		label: 'Origin',
		type: 'text',
	},
	{
		id: 'destination',
		label: 'Destination',
		type: 'text',
	},
	{
		id: 'flight_status',
		label: 'Flight Status',
		type: 'text',
		Edit: 'radio',
		elements: [
			{ value: 'on-time', label: 'On Time' },
			{ value: 'delayed', label: 'Delayed' },
			{ value: 'cancelled', label: 'Cancelled' },
		],
	},
	{
		id: 'gate',
		label: 'Gate',
		type: 'text',
	},
	{
		id: 'seat',
		label: 'Seat',
		type: 'text',
	},
];

const LayoutRegularComponent = ( {
	labelPosition,
}: {
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
		description: 'This is a sample description.',
	} );

	const form: Form = useMemo(
		() => ( {
			layout: getLayoutFromStoryArgs( {
				type: 'regular',
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
				'description',
				'longDescription',
			],
		} ),
		[ labelPosition ]
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
	type: 'default' | 'regular' | 'panel' | 'card' | 'row';
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
		comment_status: 'open',
		ping_status: true,
		origin: 'New York (JFK)',
		destination: 'Los Angeles (LAX)',
		flight_status: 'on-time',
		gate: 'A12',
		seat: '14F',
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
					id: 'discussion',
					label: 'Discussion',
					children: [ 'comment_status', 'ping_status' ],
				},
				{
					id: 'address1',
					label: 'Combined Address',
					children: [ 'address1', 'address2', 'city' ],
				},
				{
					id: 'flight_info',
					label: 'Flight Information',
					children: [
						'origin',
						'destination',
						'flight_status',
						'gate',
					],
					layout: {
						type: 'panel',
						summary: [ 'origin', 'destination', 'flight_status' ],
					},
				},
				{
					id: 'passenger_details',
					label: 'Passenger Details',
					children: [ 'author', 'seat' ],
					layout: {
						type: 'panel',
						summary: [ 'author', 'seat' ],
					},
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

function getCustomValidity< Item >(
	isValid: Rules< Item >,
	validity: FieldValidity | undefined
) {
	let customValidity;
	if ( isValid?.required && validity?.required ) {
		// If the consumer provides a message for required,
		// use it instead of the native built-in message.
		customValidity = validity?.required?.message
			? validity.required
			: undefined;
	} else if ( isValid?.elements && validity?.elements ) {
		customValidity = validity.elements;
	} else if ( validity?.custom ) {
		customValidity = validity.custom;
	}

	return customValidity;
}

function CustomEditControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, placeholder, description, getValue, setValue, isValid } =
		field;
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	return (
		<ValidatedTextControl
			required={ !! isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
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
	custom: 'sync' | 'async' | 'none';
	type: 'regular' | 'panel';
} ) => {
	type ValidatedItem = {
		text: string;
		select?: string;
		textWithRadio?: string;
		textarea: string;
		email: string;
		telephone: string;
		url: string;
		color: string;
		integer: number;
		number: number;
		boolean: boolean;
		customEdit: string;
		categories: string[];
		countries: string[];
		password: string;
		toggle?: boolean;
		toggleGroup?: string;
		date?: string;
		dateRange?: string;
		datetime?: string;
	};

	const DateRangeEdit = ( props: DataFormControlProps< ValidatedItem > ) => {
		return <DateControl { ...props } operator="between" />;
	};

	const [ post, setPost ] = useState< ValidatedItem >( {
		text: 'Can have letters and spaces',
		select: undefined,
		textWithRadio: undefined,
		textarea: 'Can have letters and spaces',
		email: 'hi@example.com',
		telephone: '+306978241796',
		url: 'https://example.com',
		color: '#ff6600',
		integer: 2,
		number: 3.14,
		boolean: true,
		categories: [ 'astronomy' ],
		countries: [ 'us' ],
		customEdit: 'custom control',
		password: 'secretpassword123',
		toggle: undefined,
		toggleGroup: undefined,
		date: undefined,
		dateRange: undefined,
		datetime: undefined,
	} );

	const makeAsync = ( rule: ( item: ValidatedItem ) => null | string ) => {
		return async ( value: ValidatedItem ) => {
			return await new Promise< string | null >( ( resolve ) => {
				setTimeout( () => {
					const validationResult = rule( value );
					resolve( validationResult );
				}, 2000 );
			} );
		};
	};

	const customTextRule = ( value: ValidatedItem ) => {
		if ( ! /^[a-zA-Z ]+$/.test( value.text ) ) {
			return 'Value must only contain letters and spaces.';
		}

		return null;
	};

	const customSelectRule = ( value: ValidatedItem ) => {
		if ( value.select !== 'option1' ) {
			return 'Value must be Option 1.';
		}
		return null;
	};

	const customTextRadioRule = ( value: ValidatedItem ) => {
		if ( value.textWithRadio !== 'item1' ) {
			return 'Value must be Item 1.';
		}

		return null;
	};

	const customTextareaRule = ( value: ValidatedItem ) => {
		if ( ! /^[a-zA-Z ]+$/.test( value.textarea ) ) {
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
	const customColorRule = ( value: ValidatedItem ) => {
		if ( ! /^#[0-9A-Fa-f]{6}$/.test( value.color ) ) {
			return 'Color must be a valid hex format (e.g., #ff6600).';
		}

		return null;
	};
	const customIntegerRule = ( value: ValidatedItem ) => {
		if ( value.integer % 2 !== 0 ) {
			return 'Integer must be an even number.';
		}

		return null;
	};
	const customNumberRule = ( value: ValidatedItem ) => {
		if ( ! /^\d+\.\d{2}$/.test( value?.number?.toString() ) ) {
			return 'Number must have exactly two decimal places.';
		}

		return null;
	};
	const customBooleanRule = ( value: ValidatedItem ) => {
		if ( value.boolean !== true ) {
			return 'Boolean must be active.';
		}

		return null;
	};
	const customToggleRule = ( value: ValidatedItem ) => {
		if ( value.toggle !== true ) {
			return 'Toggle must be checked.';
		}

		return null;
	};
	const customToggleGroupRule = ( value: ValidatedItem ) => {
		if ( value.toggleGroup !== 'option1' ) {
			return 'Value must be Option 1.';
		}

		return null;
	};

	const customPasswordRule = ( value: ValidatedItem ) => {
		if ( value.password.length < 8 ) {
			return 'Password must be at least 8 characters long.';
		}
		if ( ! /[A-Z]/.test( value.password ) ) {
			return 'Password must contain at least one uppercase letter.';
		}
		if ( ! /[0-9]/.test( value.password ) ) {
			return 'Password must contain at least one number.';
		}

		return null;
	};

	const customDateRule = ( value: ValidatedItem ) => {
		if ( ! value.date ) {
			return null;
		}
		const selectedDate = new Date( value.date );
		const today = new Date();
		today.setHours( 0, 0, 0, 0 );
		if ( selectedDate < today ) {
			return 'Date must not be in the past.';
		}

		return null;
	};
	const customDateTimeRule = ( value: ValidatedItem ) => {
		if ( ! value.datetime ) {
			return null;
		}
		const selectedDateTime = new Date( value.datetime );
		const now = new Date();
		if ( selectedDateTime < now ) {
			return 'Date and time must not be in the past.';
		}

		return null;
	};

	const customDateRangeRule = ( value: ValidatedItem ) => {
		if ( ! value.dateRange ) {
			return null;
		}
		const [ fromDate, toDate ] = value.dateRange;
		if ( ! fromDate || ! toDate ) {
			return null;
		}
		const from = new Date( fromDate );
		const to = new Date( toDate );
		const daysDiff = Math.ceil(
			( to.getTime() - from.getTime() ) / ( 1000 * 60 * 60 * 24 )
		);
		if ( daysDiff > 30 ) {
			return 'Date range must not exceed 30 days.';
		}
		return null;
	};

	const maybeCustomRule = (
		rule: ( item: ValidatedItem ) => null | string
	) => {
		if ( custom === 'sync' ) {
			return rule;
		}

		if ( custom === 'async' ) {
			return makeAsync( rule );
		}

		return undefined;
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
			id: 'select',
			type: 'text',
			label: 'Select',
			elements: [
				{ value: 'option1', label: 'Option 1' },
				{ value: 'option2', label: 'Option 2' },
			],
			isValid: {
				required,
				custom: maybeCustomRule( customSelectRule ),
			},
		},
		{
			id: 'textWithRadio',
			type: 'text',
			Edit: 'radio',
			label: 'Text with radio',
			elements: [
				{ value: 'item1', label: 'Item 1' },
				{ value: 'item2', label: 'Item 2' },
			],
			isValid: {
				required,
				custom: maybeCustomRule( customTextRadioRule ),
			},
		},
		{
			id: 'textarea',
			type: 'text',
			Edit: 'textarea',
			label: 'Textarea',
			isValid: {
				required,
				custom: maybeCustomRule( customTextareaRule ),
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
			id: 'color',
			type: 'color',
			label: 'Color',
			isValid: {
				required,
				custom: maybeCustomRule( customColorRule ),
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
			id: 'number',
			type: 'number',
			label: 'Number',
			isValid: {
				required,
				custom: maybeCustomRule( customNumberRule ),
			},
		},
		{
			id: 'boolean',
			type: 'boolean',
			label: 'Boolean',
			isValid: {
				required,
				custom: maybeCustomRule( customBooleanRule ),
			},
		},
		{
			id: 'categories',
			type: 'array' as const,
			label: 'Categories',
			isValid: {
				required,
			},
			elements: [
				{ value: 'astronomy', label: 'Astronomy' },
				{ value: 'book-review', label: 'Book review' },
				{ value: 'event', label: 'Event' },
				{ value: 'photography', label: 'Photography' },
				{ value: 'travel', label: 'Travel' },
			],
		},
		{
			id: 'countries',
			label: 'Countries Visited',
			type: 'array' as const,
			placeholder: 'Select countries',
			description: 'Countries you have visited',
			isValid: {
				required,
				elements: true,
			},
			elements: [
				{ value: 'us', label: 'United States' },
				{ value: 'ca', label: 'Canada' },
				{ value: 'uk', label: 'United Kingdom' },
				{ value: 'fr', label: 'France' },
				{ value: 'de', label: 'Germany' },
				{ value: 'jp', label: 'Japan' },
				{ value: 'au', label: 'Australia' },
			],
		},
		{
			id: 'customEdit',
			label: 'Custom Control',
			Edit: CustomEditControl,
			isValid: {
				required,
			},
		},
		{
			id: 'password',
			type: 'password',
			label: 'Password',
			isValid: {
				required,
				custom: maybeCustomRule( customPasswordRule ),
			},
		},
		{
			id: 'toggle',
			type: 'boolean',
			label: 'Toggle',
			Edit: 'toggle',
			isValid: {
				required,
				custom: maybeCustomRule( customToggleRule ),
			},
		},
		{
			id: 'toggleGroup',
			type: 'text',
			label: 'Toggle Group',
			Edit: 'toggleGroup',
			elements: [
				{ value: 'option1', label: 'Option 1' },
				{ value: 'option2', label: 'Option 2' },
				{ value: 'option3', label: 'Option 3' },
			],
			isValid: {
				required,
				custom: maybeCustomRule( customToggleGroupRule ),
			},
		},
		{
			id: 'date',
			type: 'date',
			label: 'Date',
			isValid: {
				required,
				custom: maybeCustomRule( customDateRule ),
			},
		},
		{
			id: 'dateRange',
			type: 'date',
			label: 'Date Range',
			Edit: DateRangeEdit,
			isValid: {
				required,
				custom: maybeCustomRule( customDateRangeRule ),
			},
		},
		{
			id: 'datetime',
			type: 'datetime',
			label: 'Date Time',
			isValid: {
				required,
				custom: maybeCustomRule( customDateTimeRule ),
			},
		},
	];

	const form = {
		layout: { type },
		fields: [
			// Use field object for testing purposes.
			{ id: 'text' },
			'select',
			'textWithRadio',
			'textarea',
			'email',
			'telephone',
			'url',
			'color',
			'integer',
			'number',
			'boolean',
			'categories',
			'countries',
			'toggle',
			'toggleGroup',
			'password',
			'customEdit',
			// Use field object with children for testing purposes.
			{
				id: 'dates',
				label: 'Dates',
				children: [ 'date', 'dateRange', 'datetime' ],
			},
		],
	};

	const { validity, isValid } = useFormValidity( post, _fields, form );

	return (
		<form>
			<VStack alignment="left">
				<DataForm< ValidatedItem >
					data={ post }
					fields={ _fields }
					form={ form }
					validity={ validity }
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
					disabled={ ! isValid }
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
		homepageDisplay: string;
		staticHomepage: string;
	};
	const [ data, setData ] = useState( {
		name: '',
		email: '',
		isActive: true,
		homepageDisplay: 'latest',
		staticHomepage: '',
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
		{
			id: 'homepageDisplay',
			label: 'Homepage display',
			elements: [
				{ value: 'latest', label: 'Latest post' },
				{ value: 'static', label: 'Static page' },
			],
		},
		{
			id: 'staticHomepage',
			label: 'Static homepage',
			elements: [
				{ value: 'welcome', label: 'Welcome to my website' },
				{ value: 'about', label: 'About' },
			],
			isVisible: ( post ) => post.homepageDisplay === 'static',
		},
	];
	const form: Form = {
		layout: { type: 'card' },
		fields: [
			{
				id: 'booleanExample',
				children: [ 'isActive', 'name', 'email' ],
			},
			{
				id: 'selectExample',
				children: [ 'homepageDisplay', 'staticHomepage' ],
			},
		],
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
		dueDate: string;
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
		{
			id: 'dueDate',
			label: 'Due Date',
			type: 'text',
			render: ( { item } ) => {
				return <Badge>Due on: { item.dueDate }</Badge>;
			},
		},
		{
			id: 'plan-summary',
			type: 'text',
			readOnly: true,
			render: ( { item } ) => {
				return <Badge>{ item.plan }</Badge>;
			},
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
		dueDate: 'March 1st, 2028',
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
					layout: { type: 'card', summary: 'plan-summary' },
					label: 'Customer',
					description:
						'Enter your contact details, plan type, and addresses to complete your customer information.',
					children: [
						{
							id: 'customerContact',
							label: 'Contact',
							layout: {
								type: 'panel',
								labelPosition: 'top',
							},
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
						summary: [ { id: 'dueDate', visibility: 'always' } ],
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

const LayoutRowComponent = ( {
	alignment,
}: {
	alignment: 'start' | 'center' | 'end';
} ) => {
	type Customer = {
		name: string;
		email: string;
		phone: string;
		plan: string;
		shippingAddress: string;
		shippingCity: string;
		shippingPostalCode: string;
		shippingCountry: string;
		billingAddress: string;
		billingCity: string;
		billingPostalCode: string;
		totalOrders: number;
		totalRevenue: number;
		averageOrderValue: number;
		hasVat: boolean;
		hasDiscount: boolean;
		vat: number;
		commission: number;
		cost: number;
		tax: number;
		quantity: number;
		total: number;
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
			id: 'shippingAddress',
			label: 'Shipping Address',
			type: 'text',
		},
		{
			id: 'shippingCity',
			label: 'Shipping City',
			type: 'text',
		},
		{
			id: 'shippingPostalCode',
			label: 'Shipping Postal Code',
			type: 'text',
		},
		{
			id: 'shippingCountry',
			label: 'Shipping Country',
			type: 'text',
		},
		{
			id: 'billingAddress',
			label: 'Billing Address',
			type: 'text',
		},
		{
			id: 'billingCity',
			label: 'Billing City',
			type: 'text',
		},
		{
			id: 'billingPostalCode',
			label: 'Billing Postal Code',
			type: 'text',
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
		{
			id: 'hasDiscount',
			label: 'Has Discount?',
			type: 'boolean',
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
			id: 'renewal',
			label: 'Renewal',
			type: 'text',
			Edit: 'radio',
			elements: [
				{ value: 'weekly', label: 'Weekly' },
				{ value: 'monthly', label: 'Monthly' },
				{ value: 'yearly', label: 'Yearly' },
			],
		},
		{
			id: 'cost',
			label: 'Cost',
			type: 'integer',
			setValue: ( { item, value } ) => ( {
				cost: value,
				total: Number( value ) * item.quantity,
			} ),
		},
		{
			id: 'quantity',
			label: 'Quantity',
			type: 'integer',
			elements: [
				{ value: 1, label: '1' },
				{ value: 2, label: '2' },
				{ value: 3, label: '3' },
				{ value: 4, label: '4' },
				{ value: 5, label: '5' },
				{ value: 6, label: '6' },
				{ value: 7, label: '7' },
				{ value: 8, label: '8' },
				{ value: 9, label: '9' },
				{ value: 10, label: '10' },
			],
			setValue: ( { item, value } ) => ( {
				quantity: Number( value ),
				total: Number( value ) * item.cost,
			} ),
		},
		{
			id: 'total',
			label: 'Total',
			type: 'integer',
			readOnly: true,
		},
	];

	const [ customer, setCustomer ] = useState< Customer >( {
		name: 'Danyka Romaguera',
		email: 'aromaguera@example.org',
		phone: '1-828-352-1250',
		plan: 'Business',
		shippingAddress: 'N/A',
		shippingCity: 'N/A',
		shippingPostalCode: 'N/A',
		shippingCountry: 'N/A',
		billingAddress: 'Danyka Romaguera, West Myrtiehaven, 80240-4282, BI',
		billingCity: 'City',
		billingPostalCode: 'PC',
		totalOrders: 2,
		totalRevenue: 1430,
		averageOrderValue: 715,
		hasVat: true,
		vat: 10,
		commission: 5,
		hasDiscount: true,
		cost: 100,
		tax: 20,
		quantity: 5,
		total: 600,
	} );

	const form: Form = useMemo(
		() => ( {
			fields: [
				{
					id: 'customer',
					label: 'Customer',
					layout: {
						type: 'row',
						alignment,
					},
					children: [ 'name', 'phone', 'email' ],
				},
				{
					id: 'addressRow',
					label: 'Billing & Shipping Addresses',
					layout: {
						type: 'row',
						alignment,
					},
					children: [
						{
							id: 'billingAddress',
							children: [
								'billingAddress',
								'billingCity',
								'billingPostalCode',
							],
						},
						{
							id: 'shippingAddress',
							children: [
								'shippingAddress',
								'shippingCity',
								'shippingPostalCode',
								'shippingCountry',
							],
						},
					],
				},
				{
					id: 'payments-and-tax',
					label: 'Payments & Taxes',
					layout: {
						type: 'row',
						alignment,
					},
					children: [ 'vat', 'commission', 'hasDiscount' ],
				},
				{
					id: 'planRow',
					label: 'Subscription',
					layout: {
						type: 'row',
						alignment,
					},
					children: [ 'plan', 'renewal' ],
				},
			],
		} ),
		[ alignment ]
	);

	const topLevelLayout: Form = useMemo(
		() => ( {
			layout: {
				type: 'row',
				alignment,
			},
			fields: [ 'name', 'phone', 'email' ],
		} ),
		[ alignment ]
	);

	return (
		<>
			<h1>Row Layout</h1>
			<h2>As top-level layout</h2>
			<DataForm
				data={ customer }
				fields={ customerFields }
				form={ topLevelLayout }
				onChange={ ( edits ) =>
					setCustomer( ( prev ) => ( {
						...prev,
						...edits,
					} ) )
				}
			/>
			<h2>Per field layout</h2>
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
			<h2>Field widths</h2>
			<DataForm
				data={ customer }
				fields={ customerFields }
				form={ {
					fields: [
						{
							id: 'product',
							label: 'Product',
							layout: {
								type: 'row',
								alignment: 'end',
								styles: {
									total: { flex: 1 },
									cost: { flex: 3 },
									quantity: { flex: 3 },
								},
							},
							children: [ 'total', 'cost', 'quantity' ],
						},
					],
				} }
				onChange={ ( edits ) =>
					setCustomer( ( prev ) => ( {
						...prev,
						...edits,
					} ) )
				}
			/>
		</>
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
				id: 'title-and-status',
				children: [
					{
						id: 'title',
						layout: { type: 'panel' },
					},
					'status',
				],
				layout: {
					type: 'row',
				},
			},
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

export const LayoutRow = {
	render: LayoutRowComponent,
	argTypes: {
		alignment: {
			control: { type: 'select' },
			description: 'The alignment of the fields.',
			options: [ 'start', 'center', 'end' ],
		},
	},
	args: {
		alignment: 'center',
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
			options: [ 'regular', 'panel', 'card', 'row' ],
		},
		custom: {
			control: { type: 'select' },
			description: 'Whether or not the fields have custom validation.',
			options: [ 'sync', 'async', 'none' ],
		},
	},
	args: {
		required: true,
		type: 'regular',
		custom: 'sync',
	},
};

export const Visibility = {
	render: VisibilityComponent,
};

const DataAdapterComponent = () => {
	type DataAdapterItem = {
		user: {
			profile: {
				name: string;
				email: string;
			};
			preferences: {
				notifications: boolean;
			};
		};
		revenue: {
			total: number;
			units: number;
			pricePerUnit: number;
		};
	};

	const [ data, setData ] = useState< DataAdapterItem >( {
		user: {
			profile: {
				name: 'John Doe',
				email: 'john@example.com',
			},
			preferences: {
				notifications: true,
			},
		},
		revenue: {
			total: 30,
			units: 10,
			pricePerUnit: 3,
		},
	} );

	const nestedFields: Field< DataAdapterItem >[] = [
		// Examples of autogenerated getValue/setValue methods
		// for nested data based on the field id.
		{
			id: 'user.profile.name',
			label: 'User Name',
			type: 'text',
		},
		{
			id: 'user.profile.email',
			label: 'User Email',
			type: 'email',
		},
		// Example of adapting a data value to a control value
		// by providing getValue/setValue methods.
		{
			id: 'user.preferences.notifications',
			label: 'Notifications',
			type: 'boolean',
			Edit: 'radio',
			elements: [
				{ label: 'Enabled', value: 'enabled' },
				{ label: 'Disabled', value: 'disabled' },
			],
			getValue: ( { item } ) =>
				item.user.preferences.notifications === true
					? 'enabled'
					: 'disabled',
			setValue: ( { value } ) => ( {
				user: {
					preferences: { notifications: value === 'enabled' },
				},
			} ),
		},
		// Example of deriving data by leveraging setValue method.
		{
			id: 'revenue.total',
			label: 'Total Revenue',
			type: 'integer',
			readOnly: true,
		},
		{
			id: 'revenue.pricePerUnit',
			label: 'Price Per Unit',
			type: 'integer',
			setValue: ( { item, value } ) => ( {
				revenue: {
					total: value * item.revenue.units,
					pricePerUnit: value,
				},
			} ),
		},
		{
			id: 'revenue.units',
			label: 'Units',
			type: 'integer',
			setValue: ( { item, value } ) => ( {
				revenue: {
					total: item.revenue.pricePerUnit * value,
					units: value,
				},
			} ),
		},
	];

	const handleChange = useCallback( ( edits: any ) => {
		// Edits will respect the shape of the data
		// because fields provide the proper information
		// (via field.id or via field.setValue).
		setData( ( prev ) => deepMerge( prev, edits ) );
	}, [] );

	return (
		<>
			<h1>Data adapter</h1>
			<p>
				This story is best looked at with the code on the side. It aims
				to highlight how DataForm can wrangle data in scenarios such as
				nested data, bridge data to/from UI controls, and derived data.
			</p>
			<p>
				<b>Current data snapshot:</b>
			</p>
			<pre>{ JSON.stringify( data, null, 2 ) }</pre>
			<h2>Nested data</h2>
			<p>
				The first example demonstrates how to signal nested data via{ ' ' }
				<code>field.id</code>.
			</p>
			<p>
				By using <code>{ `{ id: 'user.profile.name' }` }</code> as field
				id, when users edit the name, the edits will come in this shape:
				<code>{ `{ user: { profile: { name: 'John Doe' } } }` }</code>
			</p>
			<DataForm< DataAdapterItem >
				data={ data }
				fields={ nestedFields }
				form={ {
					layout: {
						type: 'panel',
						labelPosition: 'top',
						openAs: 'modal',
					},
					fields: [
						{
							id: 'userProfile',
							label: 'User Profile',
							children: [
								'user.profile.name',
								'user.profile.email',
							],
						},
					],
				} }
				onChange={ handleChange }
			/>
			<h2>Adapt data and UI control</h2>
			<p>
				Sometimes, we need to adapt the data type to and from the UI
				control response. This example demonstrates how to adapt a
				boolean to a text string (Enabled/Disabled).
			</p>
			<DataForm< DataAdapterItem >
				data={ data }
				fields={ nestedFields }
				form={ {
					layout: {
						type: 'panel',
						labelPosition: 'top',
						openAs: 'modal',
					},
					fields: [ 'user.preferences.notifications' ],
				} }
				onChange={ handleChange }
			/>
			<h2>Derived data</h2>
			<p>
				Last, but not least, this example showcases how to work with
				derived data by providing a custom setValue function. Note how,
				changing UNITS or PRICE PER UNIT, updates the TOTAL value as
				well.
			</p>
			<DataForm< DataAdapterItem >
				data={ data }
				fields={ nestedFields }
				form={ {
					layout: {
						type: 'panel',
						labelPosition: 'top',
						openAs: 'modal',
					},
					fields: [
						{
							id: 'revenue',
							label: 'Revenue',
							children: [
								'revenue.pricePerUnit',
								'revenue.units',
								'revenue.total',
							],
						},
					],
				} }
				onChange={ handleChange }
			/>
		</>
	);
};

export const DataAdapter = {
	render: DataAdapterComponent,
};
