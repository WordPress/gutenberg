/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect, resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { CommentWithPermissions } from './types';
import { COMMENT_STATUSES } from './types';

/**
 * Author name field — displays the comment author's name.
 */
export const authorNameField: Field< CommentWithPermissions > = {
	id: 'author_name',
	label: __( 'Author' ),
	type: 'text',
	enableGlobalSearch: true,
	render: ( { item } ) => {
		const avatarUrl =
			item.author_avatar_urls?.[ '48' ] ||
			item.author_avatar_urls?.[ '24' ];
		return (
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
				} }
			>
				{ avatarUrl && (
					<img
						src={ avatarUrl }
						alt=""
						width={ 24 }
						height={ 24 }
						style={ { borderRadius: '50%' } }
					/>
				) }
				<span>{ item.author_name || __( 'Anonymous' ) }</span>
			</div>
		);
	},
};

/**
 * Comment content field — displays a truncated preview of the comment.
 */
export const contentField: Field< CommentWithPermissions > = {
	id: 'content',
	label: __( 'Comment' ),
	type: 'text',
	enableGlobalSearch: true,
	enableSorting: false,
	render: ( { item } ) => {
		const stripped =
			item.content?.rendered?.replace( /<[^>]+>/g, '' ) || '';
		const text = decodeEntities( stripped );
		const truncated =
			text.length > 120 ? text.substring( 0, 120 ) + '...' : text;
		return <span>{ truncated }</span>;
	},
};

function PostFieldView( { item }: { item: CommentWithPermissions } ) {
	const postTitle = useSelect(
		( select ) => {
			if ( ! item.post ) {
				return null;
			}
			const post = select( coreStore ).getEntityRecord(
				'postType',
				'post',
				item.post,
				{ _fields: 'title' }
			);
			return ( post as { title?: { rendered?: string } } )?.title
				?.rendered;
		},
		[ item.post ]
	);

	if ( ! item.post ) {
		return <span>{ __( '(No post)' ) }</span>;
	}

	return <span>{ postTitle || `Post #${ item.post }` }</span>;
}

/**
 * Post field — displays the title of the post the comment is on.
 */
export const postField: Field< CommentWithPermissions > = {
	id: 'post',
	label: __( 'Post' ),
	type: 'integer',
	enableSorting: false,
	render: PostFieldView,
	getElements: async () => {
		const posts =
			( await resolveSelect( coreStore ).getEntityRecords(
				'postType',
				'post',
				{
					per_page: 100,
					_fields: 'id,title',
					orderby: 'title',
					order: 'asc',
					status: 'publish',
				}
			) ) ?? [];
		return ( posts as { id: number; title: { rendered: string } }[] ).map(
			( { id, title } ) => ( {
				value: id,
				label: decodeEntities( title.rendered ) || `Post #${ id }`,
			} )
		);
	},
	filterBy: {
		operators: [ 'is' ],
	},
};

/**
 * Date field — displays the comment date.
 */
export const dateField: Field< CommentWithPermissions > = {
	id: 'date',
	label: __( 'Date' ),
	type: 'datetime',
	render: ( { item } ) => {
		const dateFormat = getSettings().formats.date;
		const commentDate = getDate( item.date );
		return (
			<time dateTime={ item.date }>
				{ dateI18n( dateFormat, commentDate ) }
			</time>
		);
	},
	filterBy: {
		operators: [ 'before', 'after' ],
	},
};

/**
 * Status field — displays the comment status as a label.
 */
export const statusField: Field< CommentWithPermissions > = {
	id: 'status',
	label: __( 'Status' ),
	type: 'text',
	enableSorting: false,
	elements: [
		{ value: COMMENT_STATUSES.APPROVE, label: __( 'Approved' ) },
		{ value: COMMENT_STATUSES.HOLD, label: __( 'Pending' ) },
		{ value: COMMENT_STATUSES.SPAM, label: __( 'Spam' ) },
		{ value: COMMENT_STATUSES.TRASH, label: __( 'Trash' ) },
	],
	filterBy: {
		operators: [ 'is' ],
	},
};
