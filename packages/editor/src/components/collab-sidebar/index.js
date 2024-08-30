/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-imports
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { comment as commentIcon } from '@wordpress/icons';

import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { collabSidebarName } from './constants';
import { Comments } from './comments';
import { AddComment } from './add-comment';

const isBlockCommentExperimentEnabled =
	window?.__experimentalEnableBlockComment;
const modifyBlockCommentAttributes = ( settings, name ) => {
 		if (
			name?.includes( 'core/' ) &&
			! settings.attributes.blockCommentId
		) {
			settings.attributes = {
				...settings.attributes,
				blockCommentId: {
					type: 'number',
					default: 0,
				},
				showCommentBoard: {
					type: 'boolean',
					default: false,
				},
			};
		}

	return settings;
};

// Apply the filter to all core blocks
addFilter(
	'blocks.registerBlockType',
	'block-comment/modify-core-block-attributes',
	modifyBlockCommentAttributes
);

/**
 * Renders the Collab sidebar.
 */
export default function CollabSidebar() {
	// Check if the experimental flag is enabled.
	if ( ! isBlockCommentExperimentEnabled ) {
		return null; // or maybe return some message indicating no threads are available.
	}

	const [ threads, setThreads ] = useState( () => [] );
	const [ reloadComments, setReloadComments ] = useState( false );
	const postId = useSelect( ( select ) => {
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		return select( 'core/editor' ).getCurrentPostId();
	}, [] );

	useEffect( () => {
		if ( postId ) {
			apiFetch( {
				path:
					'/wp/v2/comments?post=' +
					postId +
					'&type=block_comment' +
					'&status=any&per_page=100',
				method: 'GET',
			} ).then( ( data ) => {
				// Create a compare to store the references to all objects by id
				const compare = {};
				const result = [];

				// Initialize each object with an empty `reply` array
				data.forEach( ( item ) => {
					compare[ item.id ] = { ...item, reply: [] };
				} );

				// Iterate over the data to build the tree structure
				data.forEach( ( item ) => {
					if ( item.parent === 0 ) {
						// If parent is 0, it's a root item, push it to the result array
						result.push( compare[ item.id ] );
					} else if (
						compare[ item.parent ] &&
						'trash' !== item.status
					) {
						// Otherwise, find its parent and push it to the parent's `reply` array
						compare[ item.parent ].reply.push( compare[ item.id ] );
					}
				} );
				const filteredComments = result.filter(
					( comment ) => comment.status !== 'trash'
				);
				setThreads(
					Array.isArray( filteredComments ) ? filteredComments : []
				);
			} );
		}
	}, [ postId, reloadComments ] );

	const resultThreads = threads.map( ( thread ) => thread ).reverse();

	return (
		<PluginSidebar
			identifier={ collabSidebarName }
			title={ __( 'Comments' ) }
			icon={ commentIcon }
		>
			<div className="editor-collab-sidebar__activities">
				<AddComment
					threads={ resultThreads }
					setReloadComments={ setReloadComments }
				/>
				<Comments threads={ resultThreads } />
			</div>
		</PluginSidebar>
	);
}
