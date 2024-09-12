/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { PreferenceToggleMenuItem } from '@wordpress/preferences';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';

export default function WelcomeGuideMenuItem() {
	const isEditingTemplate = useSelect(
		( select ) =>
			select( editorStore ).getCurrentPostType() === 'wp_template',
		[]
	);

	return (
		<PreferenceToggleMenuItem
			scope="core/edit-post"
			name={ isEditingTemplate ? 'welcomeGuideTemplate' : 'welcomeGuide' }
			label={ __( 'Welcome Guide' ) }
		/>
	);
}
