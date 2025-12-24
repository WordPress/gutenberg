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
	{
		id: 'metadata_summary',
		label: 'Metadata',
		type: 'text',
		render: ( { item } ) => {
			return (
				<span>
					<>Metadata</>
					{ item.filesize ? `, ${ item.filesize } KB` : '' }
				</span>
			);
		},
	},
];

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
		layout: { type: 'card' },
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

export default LayoutMixedComponent;
