/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { PreferenceToggleMenuItem } from '@wordpress/preferences';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function WelcomeGuideMenuItem() {
	const isTemplateMode = useSelect(
		( select ) => select( editPostStore ).isEditingTemplate(),
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
