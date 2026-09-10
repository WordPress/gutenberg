import { addQueryArgs, getPath } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';
import type { Action } from '@wordpress/dataviews';
import type { Post } from '../types';

const viewPostRevisions: Action< Post > = {
	id: 'view-post-revisions',
	context: 'list',
	label( items ) {
		const revisionsCount =
			items[ 0 ]._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		return sprintf(
			/* translators: %d: number of revisions. */
			__( 'View revisions (%d)' ),
			revisionsCount
		);
	},
	isEligible( post ) {
		if ( post.status === 'trash' ) {
			return false;
		}
		const lastRevisionId =
			post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id ?? null;
		const revisionsCount =
			post?._links?.[ 'version-history' ]?.[ 0 ]?.count ?? 0;
		return !! lastRevisionId && revisionsCount > 1;
	},
	callback( posts, { onActionPerformed } ) {
		const post = posts[ 0 ];
		const lastRevisionId =
			post?._links?.[ 'predecessor-version' ]?.[ 0 ]?.id;
		const isSiteEditor = getPath( window.location.href )?.includes(
			'site-editor.php'
		);
		const href = isSiteEditor
			? addQueryArgs( 'site-editor.php', {
					p: `/${ post.type }/${ post.id }`,
					canvas: 'edit',
					revision: lastRevisionId,
			  } )
			: addQueryArgs( 'revision.php', {
					revision: lastRevisionId,
			  } );
		document.location.href = href;
		if ( onActionPerformed ) {
			onActionPerformed( posts );
		}
	},
};

/**
 * View post revisions action for Post.
 */
export default viewPostRevisions;
