/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field, Form } from '../../types';

type SamplePost = {
	author: number;
	title: string;
	status: string;
	origin?: string;
	destination?: string;
};

const fields: Field< SamplePost >[] = [
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
		id: 'title',
		label: 'Title',
		type: 'text',
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
		id: 'origin',
		label: 'Origin',
		type: 'text',
	},
	{
		id: 'destination',
		label: 'Destination',
		type: 'text',
	},
];

const LayoutMixedComponent = () => {
	const [ post, setPost ] = useState< SamplePost >( {
		author: 1,
		title: 'Hello, World!',
		status: 'draft',
		origin: 'New York (JFK)',
		destination: 'Los Angeles (LAX)',
	} );

	const form: Form = {
		fields: [
			{
				id: 'card',
				layout: {
					type: 'card',
				},
				children: [
					{
						id: 'author',
						layout: { type: 'regular', labelPosition: 'none' },
					},
					{
						id: 'title',
						layout: { type: 'panel' },
					},
					{
						id: 'status',
						layout: { type: 'panel' },
					},
				],
			},
			{
				id: 'card-with-row',
				layout: {
					type: 'card',
				},
				children: [
					{
						id: 'row-within-card',
						layout: { type: 'row' },
						children: [ 'origin', 'destination' ],
					},
				],
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

export default LayoutMixedComponent;
