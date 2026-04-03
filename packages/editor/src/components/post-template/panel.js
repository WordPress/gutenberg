/**
 * Internal dependencies
 */
import { usePostTemplatePanelMode } from './hooks';
import ClassicThemeControl from './classic-theme';
import BlockThemeControl from './block-theme';

/**
 * Displays the template controls based on the current editor settings and user permissions.
 *
 * @return {React.ReactNode} The rendered PostTemplatePanel component.
 */
export default function PostTemplatePanel() {
	const mode = usePostTemplatePanelMode();
	if ( mode === 'classic' ) {
		return <ClassicThemeControl />;
	}
	if ( mode === 'block-theme' ) {
		return <BlockThemeControl />;
	}
	return null;
}
