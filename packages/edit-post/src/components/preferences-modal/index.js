/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	PostTaxonomies,
	PostExcerptCheck,
	PageAttributesCheck,
	PostFeaturedImageCheck,
	PostTypeSupportCheck,
	store as editorStore,
} from '@wordpress/editor';
import {
	PreferencesModal,
	PreferencesModalTabs,
	PreferencesModalSection,
	store as interfaceStore,
} from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */

import {
	EnablePluginDocumentSettingPanelOption,
	EnablePublishSidebarOption,
	EnablePanelOption,
	EnableFeature,
} from './options';
import MetaBoxesSection from './meta-boxes-section';
import { store as editPostStore } from '../../store';
import BlockManager from '../block-manager';

export const PREFERENCES_MODAL_NAME = 'edit-post/preferences';

export default function EditPostPreferencesModal() {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { closeModal } = useDispatch( interfaceStore );
	const [ isModalActive, showBlockBreadcrumbsOption ] = useSelect(
		( select ) => {
			const { getEditorSettings } = select( editorStore );
			const { getEditorMode, isFeatureActive } = select( editPostStore );
			const modalActive = select( interfaceStore ).isModalActive(
				PREFERENCES_MODAL_NAME
			);
			const mode = getEditorMode();
			const isRichEditingEnabled = getEditorSettings().richEditingEnabled;
			const isDistractionFreeEnabled =
				isFeatureActive( 'distractionFree' );
			return [
				modalActive,
				! isDistractionFreeEnabled &&
					isLargeViewport &&
					isRichEditingEnabled &&
					mode === 'visual',
				isDistractionFreeEnabled,
			];
		},
		[ isLargeViewport ]
	);

	const { closeGeneralSidebar, setIsListViewOpened, setIsInserterOpened } =
		useDispatch( editPostStore );

	const { set: setPreference } = useDispatch( preferencesStore );

	const toggleDistractionFree = () => {
		setPreference( 'core/edit-post', 'fixedToolbar', false );
		setIsInserterOpened( false );
		setIsListViewOpened( false );
		closeGeneralSidebar();
	};

	const sections = useMemo(
		() => [
			{
				name: 'general',
				tabLabel: __( 'General' ),
				content: (
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
									label={ __(
										'Include pre-publish checklist'
									) }
								/>
							</PreferencesModalSection>
						) }

						<PreferencesModalSection
							title={ __( 'Appearance' ) }
							description={ __(
								'Customize options related to the block editor interface and editing flow.'
							) }
						>
							<EnableFeature
								featureName="distractionFree"
								onToggle={ toggleDistractionFree }
								help={ __(
									'Reduce visual distractions by hiding the toolbar and other elements to focus on writing.'
								) }
								label={ __( 'Distraction free' ) }
							/>
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
								help={ __(
									'Show text instead of icons on buttons.'
								) }
							/>
							<EnableFeature
								featureName="showListViewByDefault"
								help={ __(
									'Opens the block list view sidebar by default.'
								) }
								label={ __( 'Always open list view' ) }
							/>
							<EnableFeature
								featureName="themeStyles"
								help={ __(
									'Make the editor look like your theme.'
								) }
								label={ __( 'Use theme styles' ) }
							/>
							{ showBlockBreadcrumbsOption && (
								<EnableFeature
									featureName="showBlockBreadcrumbs"
									help={ __(
										'Shows block breadcrumbs at the bottom of the editor.'
									) }
									label={ __( 'Display block breadcrumbs' ) }
								/>
							) }
						</PreferencesModalSection>
					</>
				),
			},
			{
				name: 'blocks',
				tabLabel: __( 'Blocks' ),
				content: (
					<>
						<PreferencesModalSection
							title={ __( 'Block interactions' ) }
							description={ __(
								'Customize how you interact with blocks in the block library and editing canvas.'
							) }
						>
							<EnableFeature
								featureName="mostUsedBlocks"
								help={ __(
									'Places the most frequent blocks in the block library.'
								) }
								label={ __( 'Show most used blocks' ) }
							/>
							<EnableFeature
								featureName="keepCaretInsideBlock"
								help={ __(
									'Aids screen readers by stopping text caret from leaving blocks.'
								) }
								label={ __(
									'Contain text cursor inside block'
								) }
							/>
						</PreferencesModalSection>
						<PreferencesModalSection
							title={ __( 'Visible blocks' ) }
							description={ __(
								"Disable blocks that you don't want to appear in the inserter. They can always be toggled back on later."
							) }
						>
							<BlockManager />
						</PreferencesModalSection>
					</>
				),
			},
			{
				name: 'panels',
				tabLabel: __( 'Panels' ),
				content: (
					<>
						<PreferencesModalSection
							title={ __( 'Document settings' ) }
							description={ __(
								'Choose what displays in the panel.'
							) }
						>
							<EnablePluginDocumentSettingPanelOption.Slot />
							<PostTaxonomies
								taxonomyWrapper={ ( content, taxonomy ) => (
									<EnablePanelOption
										label={ taxonomy.labels.menu_name }
										panelName={ `taxonomy-panel-${ taxonomy.slug }` }
									/>
								) }
							/>
							<PostFeaturedImageCheck>
								<EnablePanelOption
									label={ __( 'Featured image' ) }
									panelName="featured-image"
								/>
							</PostFeaturedImageCheck>
							<PostExcerptCheck>
								<EnablePanelOption
									label={ __( 'Excerpt' ) }
									panelName="post-excerpt"
								/>
							</PostExcerptCheck>
							<PostTypeSupportCheck
								supportKeys={ [ 'comments', 'trackbacks' ] }
							>
								<EnablePanelOption
									label={ __( 'Discussion' ) }
									panelName="discussion-panel"
								/>
							</PostTypeSupportCheck>
							<PageAttributesCheck>
								<EnablePanelOption
									label={ __( 'Page attributes' ) }
									panelName="page-attributes"
								/>
							</PageAttributesCheck>
						</PreferencesModalSection>
						<MetaBoxesSection
							title={ __( 'Additional' ) }
							description={ __(
								'Add extra areas to the editor.'
							) }
						/>
					</>
				),
			},
		],
		[ isLargeViewport, showBlockBreadcrumbsOption ]
	);

	if ( ! isModalActive ) {
		return null;
	}

	return (
		<PreferencesModal closeModal={ closeModal }>
			<PreferencesModalTabs sections={ sections } />
		</PreferencesModal>
	);
}
