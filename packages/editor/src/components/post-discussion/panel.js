/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostTypeSupportCheck from '../post-type-support-check';
import PostComments from '../post-comments';
import PostPingbacks from '../post-pingbacks';

const PANEL_NAME = 'discussion-panel';

function PostDiscussionPanel() {
	const { isEnabled, isOpened } = useSelect( ( select ) => {
		const { isEditorPanelEnabled, isEditorPanelOpened } =
			select( editorStore );
		return {
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
		};
	}, [] );

	const { toggleEditorPanelOpened } = useDispatch( editorStore );

	if ( ! isEnabled ) {
		return null;
	}

	return (
		<PostTypeSupportCheck supportKeys={ [ 'comments', 'trackbacks' ] }>
			<PanelBody
				title={ __( 'Discussion' ) }
				opened={ isOpened }
				onToggle={ () => toggleEditorPanelOpened( PANEL_NAME ) }
			>
				<PostTypeSupportCheck supportKeys="comments">
					<PanelRow>
						<PostComments />
					</PanelRow>
				</PostTypeSupportCheck>

				<PostTypeSupportCheck supportKeys="trackbacks">
					<PanelRow>
						<PostPingbacks />
					</PanelRow>
				</PostTypeSupportCheck>
			</PanelBody>
		</PostTypeSupportCheck>
	);
}

export default PostDiscussionPanel;
