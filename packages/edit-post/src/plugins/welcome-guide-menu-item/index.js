/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { PreferenceToggleMenuItem } from '@wordpress/preferences';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';

export default function WelcomeGuideMenuItem() {
	const isTemplateMode = useSelect(
		( select ) => select( editorStore ).getRenderingMode() !== 'post-only',
		[]
	);

	return (
		<PreferenceToggleMenuItem
			scope="core/edit-post"
			name={ isTemplateMode ? 'welcomeGuideTemplate' : 'welcomeGuide' }
			label={ __( 'Welcome Guide' ) }
		/>
	);
}
