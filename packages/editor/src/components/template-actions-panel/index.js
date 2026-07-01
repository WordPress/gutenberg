/**
 * Internal dependencies
 */
import { usePostTemplatePanelMode } from '../post-template/hooks';
import BlockThemeContent from './block-theme-content';
import ClassicThemeContent from './classic-theme-content';

export default function TemplateActionsPanel() {
	const mode = usePostTemplatePanelMode();
	if ( mode === 'classic' ) {
		return <ClassicThemeContent />;
	}
	if ( mode === 'block-theme' ) {
		return <BlockThemeContent />;
	}
	return null;
}
