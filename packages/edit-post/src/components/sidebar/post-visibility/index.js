/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	PostVisibility as PostVisibilityForm,
	PostVisibilityCheck,
	PostVisibilityLabel,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

const PANEL_NAME = 'visibility';

export function PostVisibility() {
	const { isOpened, isRemoved } = useSelect( ( select ) => {
		// We use isEditorPanelRemoved to hide the panel if it was
		// programatically removed. We don't use isEditorPanelEnabled since
		// this panel should not be disabled through the UI.
		const { isEditorPanelRemoved, isEditorPanelOpened } = select(
			editPostStore
		);

		return {
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			isRemoved: isEditorPanelRemoved( PANEL_NAME ),
		};
	}, [] );

	const { toggleEditorPanelOpened } = useDispatch( editPostStore );

	if ( isRemoved ) {
		return null;
	}

	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelBody
					initialOpen={ false }
					opened={ isOpened }
					onToggle={ () => {
						toggleEditorPanelOpened( PANEL_NAME );
					} }
					title={
						<>
							{ __( 'Visibility:' ) }
							<span className="editor-post-publish-panel__link">
								<PostVisibilityLabel />
							</span>
						</>
					}
				>
					{ ! canEdit && (
						<span>
							{ __(
								'You do not have permission to change the visibility.'
							) }
						</span>
					) }
					{ canEdit && <PostVisibilityForm showLegend={ false } /> }
				</PanelBody>
			) }
		/>
	);
}

export default PostVisibility;
