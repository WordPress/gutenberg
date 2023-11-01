/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';
import {
	PostComments,
	PostPingbacks,
	PostTypeSupportCheck,
} from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

/**
 * Module Constants
 */
const PANEL_NAME = 'discussion-panel';

function DiscussionPanel() {
	const { isEnabled, isOpened } = useSelect( ( select ) => {
		const { isEditorPanelEnabled, isEditorPanelOpened } =
			select( editPostStore );
		return {
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
		};
	}, [] );

	const { toggleEditorPanelOpened } = useDispatch( editPostStore );

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

export default DiscussionPanel;
