/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { chevronUpDown } from '@wordpress/icons';
import { Button, ToolbarItem } from '@wordpress/components';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { DocumentTools: EditorDocumentTools } = unlock( editorPrivateApis );

export default function DocumentTools( {
	blockEditorMode,
	hasFixedToolbar,
	isDistractionFree,
} ) {
	const { isVisualMode } = useSelect( ( select ) => {
		const { getEditorMode } = select( editorStore );

		return {
			isVisualMode: getEditorMode() === 'visual',
		};
	}, [] );
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );
	const { setDeviceType } = useDispatch( editorStore );
	const isLargeViewport = useViewportMatch( 'medium' );
	const isZoomedOutViewExperimentEnabled =
		window?.__experimentalEnableZoomedOutView && isVisualMode;
	const isZoomedOutView = blockEditorMode === 'zoom-out';

	return (
		<EditorDocumentTools
			disableBlockTools={ ! isVisualMode }
			listViewLabel={ __( 'List View' ) }
		>
			{ isZoomedOutViewExperimentEnabled &&
				isLargeViewport &&
				! isDistractionFree &&
				! hasFixedToolbar && (
					<ToolbarItem
						as={ Button }
						className="edit-site-header-edit-mode__zoom-out-view-toggle"
						icon={ chevronUpDown }
						isPressed={ isZoomedOutView }
						/* translators: button label text should, if possible, be under 16 characters. */
						label={ __( 'Zoom-out View' ) }
						onClick={ () => {
							setDeviceType( 'Desktop' );
							__unstableSetEditorMode(
								isZoomedOutView ? 'edit' : 'zoom-out'
							);
						} }
						size="compact"
					/>
				) }
		</EditorDocumentTools>
	);
}
