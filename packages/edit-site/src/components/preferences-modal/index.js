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

/**
 * Internal dependencies
 */
import EnableFeature from './enable-feature';

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
				>
					<EnableFeature
						featureName="focusMode"
						help={ __(
							'Highlights the current block and fades other content.'
						) }
						label={ __( 'Spotlight mode' ) }
					/>
					<EnableFeature
						featureName="showIconLabels"
						label={ __( 'Show button text labels' ) }
						help={ __( 'Show text instead of icons on buttons.' ) }
					/>
					<EnableFeature
						featureName="showListViewByDefault"
						help={ __(
							'Opens the block list view sidebar by default.'
						) }
						label={ __( 'Always open list view' ) }
					/>
					<EnableFeature
						featureName="showBlockBreadcrumbs"
						help={ __(
							'Shows block breadcrumbs at the bottom of the editor.'
						) }
						label={ __( 'Display block breadcrumbs' ) }
					/>
				</PreferencesModalSection>
			),
		},
		{
			name: 'blocks',
			tabLabel: __( 'Blocks' ),
			content: (
				<PreferencesModalSection
					title={ __( 'Block interactions' ) }
					description={ __(
						'Customize how you interact with blocks in the block library and editing canvas.'
					) }
				>
					<EnableFeature
						featureName="keepCaretInsideBlock"
						help={ __(
							'Aids screen readers by stopping text caret from leaving blocks.'
						) }
						label={ __( 'Contain text cursor inside block' ) }
					/>
				</PreferencesModalSection>
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
