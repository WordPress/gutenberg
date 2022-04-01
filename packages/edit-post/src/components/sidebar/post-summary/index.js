/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PostFeaturedImageCheck,
	PostFeaturedImage2 as PostFeaturedImage,
	PostExcerptCheck,
	PostExcerpt2 as PostExcerpt,
	PostAuthor,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostTitle from '../post-title';
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-summary';

function PostSummary() {
	// TODO: check about the below logic and the preferences panels...

	const { isRemoved, isOpened } = useSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was programatically removed. We do
		// not use isEditorPanelEnabled since this panel should not be disabled through the UI.
		const { isEditorPanelRemoved, isEditorPanelOpened } = select(
			editPostStore
		);
		return {
			isRemoved: isEditorPanelRemoved( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
		};
	}, [] );
	const { toggleEditorPanelOpened } = useDispatch( editPostStore );

	if ( isRemoved ) {
		return null;
	}
	return (
		<PanelBody
			className="edit-post-post-summary"
			title={ __( 'Summary' ) }
			opened={ isOpened }
			onToggle={ () => toggleEditorPanelOpened( PANEL_NAME ) }
		>
			<PostFeaturedImageCheck>
				<PostFeaturedImage />
			</PostFeaturedImageCheck>
			<PanelRow>
				<PostTitle />
			</PanelRow>
			{ /* Todo: I need to check/consolidate with panels preferences */ }
			<PostExcerptCheck>
				<PanelRow>
					<PostExcerpt />
				</PanelRow>
			</PostExcerptCheck>
			<PanelRow>
				<PostAuthor labelPosition="side" />
			</PanelRow>
		</PanelBody>
	);
}

export default PostSummary;
