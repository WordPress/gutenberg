/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
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
		const text = item.content?.rendered?.replace( /<[^>]+>/g, '' ) || '';
		const truncated =
			text.length > 120 ? text.substring( 0, 120 ) + '...' : text;
		return <span>{ truncated }</span>;
	},
};

/**
 * Post field — displays the title of the post the comment is on.
 * Uses the `post` field (post ID) from the comment entity.
 */
export const postField: Field< CommentWithPermissions > = {
	id: 'post',
	label: __( 'In Response To' ),
	type: 'integer',
	enableSorting: false,
	render: ( { item } ) => {
		// The post ID is available; a richer implementation would resolve the post title.
		// For now, display a link placeholder with the post ID.
		return <span>{ `Post #${ item.post }` }</span>;
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
