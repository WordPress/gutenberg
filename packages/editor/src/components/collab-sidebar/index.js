/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, RawHTML } from '@wordpress/element';
import {
	comment as commentIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	const postId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/editor' ).getCurrentPostId();
	}, [] );

	const [ threads, setThreads ] = useState( [] );
    const [ reloadComments, setReloadComments ] = useState( false );

	useEffect( () => {
		if ( postId ) {
			apiFetch( {
				path:
					'/wp/v2/comments?post=' +
					postId +
					'&type=block_comment' +
					'&status=any&per_page=100',
				method: 'GET',
			} ).then( ( response ) => {
				const filteredComments = response.filter(
					( comment ) => comment.status !== 'trash'
				);
				setThreads(
					Array.isArray( filteredComments ) ? filteredComments : []
				);
                setReloadComments( false );
			} );
		}
	}, [ postId, reloadComments ] );

	const { threads: selectedThreads } = useSelect( () => {
		return {
			threads,
		};
	}, [ threads ] );

	// Check if the experimental flag is enabled.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	const resultThreads = selectedThreads.map( ( thread ) => thread ).reverse();

	return (
		<PluginSidebar
			identifier={ collabSidebarName }
			title={ __( 'Comments' ) }
			icon={ commentIcon }
		>
			<div className="editor-collab-sidebar__activities">
                <AddComment threads={ resultThreads } setReloadComments={ setReloadComments } />
				<Comments threads={ resultThreads }  />
			</div>
		</PluginSidebar>
	);
}
