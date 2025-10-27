/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Icon,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';
import { starFilled } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DataViews from '../components/dataviews/index';
import DataForm from '../components/dataform/index';
import filterSortAndPaginate from '../utils/filter-sort-and-paginate';
import type { View, Form, Field } from '../types';

const meta = {
	title: 'DataViews/FieldTypes',
	component: DataForm,
	argTypes: {
		type: {
			control: { type: 'select' },
			description:
				'Chooses the default layout of each field. "regular" is the default layout.',
			options: [ 'regular', 'panel' ],
		},
		Edit: {
			control: { type: 'select' },
			description:
				'Chooses the Edit function for the field. "Default" means use the default Edit function for the field type.',
			options: [
				'default',
				'array',
				'checkbox',
				'color',
				'date',
				'datetime',
				'email',
				'integer',
				'number',
				'password',
				'radio',
				'select',
				'telephone',
				'url',
				'text',
				'toggle',
				'toggleGroup',
			],
		},
		asyncElements: {
			control: { type: 'boolean' },
			description:
				'Whether the filter should fetch elements asynchronously.',
			options: [ true, false ],
		},
	},
	args: {
		type: 'regular',
		Edit: 'default',
		asyncElements: false,
	},
};
export default meta;

const DollarPrefix = () => (
	<InputControlPrefixWrapper>
		<span>$</span>
	</InputControlPrefixWrapper>
);
const StarIconPrefix = () => (
	<InputControlPrefixWrapper variant="icon">
		<Icon icon={ starFilled } />
	</InputControlPrefixWrapper>
);
const PercentSuffix = () => (
	<InputControlSuffixWrapper>
		<span>%</span>
	</InputControlSuffixWrapper>
);
const USDSuffix = () => (
	<InputControlSuffixWrapper>
		<span>USD</span>
	</InputControlSuffixWrapper>
);
type DataType = {
	id: number;
	text: string;
	textWithElements: string;
	textWithRadio: string;
	textWithTextarea: string;
	integer: number;
	integerWithElements: number;
	number?: number;
	numberWithElements?: number;
	boolean: boolean;
	booleanWithToggle: boolean;
	booleanWithElements: boolean;
	datetime: string;
	datetimeWithElements: string;
	date: string;
	dateWithElements: string;
	email: string;
	emailWithElements: string;
	telephone: string;
	telephoneWithElements: string;
	color: string;
	colorWithElements: string;
	url: string;
	urlWithElements: string;
	password: string;
	passwordWithElements: string;
	media: string;
	mediaWithElements: string;
	array: string[];
	arrayWithElements: string[];
	notype: string;
	notypeWithElements: string;
	priceWithPrefix?: string;
	ratingWithIcon?: string;
	percentageWithSuffix?: string;
	priceWithBoth?: string;
};

const data: DataType[] = [
	{
		id: 1,
		text: 'Text',
		textWithElements: 'item1',
		textWithRadio: 'item2',
		textWithTextarea: 'Textarea',
		integer: 1,
		integerWithElements: 1,
		number: 10.25,
		numberWithElements: 2,
		boolean: true,
		booleanWithToggle: true,
		booleanWithElements: true,
		datetime: '2021-01-01T14:30:00Z',
		datetimeWithElements: '2021-01-01T14:30:00Z',
		date: '2021-01-01',
		dateWithElements: '2021-01-01',
		email: 'hi@example.com',
		emailWithElements: 'bob@example.com',
		telephone: '+1-555-123-4567',
		telephoneWithElements: '+1-555-123-4567',
		color: '#ff6600',
		colorWithElements: 'rgba(255, 165, 0, 0.8)',
		url: 'https://example.com',
		urlWithElements: 'https://example.com',
		password: 'secretpassword123',
		passwordWithElements: 'secretpassword123',
		media: 'https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg',
		mediaWithElements:
			'https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg',
		array: [ 'item1', 'item2', 'item3' ],
		arrayWithElements: [ 'item1', 'item2', 'item3' ],
		notype: 'No type',
		notypeWithElements: 'No type',
		priceWithPrefix: '25.99',
		ratingWithIcon: '4.5',
		percentageWithSuffix: '85',
		priceWithBoth: '199.99',
	},
];

