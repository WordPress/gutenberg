/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { external } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostViewLink() {
	const { hasLoaded, permalink, isPublished, label, showIconLabels } =
		useSelect( ( select ) => {
			// Grab post type to retrieve the view_item label.
			const postTypeSlug = select( editorStore ).getCurrentPostType();
			const postType = select( coreStore ).getPostType( postTypeSlug );
			const { get } = select( preferencesStore );

			return {
				permalink: select( editorStore ).getPermalink(),
				isPublished: select( editorStore ).isCurrentPostPublished(),
				label: postType?.labels.view_item,
				hasLoaded: !! postType,
				showIconLabels: get( 'core', 'showIconLabels' ),
			};
		}, [] );

	// Only render the view button if the post is published and has a permalink.
	if ( ! isPublished || ! permalink || ! hasLoaded ) {
		return null;
	}

	return (
		<Button
			icon={ external }
			label={ label || __( 'View post' ) }
			href={ permalink }
			target="_blank"
			showTooltip={ ! showIconLabels }
			size="compact"
		/>
	);
}
