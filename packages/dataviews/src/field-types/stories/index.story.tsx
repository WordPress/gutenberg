/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import DataViews from '../../components/dataviews/index';
import DataForm from '../../components/dataform/index';
import { filterSortAndPaginate } from '../../filter-and-sort-data-view';
import type { View, Form, Field } from '../../types';

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
				'boolean',
				'checkbox',
				'date',
				'datetime',
				'email',
				'integer',
				'radio',
				'select',
				'text',
				'toggleGroup',
			],
		},
	},
	args: {
		type: 'regular',
		Edit: 'default',
	},
};
export default meta;

type DataType = {
	id: number;
	text: string;
	textWithElements: string;
	integer: number;
	integerWithElements: number;
	boolean: boolean;
	booleanWithElements: boolean;
	datetime: string;
	datetimeWithElements: string;
	date: string;
	dateWithElements: string;
	email: string;
	emailWithElements: string;
	media: string;
	mediaWithElements: string;
	array: string[];
	arrayWithElements: string[];
	notype: string;
	notypeWithElements: string;
};

const data: DataType[] = [
	{
		id: 1,
		text: 'Text',
		textWithElements: 'Item 1',
		integer: 1,
		integerWithElements: 1,
		boolean: true,
		booleanWithElements: true,
		datetime: '2021-01-01T14:30:00Z',
		datetimeWithElements: '2021-01-01T14:30:00Z',
		date: '2021-01-01',
		dateWithElements: '2021-01-01',
		email: 'hi@example.com',
		emailWithElements: 'hi@example.com',
		media: 'https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg',
		mediaWithElements:
			'https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg',
		array: [ 'item1', 'item2', 'item3' ],
		arrayWithElements: [ 'item1', 'item2', 'item3' ],
		notype: 'No type',
		notypeWithElements: 'No type',
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
	},
	{
		id: 'boolean',
		type: 'boolean',
		label: 'Boolean',
		description: 'Help for boolean.',
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
];

type PanelTypes = 'regular' | 'panel';
type ControlTypes =
	| 'default'
	| 'array'
	| 'boolean'
	| 'checkbox'
	| 'date'
	| 'datetime'
	| 'email'
	| 'integer'
	| 'radio'
	| 'select'
	| 'text'
	| 'toggleGroup';

interface FieldTypeStoryProps {
	fields: Field< DataType >[];
	type: PanelTypes;
	Edit: ControlTypes;
}

const FieldTypeStory = ( {
	fields: _fields,
	type,
	Edit,
}: FieldTypeStoryProps ) => {
	const storyFields = useMemo( () => {
		if ( Edit === 'default' ) {
			return _fields;
		}

		return _fields.map( ( field: Field< DataType > ) => ( {
			...field,
			Edit,
		} ) );
	}, [ _fields, Edit ] );
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

export const All = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	return <FieldTypeStory fields={ fields } type={ type } Edit={ Edit } />;
};

export const Text = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const textFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'text' ),
		[]
	);

	return <FieldTypeStory fields={ textFields } type={ type } Edit={ Edit } />;
};

export const Integer = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const integerFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'integer' ),
		[]
	);

	return (
		<FieldTypeStory fields={ integerFields } type={ type } Edit={ Edit } />
	);
};

export const Boolean = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const booleanFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'boolean' ),
		[]
	);

	return (
		<FieldTypeStory fields={ booleanFields } type={ type } Edit={ Edit } />
	);
};

export const DateTime = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const dateTimeFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'datetime' ),
		[]
	);

	return (
		<FieldTypeStory fields={ dateTimeFields } type={ type } Edit={ Edit } />
	);
};

export const Date = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const dateFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'date' ),
		[]
	);

	return <FieldTypeStory fields={ dateFields } type={ type } Edit={ Edit } />;
};

export const Email = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const emailFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'email' ),
		[]
	);

	return (
		<FieldTypeStory fields={ emailFields } type={ type } Edit={ Edit } />
	);
};

export const Media = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const mediaFields = useMemo(
		() => fields.filter( ( field ) => field.type === 'media' ),
		[]
	);

	return (
		<FieldTypeStory fields={ mediaFields } type={ type } Edit={ Edit } />
	);
};

export const Array = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
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
		/>
	);
};

export const NoType = ( {
	type,
	Edit,
}: {
	type: PanelTypes;
	Edit: ControlTypes;
} ) => {
	const noTypeFields = useMemo(
		() => fields.filter( ( field ) => field.type === undefined ),
		[]
	);

	return (
		<FieldTypeStory fields={ noTypeFields } type={ type } Edit={ Edit } />
	);
};