const fields: Field< DataType >[] = [
	{
		id: 'text',
		type: 'text',
		label: 'Text',
		description: 'Help for text.',
	},
	{
		id: 'textWithElements',
		type: 'text',
		label: 'Text (with elements)',
		description: 'Help for text with elements.',
		elements: [
			{ value: 'item1', label: 'Item 1' },
			{ value: 'item2', label: 'Item 2' },
			{ value: 'item3', label: 'Item 3' },
		],
	},
	{
		id: 'textWithRadio',
		type: 'text',
		label: 'Text (with radio)',
		description: 'Help for text with radio.',
		Edit: 'radio',
		elements: [
			{ value: 'item1', label: 'Item 1' },
			{ value: 'item2', label: 'Item 2' },
			{ value: 'item3', label: 'Item 3' },
		],
	},
	{
		id: 'textWithTextarea',
		type: 'text',
		label: 'Textarea',
		description: 'Help for textarea.',
		Edit: 'textarea',
	},
	{
		id: 'integer',
		type: 'integer',
		label: 'Integer',
		description: 'Help for integer.',
	},
	{
		id: 'integerWithElements',
		type: 'integer',
		label: 'Integer (with elements)',
		description: 'Help for integer with elements.',
		elements: [
			{ value: 1, label: 'One' },
			{ value: 2, label: 'Two' },
			{ value: 3, label: 'Three' },
		],
		setValue: ( { value } ) => ( {
			integerWithElements: parseInt( value, 10 ),
		} ),
	},
	{
		id: 'number',
		type: 'number',
		label: 'Number',
		description: 'Number field increments by 0.01.',
	},
	{
		id: 'numberWithElements',
		type: 'number',
		label: 'Number (with elements)',
		description: 'Number field with elements.',
		elements: [
			{ value: 1, label: 'One' },
			{ value: 2, label: 'Two' },
			{ value: 3, label: 'Three' },
		],
		setValue: ( { value } ) => ( {
			numberWithElements: Number( value ),
		} ),
	},
	{
		id: 'boolean',
		type: 'boolean',
		label: 'Boolean',
		description: 'Help for boolean.',
	},
	{
		id: 'booleanWithToggle',
		type: 'boolean',
		label: 'Boolean (with toggle)',
		description: 'Help for boolean with toggle control.',
		Edit: 'toggle',
	},
	{
		id: 'booleanWithElements',
		type: 'boolean',
		label: 'Boolean (with elements)',
		description: 'Help for boolean with elements.',
		elements: [
			{ value: true, label: 'It is true' },
			{ value: false, label: 'It is false' },
		],
		setValue: ( { value } ) => ( {
			booleanWithElements: value === 'true' ? true : false,
		} ),
	},
	{
		id: 'datetime',
		type: 'datetime',
		label: 'Datetime',
		description: 'Help for datetime.',
	},
	{
		id: 'datetimeWithElements',
		type: 'datetime',
		label: 'Datetime (with elements)',
		description: 'Help for datetime with elements.',
		elements: [
			{
				value: '2021-01-01T14:30:00Z',
				label: 'January 1st, 2021. 14:30UTC',
			},
			{
				value: '2021-02-01T14:30:00Z',
				label: 'February 1st, 2021. 14:30UTC',
			},
			{
				value: '2021-03-01T14:30:00Z',
				label: 'March 1st, 2021. 14:30UTC',
			},
		],
	},
	{
		id: 'date',
		type: 'date',
		label: 'Date',
		description: 'Help for date.',
	},
	{
		id: 'dateWithElements',
		type: 'date',
		label: 'Date (with elements)',
		description: 'Help for date with elements.',
		elements: [
			{ value: '2021-01-01', label: 'January 1st, 2021' },
			{ value: '2021-02-01', label: 'February 1st, 2021' },
			{ value: '2021-03-01', label: 'March 1st, 2021' },
		],
	},
	{
		id: 'email',
		type: 'email',
		label: 'Email',
		description: 'Help for email.',
	},
	{
		id: 'emailWithElements',
		type: 'email',
		label: 'Email (with elements)',
		description: 'Help for email with elements.',
		elements: [
			{ value: 'john@example.com', label: 'John Doe' },
			{ value: 'jane@example.com', label: 'Jane Doe' },
			{ value: 'bob@example.com', label: 'Bob Smith' },
		],
		setValue: ( { value } ) => ( {
			emailWithElements: value,
		} ),
	},
	{
		id: 'telephone',
		type: 'telephone',
		label: 'Telephone',
		description: 'Help for telephone.',
	},
	{
		id: 'telephoneWithElements',
		type: 'telephone',
		label: 'Telephone (with elements)',
		description: 'Help for telephone with elements.',
		elements: [
			{ value: '+1-555-123-4567', label: '+1-555-123-4567' },
			{ value: '+44-20-7946-0958', label: '+44-20-7946-0958' },
			{ value: '+81-3-1234-5678', label: '+81-3-1234-5678' },
		],
	},
	{
		id: 'url',
		type: 'url',
		label: 'URL',
		description: 'Help for URL.',
	},
	{
		id: 'urlWithElements',
		type: 'url',
		label: 'URL (with elements)',
		description: 'Help for URL with elements.',
		elements: [
			{ value: 'https://example.com', label: 'https://example.com' },
			{ value: 'https://wordpress.org', label: 'https://wordpress.org' },
			{ value: 'https://github.com', label: 'https://github.com' },
		],
	},
	{
		id: 'color',
		type: 'color',
		label: 'Color',
		description:
			'Help for color. Supports hex, rgb, hsl formats with alpha channel.',
	},
	{
		id: 'colorWithElements',
		type: 'color',
		label: 'Color (with elements)',
		description: 'Help for color with predefined color options.',
		elements: [
			{ value: '#ff0000', label: 'Red' },
			{ value: '#00ff00', label: 'Green' },
			{ value: '#0000ff', label: 'Blue' },
			{ value: 'rgba(255, 165, 0, 0.8)', label: 'Orange (80% opacity)' },
			{ value: 'hsl(300, 100%, 50%)', label: 'Magenta' },
			{
				value: 'hsla(120, 100%, 25%, 0.6)',
				label: 'Dark Green (60% opacity)',
			},
		],
	},
	{
		id: 'password',
		type: 'password',
		label: 'Password',
		description: 'Help for password.',
	},
	{
		id: 'passwordWithElements',
		type: 'password',
		label: 'Password (with elements)',
		description: 'Help for password with elements.',
		elements: [
			{ value: 'secretpassword123', label: 'Secret Password' },
			{ value: 'adminpass456', label: 'Admin Password' },
			{ value: 'userpass789', label: 'User Password' },
		],
	},
	{
		id: 'media',
		type: 'media',
		label: 'Media',
		description: 'Help for media.',
		render: ( { item } ) => {
			return (
				<img src={ item.media } alt="" style={ { width: '100%' } } />
			);
		},
	},
	{
		id: 'mediaWithElements',
		type: 'media',
		label: 'Media (with elements)',
		description: 'Help for media with elements.',
		elements: [
			{
				value: 'https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg',
				label: 'Moon',
			},
			{
				value: 'https://live.staticflickr.com/8151/7651156426_e047f4d219_z.jpg',
				label: 'Mars',
			},
			{
				value: 'https://live.staticflickr.com/3762/9460163562_964fe6af07_z.jpg',
				label: 'Earth',
			},
		],
		render: ( { item } ) => {
			return (
				<img
					src={ item.mediaWithElements }
					alt=""
					style={ { width: '100%' } }
				/>
			);
		},
	},
	{
		id: 'array',
		type: 'array',
		label: 'Array',
		description: 'Help for array.',
	},
	{
		id: 'arrayWithElements',
		type: 'array',
		label: 'Array (with elements)',
		description: 'Help for array with elements.',
		elements: [
			{ value: 'item1', label: 'Item 1' },
			{ value: 'item2', label: 'Item 2' },
			{ value: 'item3', label: 'Item 3' },
		],
	},
	{
		id: 'notype',
		label: 'No type',
		description: 'Help for notype.',
	},
	{
		id: 'notypeWithElements',
		label: 'No type (with elements)',
		description: 'Help for notype with elements.',
		elements: [
			{ value: 'item1', label: 'Item 1' },
			{ value: 'item2', label: 'Item 2' },
			{ value: 'item3', label: 'Item 3' },
		],
	},
	{
		id: 'priceWithPrefix',
		label: 'Text with Prefix',
		type: 'text',
		description: 'Text field with dollar sign prefix.',
		Edit: {
			control: 'text',
			prefix: DollarPrefix,
		},
	},
	{
		id: 'ratingWithIcon',
		label: 'Text with Icon Prefix',
		type: 'text',
		description: 'Text field with star icon prefix.',
		Edit: {
			control: 'text',
			prefix: StarIconPrefix,
		},
	},
	{
		id: 'percentageWithSuffix',
		label: 'Text with Suffix',
		type: 'text',
		description: 'Text field with percent sign suffix.',
		Edit: {
			control: 'text',
			suffix: PercentSuffix,
		},
	},
	{
		id: 'priceWithBoth',
		label: 'Text with Prefix and Suffix',
		type: 'text',
		description: 'Text field with both dollar prefix and USD suffix.',
		Edit: {
			control: 'text',
			prefix: DollarPrefix,
			suffix: USDSuffix,
		},
	},
];

