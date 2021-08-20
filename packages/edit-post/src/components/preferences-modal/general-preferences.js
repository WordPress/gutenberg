/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import {
	PreferencesModalSection,
	PreferencesModalFeatureToggle,
} from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { EnablePublishSidebarOption } from './options';
import { store as editPostStore } from '../../store';

export default function GeneralPreferences() {
	const isLargeViewport = useViewportMatch( 'medium' );
	const showBlockBreadcrumbsOption = useSelect(
		( select ) => {
			const { getEditorSettings } = select( editorStore );
			const { getEditorMode, isFeatureActive } = select( editPostStore );
			const mode = getEditorMode();
			const isRichEditingEnabled = getEditorSettings().richEditingEnabled;
			const hasReducedUI = isFeatureActive( 'reducedUI' );
			return (
				! hasReducedUI &&
				isLargeViewport &&
				isRichEditingEnabled &&
				mode === 'visual'
			);
		},
		[ isLargeViewport ]
	);

	return (
		<>
			{ isLargeViewport && (
				<PreferencesModalSection
					title={ __( 'Publishing' ) }
					description={ __(
						'Change options related to publishing.'
					) }
				>
					<EnablePublishSidebarOption
						help={ __(
							'Review settings, such as visibility and tags.'
						) }
						label={ __( 'Include pre-publish checklist' ) }
					/>
				</PreferencesModalSection>
			) }

			<PreferencesModalSection
				title={ __( 'Appearance' ) }
				description={ __(
					'Customize options related to the block editor interface and editing flow.'
				) }
			>
				<PreferencesModalFeatureToggle
					scope="core/edit-post"
					feature="reducedUI"
					help={ __(
						'Compacts options and outlines in the toolbar.'
					) }
					label={ __( 'Reduce the interface' ) }
				/>
				<PreferencesModalFeatureToggle
					scope="core/edit-post"
					feature="focusMode"
					help={ __(
						'Highlights the current block and fades other content.'
					) }
					label={ __( 'Spotlight mode' ) }
				/>
				<PreferencesModalFeatureToggle
					scope="core/edit-post"
					feature="showIconLabels"
					help={ __( 'Shows text instead of icons.' ) }
					label={ __( 'Display button labels' ) }
				/>
				<PreferencesModalFeatureToggle
					scope="core/edit-post"
					feature="themeStyles"
					help={ __( 'Make the editor look like your theme.' ) }
					label={ __( 'Use theme styles' ) }
				/>
				{ showBlockBreadcrumbsOption && (
					<PreferencesModalFeatureToggle
						scope="core/edit-post"
						feature="showBlockBreadcrumbs"
						help={ __(
							'Shows block breadcrumbs at the bottom of the editor.'
						) }
						label={ __( 'Display block breadcrumbs' ) }
					/>
				) }
			</PreferencesModalSection>
		</>
	);
}
