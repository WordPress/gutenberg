/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PostAuthor, PostTypeSupportCheck } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import PostTitle from '../post-title';
import FeaturedImage from '../featured-image';
import PostExcerpt from '../post-excerpt';
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-summary';

function PostSummary() {
	const isOpened = useSelect(
		( select ) => select( editPostStore ).isEditorPanelOpened( PANEL_NAME ),
		[]
	);
	const { toggleEditorPanelOpened } = useDispatch( editPostStore );
	return (
		<PanelBody
			className="edit-post-post-summary"
			title={ __( 'Summary' ) }
			opened={ isOpened }
			onToggle={ () => toggleEditorPanelOpened( PANEL_NAME ) }
		>
			<FeaturedImage />
			<PostTypeSupportCheck supportKeys="title">
				<PanelRow>
					<PostTitle />
				</PanelRow>
			</PostTypeSupportCheck>
			<PostExcerpt isMinimal />
			<PostTypeSupportCheck supportKeys="author">
				<PanelRow>
					<PostAuthor labelPosition="side" />
				</PanelRow>
			</PostTypeSupportCheck>
		</PanelBody>
	);
}

export default PostSummary;