type PanelTypes = 'regular' | 'panel';
type ControlTypes =
	| 'default'
	| 'array'
	| 'checkbox'
	| 'color'
	| 'date'
	| 'datetime'
	| 'email'
	| 'integer'
	| 'number'
	| 'password'
	| 'radio'
	| 'select'
	| 'telephone'
	| 'url'
	| 'text'
	| 'toggle'
	| 'toggleGroup';

interface FieldTypeStoryProps {
	fields: Field< DataType >[];
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
}

const FieldTypeStory = ( {
	fields: _fields,
	type,
	Edit,
	asyncElements,
}: FieldTypeStoryProps ) => {
	const storyFields = useMemo( () => {
		let fieldsToProcess = _fields;

		if ( Edit !== 'default' ) {
			fieldsToProcess = _fields.map( ( field: Field< DataType > ) => ( {
				...field,
				Edit,
			} ) );
		}

		if ( asyncElements ) {
			fieldsToProcess = fieldsToProcess.map( ( field ) => {
				if ( field.elements ) {
					const elements = field.elements;
					return {
						...field,
						elements: undefined,
						getElements: () =>
							new Promise( ( resolve ) =>
								setTimeout( () => resolve( elements ), 3500 )
							),
					};
				}
				return field;
			} );
		}

		return fieldsToProcess;
	}, [ _fields, Edit, asyncElements ] );
	const form = useMemo(
		() => ( {
			layout: { type },
			fields: storyFields.map( ( field ) => field.id ),
		} ),
		[ type, storyFields ]
	) as Form;

	const [ view, setView ] = useState< View >( {
		type: 'table' as const,
		search: '',
		page: 1,
		perPage: 10,
		layout: {},
		filters: [],
		fields: storyFields.map( ( field ) => field.id ),
	} );

	const [ selectedIds, setSelectedIds ] = useState< number[] >( [] );
	const [ modifiedData, setModifiedData ] = useState< DataType[] >( data );

	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( modifiedData, view, storyFields );
	}, [ modifiedData, view, storyFields ] );

	const selectedItem =
		( selectedIds.length === 1 &&
			shownData.find( ( item ) => item.id === selectedIds[ 0 ] ) ) ||
		null;

	return (
		<HStack alignment="stretch">
			<div style={ { flex: 2 } }>
				<DataViews
					getItemId={ ( item ) => item.id.toString() }
					data={ shownData }
					paginationInfo={ paginationInfo }
					view={ view }
					fields={ storyFields }
					onChangeView={ setView }
					actions={ [
						{
							id: 'edit',
							label: 'Edit',
							callback: () => {},
							disabled: true,
							supportsBulk: true,
						},
					] }
					defaultLayouts={ {
						table: {},
					} }
					selection={ selectedIds.map( ( id ) => id.toString() ) }
					onChangeSelection={ ( newSelection ) =>
						setSelectedIds(
							newSelection.map( ( id ) => parseInt( id, 10 ) )
						)
					}
				/>
			</div>
			{ selectedItem ? (
				<VStack alignment="top">
					<DataForm
						data={ selectedItem }
						form={ form }
						fields={ storyFields }
						onChange={ ( updatedValues ) => {
							const updatedItem = {
								...selectedItem,
								...updatedValues,
							};

							setModifiedData(
								modifiedData.map( ( item ) =>
									item.id === selectedItem.id
										? updatedItem
										: item
								)
							);
						} }
					/>
				</VStack>
			) : (
				<VStack alignment="center">
					<span
						style={ {
							color: '#888',
						} }
					>
						Please, select a single item.
					</span>
				</VStack>
			) }
		</HStack>
	);
};

