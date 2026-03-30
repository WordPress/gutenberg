/**
 * WordPress dependencies
 */
import { useSearch } from '@wordpress/route';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { CommentWithPermissions } from './types';
import { COMMENT_STATUSES } from './types';

const STATUS_LABELS: Record< string, string > = {
	[ COMMENT_STATUSES.APPROVE ]: __( 'Approved' ),
	[ COMMENT_STATUSES.HOLD ]: __( 'Pending' ),
	[ COMMENT_STATUSES.SPAM ]: __( 'Spam' ),
	[ COMMENT_STATUSES.TRASH ]: __( 'Trash' ),
};

function CommentInspector() {
	const searchParams = useSearch( { from: '/$status' } );
	const commentIds = useMemo(
		() => searchParams.commentIds ?? [],
		[ searchParams.commentIds ]
	);

	const { comment, postTitle } = useSelect(
		( select ) => {
			if ( commentIds.length !== 1 ) {
				return { comment: null, postTitle: null };
			}
			const commentRecord = select( coreStore ).getEntityRecord(
				'root',
				'comment',
				Number( commentIds[ 0 ] )
			) as CommentWithPermissions | undefined;

			let resolvedPostTitle = null;
			if ( commentRecord?.post ) {
				const post = select( coreStore ).getEntityRecord(
					'postType',
					'post',
					commentRecord.post,
					{ _fields: 'title' }
				);
				resolvedPostTitle = (
					post as { title?: { rendered?: string } }
				 )?.title?.rendered;
			}

			return { comment: commentRecord, postTitle: resolvedPostTitle };
		},
		[ commentIds ]
	);

	if ( ! comment ) {
		return (
			<VStack spacing="4" style={ { padding: '16px' } }>
				<Text>
					{ commentIds.length === 0
						? __( 'Select a comment to view details.' )
						: __( 'Select a single comment to view details.' ) }
				</Text>
			</VStack>
		);
	}

	const dateFormat = getSettings().formats.datetime;
	const commentDate = getDate( comment.date );
	const avatarUrl =
		comment.author_avatar_urls?.[ '96' ] ||
		comment.author_avatar_urls?.[ '48' ];

	return (
		<VStack spacing="4" style={ { padding: '16px' } }>
			{ /* Author section */ }
			<HStack alignment="top" spacing="3">
				{ avatarUrl && (
					<img
						src={ avatarUrl }
						alt=""
						width={ 48 }
						height={ 48 }
						style={ { borderRadius: '50%', flexShrink: 0 } }
					/>
				) }
				<VStack spacing="1">
					<Heading level={ 4 }>
						{ comment.author_name || __( 'Anonymous' ) }
					</Heading>
					{ comment.author_email && (
						<Text variant="muted">{ comment.author_email }</Text>
					) }
					{ comment.author_url && (
						<Text variant="muted">{ comment.author_url }</Text>
					) }
				</VStack>
			</HStack>

			{ /* Status */ }
			<HStack>
				<Text weight="bold">{ __( 'Status:' ) }</Text>
				<Text>
					{ STATUS_LABELS[ comment.status ] || comment.status }
				</Text>
			</HStack>

			{ /* Date */ }
			<HStack>
				<Text weight="bold">{ __( 'Date:' ) }</Text>
				<Text>
					<time dateTime={ comment.date }>
						{ dateI18n( dateFormat, commentDate ) }
					</time>
				</Text>
			</HStack>

			{ /* Post reference */ }
			<HStack>
				<Text weight="bold">{ __( 'Post:' ) }</Text>
				<Text>{ postTitle || `Post #${ comment.post }` }</Text>
			</HStack>

			{ /* Comment content */ }
			<VStack spacing="2">
				<Heading level={ 5 }>{ __( 'Comment' ) }</Heading>
				<div
					dangerouslySetInnerHTML={ {
						__html: comment.content?.rendered || '',
					} }
					style={ {
						padding: '12px',
						background: '#f0f0f0',
						borderRadius: '4px',
						lineHeight: 1.6,
					} }
				/>
			</VStack>

			{ /* View comment link */ }
			{ comment.link && (
				<a
					href={ comment.link }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'View Comment' ) }
				</a>
			) }

			{ /* Author IP */ }
			{ comment.author_ip && (
				<HStack>
					<Text weight="bold">{ __( 'IP Address:' ) }</Text>
					<Text variant="muted">{ comment.author_ip }</Text>
				</HStack>
			) }
		</VStack>
	);
}

export const inspector = CommentInspector;
