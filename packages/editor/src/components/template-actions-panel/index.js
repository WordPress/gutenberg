/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { usePostTemplatePanelMode } from '../post-template/hooks';
import BlockThemeContent from './block-theme-content';
import ClassicThemeContent from './classic-theme-content';

export default function TemplateActionsPanel() {
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);
	const mode = usePostTemplatePanelMode();
	// This check is because the experiment is gated for these post
	// types for now. Later we should use `postType.viewable`.
	if ( ! [ 'page', 'post' ].includes( postType ) ) {
		return null;
	}
	if ( mode === 'classic' ) {
		return <ClassicThemeContent />;
	}
	if ( mode === 'block-theme' ) {
		return <BlockThemeContent />;
	}
	return null;
}
