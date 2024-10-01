/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field } from '../../../types';

type SamplePost = {
	title: string;
	order: number;
	author: number;
	status: string;
	reviewer: string;
	date: string;
	birthdate: string;
	sampleField?: string;
	password?: string;
};

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
		sampleFieldType: {
			name: 'Sample Field Type',
			control: { type: 'select' },
			description: 'Chooses the type of the sample field.',
			options: [ 'text', 'integer', 'datetime' ],
		},
		additionalSampleFieldDependency: {
			name: 'Additional Sample Field Dependency',
			control: { type: 'select' },
			description:
				'Choose an additional dependency of the sample field for visiblity.',
			options: [ 'order', 'author', 'status' ],
		},
	},
	args: {
		sampleFieldType: 'text',
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
			{ value: 'private', label: 'Private' },
		],
	},
	{
		id: 'password',
		label: 'Password',
		type: 'text' as const,
		isVisible: ( item: SamplePost ) => {
			return item.status !== 'private';
		},
		dependencies: [ 'status' ],
	},
] as Field< SamplePost >[];

export const Default = ( {
	type,
	sampleFieldType = 'text',
	additionalSampleFieldDependency,
}: {
	type: 'panel' | 'regular';
	sampleFieldType: 'text' | 'integer' | 'datetime';
	additionalSampleFieldDependency?: keyof SamplePost;
} ) => {
	const visibileFields = useMemo( () => {
		const dependencies = [ 'sampleField' ];
		if ( additionalSampleFieldDependency ) {
			dependencies.push( additionalSampleFieldDependency );
		}
		return [
			...fields,
			{
				id: 'sampleField',
				label: 'Sample Field',
				type: sampleFieldType,
				isVisible: ( item: SamplePost ) => {
					return item.order < 3 && item.sampleField !== 'hide';
				},
				dependencies,
			},
		] as Field< SamplePost >[];
	}, [ sampleFieldType, additionalSampleFieldDependency ] );
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
			'sampleField',
			'order',
			'author',
			'reviewer',
			'status',
			'password',
			'date',
			'birthdate',
		],
	};

	return (
		<DataForm< SamplePost >
			data={ post }
			fields={ visibileFields }
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
