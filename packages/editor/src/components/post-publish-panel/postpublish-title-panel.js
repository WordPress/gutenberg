/**
 * WordPress dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import PostScheduleLabel from '../post-schedule/label';

function focusRef( node ) {
	node?.focus();
}

export function PostPublishTitlePanel( {
	post,
	isScheduled,
	focusOnMount,
	link,
} ) {
	const postPublishNonLinkHeader = isScheduled ? (
		<>
			{ __( 'is now scheduled. It will go live on' ) }{ ' ' }
			<PostScheduleLabel />.
		</>
	) : (
		__( 'is now live.' )
	);
	const postTitle = decodeEntities( post.title ) || __( '(no title)' );
	if ( post.type === 'wp_template' ) {
		return sprintf(
			// translators: %s: post title
			__( '%s is saved.' ),
			postTitle
		);
	}
	return (
		<>
			<ExternalLink
				ref={ focusOnMount ? focusRef : undefined }
				href={ link }
			>
				{ postTitle }
			</ExternalLink>{ ' ' }
			{ postPublishNonLinkHeader }
		</>
	);
}
