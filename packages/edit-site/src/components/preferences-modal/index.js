/**
 * WordPress dependencies
 */
import {
	PreferencesModal,
	PreferencesModalTabs,
	PreferencesModalSection,
} from '@wordpress/interface';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function EditSitePreferencesModal( {
	isModalActive,
	toggleModal,
} ) {
	const sections = useMemo( () => [
		{
			name: 'general',
			tabLabel: __( 'General' ),
			content: (
				<PreferencesModalSection
					title={ __( 'Appearance' ) }
					description={ __(
						'Customize options related to the block editor interface and editing flow.'
					) }
				></PreferencesModalSection>
			),
		},
	] );
	if ( ! isModalActive ) {
		return null;
	}
	return (
		<PreferencesModal closeModal={ toggleModal }>
			<PreferencesModalTabs sections={ sections } />
		</PreferencesModal>
	);
}
