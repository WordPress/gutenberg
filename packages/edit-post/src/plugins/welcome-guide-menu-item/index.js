/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { MoreMenuFeatureToggle } from '@wordpress/interface';
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
		<MoreMenuFeatureToggle
			scope="core/edit-post"
			feature={ isTemplateMode ? 'welcomeGuideTemplate' : 'welcomeGuide' }
			label={ __( 'Welcome Guide' ) }
		/>
	);
}
