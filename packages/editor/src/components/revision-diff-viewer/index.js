/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { RevisionDiffPanel } from './panel';
import { store as editorStore } from '../../store';

/**
 * Sidebar identifier for the revision diff viewer.
 */
export const REVISION_DIFF_VIEWER_SIDEBAR_NAME =
	'edit-post/revision-diff-viewer';

/**
 * Revision Diff Viewer Sidebar container component.
 *
 * Renders the block-aware revision diff viewer in the editor sidebar.
 *
 * @return {JSX.Element|null} The sidebar component or null
 */
function RevisionDiffViewerSidebar() {
	const { editorMode } = useSelect( ( select ) => {
		const { getEditorMode } = select( editorStore );
		return {
			editorMode: getEditorMode?.() || 'visual',
		};
	}, [] );

	// Only show in visual mode.
	if ( editorMode !== 'visual' ) {
		return null;
	}

	return (
		<PluginSidebar
			name={ REVISION_DIFF_VIEWER_SIDEBAR_NAME }
			title={ __( 'Revision Diff Viewer' ) }
			icon={ backup }
		>
			<RevisionDiffPanel />
		</PluginSidebar>
	);
}

export { RevisionDiffViewerSidebar, RevisionDiffPanel };
