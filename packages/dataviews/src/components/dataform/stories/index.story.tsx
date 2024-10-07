/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { CombinedFormField } from '../../../types';

const meta = {
	title: 'DataViews/DataForm',
	component: DataForm,
	argTypes: {
		type: {
			control: { type: 'select' },
			description:
				'Chooses the layout of the form. "regular" is the default layout.',
			options: [ 'regular', 'panel' ],
		},
	},
};
export default meta;

const fields = [
	{
		id: 'title',
		label: 'Title',
		type: 'text' as const,
	},
	{
		id: 'order',
		label: 'Order',
		type: 'integer' as const,
	},
	{
		id: 'date',
		label: 'Date',
		type: 'datetime' as const,
	},
	{
		id: 'birthdate',
		label: 'Date as options',
		type: 'datetime' as const,
		elements: [
			{ value: '1970-02-23T12:00:00', label: "Jane's birth date" },
			{ value: '1950-02-23T12:00:00', label: "John's birth date" },
		],
	},
	{
		id: 'author',
		label: 'Author',
		type: 'integer' as const,
		elements: [
			{ value: 1, label: 'Jane' },
			{ value: 2, label: 'John' },
		],
	},
	{
		id: 'reviewer',
		label: 'Reviewer',
		type: 'text' as const,
		Edit: 'radio' as const,
		elements: [
			{ value: 'fulano', label: 'Fulano' },
			{ value: 'mengano', label: 'Mengano' },
			{ value: 'zutano', label: 'Zutano' },
		],
	},
	{
		id: 'status',
		label: 'Status',
		type: 'text' as const,
		elements: [
			{ value: 'draft', label: 'Draft' },
			{ value: 'published', label: 'Published' },
		],
	},
	{
		id: 'password',
		label: 'Password',
		type: 'text' as const,
	},
];

export const Default = ( { type }: { type: 'panel' | 'regular' } ) => {
	const [ post, setPost ] = useState( {
		title: 'Hello, World!',
		order: 2,
		author: 1,
		status: 'draft',
		reviewer: 'fulano',
		date: '2021-01-01T12:00:00',
		birthdate: '1950-02-23T12:00:00',
	} );

	const form = {
		fields: [
			'title',
			'order',
			'author',
			'reviewer',
			'status',
			'date',
			'birthdate',
		],
	};

	return (
		<DataForm
			data={ post }
			fields={ fields }
			form={ {
				...form,
				type,
			} }
			onChange={ ( edits ) =>
				setPost( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

const CombinedFieldsComponent = ( {
	type = 'regular',
	combinedFieldDirection = 'vertical',
}: {
	type: 'panel' | 'regular';
	combinedFieldDirection: 'vertical' | 'horizontal';
} ) => {
	const [ post, setPost ] = useState( {
		title: 'Hello, World!',
		order: 2,
		author: 1,
		status: 'draft',
	} );

	const form = {
		fields: [ 'title', 'status_and_visibility', 'order', 'author' ],
		combinedFields: [
			{
				id: 'status_and_visibility',
				label: 'Status & Visibility',
				children: [ 'status', 'password' ],
				direction: combinedFieldDirection,
				render: ( { item } ) => item.status,
			},
		] as CombinedFormField< any >[],
	};

	return (
		<DataForm
			data={ post }
			fields={ fields }
			form={ {
				...form,
				type,
			} }
			onChange={ ( edits ) =>
				setPost( ( prev ) => ( {
					...prev,
					...edits,
				} ) )
			}
		/>
	);
};

export const CombinedFields = {
	title: 'DataViews/CombinedFields',
	render: CombinedFieldsComponent,
	argTypes: {
		...meta.argTypes,
		combinedFieldDirection: {
			control: { type: 'select' },
			description:
				'Chooses the direction of the combined field. "vertical" is the default layout.',
			options: [ 'vertical', 'horizontal' ],
		},
	},
};