export const AllComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	return (
		<FieldTypeStory
			fields={ fields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
AllComponent.storyName = 'All types';

export const TextComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const textFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'text' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ textFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
TextComponent.storyName = 'text';

export const IntegerComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const integerFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'integer' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ integerFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
IntegerComponent.storyName = 'integer';

export const NumberComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const numberFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'number' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ numberFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
NumberComponent.storyName = 'number';

export const BooleanComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const booleanFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'boolean' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ booleanFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
BooleanComponent.storyName = 'boolean';

export const DateTimeComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const datetimeFields = fields.filter( ( field ) =>
		field.id.startsWith( 'datetime' )
	);

	return (
		<FieldTypeStory
			fields={ datetimeFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
DateTimeComponent.storyName = 'datetime';

export const DateComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const dateFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'date' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ dateFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
DateComponent.storyName = 'date';

export const EmailComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const emailFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'email' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ emailFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
EmailComponent.storyName = 'email';

export const TelephoneComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const telephoneFields = fields.filter( ( field ) =>
		field.id.startsWith( 'telephone' )
	);

	return (
		<FieldTypeStory
			fields={ telephoneFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
TelephoneComponent.storyName = 'telephone';

export const UrlComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const urlFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'url' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ urlFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
UrlComponent.storyName = 'url';

export const ColorComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const colorFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'color' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ colorFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
ColorComponent.storyName = 'color';

export const MediaComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const mediaFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'media' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ mediaFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
MediaComponent.storyName = 'media';

export const ArrayComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const arrayTextFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'array' ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ arrayTextFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
ArrayComponent.storyName = 'array';

export const PasswordComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const passwordFields = fields.filter( ( field ) =>
		field.id.startsWith( 'password' )
	);

	return (
		<FieldTypeStory
			fields={ passwordFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
PasswordComponent.storyName = 'password';

export const NoTypeComponent = ( {
	type,
	Edit,
	asyncElements,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
	asyncElements: boolean;
} ) => {
	const noTypeFields = useMemo(
		() => fields.filter( ( field ) => field.type === undefined ),
		[]
	);

	return (
		<FieldTypeStory
			fields={ noTypeFields }
			type={ type }
			Edit={ Edit }
			asyncElements={ asyncElements }
		/>
	);
};
NoTypeComponent.storyName = 'No type';
