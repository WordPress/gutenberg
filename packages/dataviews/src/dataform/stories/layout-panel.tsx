/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type {
	CardLayout,
	Field,
	Form,
	Layout,
	PanelLayout,
	RegularLayout,
} from '../../types';

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

export default LayoutPanelComponent;
