/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { seen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import { AccessibilityInsightsPanel } from './panel';
import { store as editorStore } from '../../store';

/**
 * Sidebar identifier for the accessibility insights panel.
 */
export const ACCESSIBILITY_INSIGHTS_SIDEBAR_NAME =
	'edit-post/accessibility-insights';

/**
 * Accessibility Insights Sidebar container component.
 *
 * Renders the accessibility analysis sidebar in the editor.
 *
 * @return {JSX.Element|null} The sidebar component or null
 */
function AccessibilityInsightsSidebar() {
	const { editorMode } = useSelect( ( select ) => {
		const { getEditorMode } = select( editorStore );
		return {
			editorMode: getEditorMode(),
		};
	}, [] );

	// Hide in Code Editor mode since we analyze blocks
	if ( editorMode === 'text' ) {
		return null;
	}

	return (
		<PluginSidebar
			identifier={ ACCESSIBILITY_INSIGHTS_SIDEBAR_NAME }
			name={ ACCESSIBILITY_INSIGHTS_SIDEBAR_NAME }
			title={ __( 'Accessibility Insights' ) }
			icon={ seen }
			closeLabel={ __( 'Close Accessibility Insights' ) }
		>
			<AccessibilityInsightsPanel />
		</PluginSidebar>
	);
}

export default AccessibilityInsightsSidebar;
export { AccessibilityInsightsPanel };
