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
		setPreference( 'core/edit-post', 'fixedToolbar', true );
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
							>
								<EnablePublishSidebarOption
									help={ __(
										'Review settings, such as visibility and tags.'
									) }
									label={ __( 'Enable pre-publish flow' ) }
								/>
							</PreferencesModalSection>
						) }
						<PreferencesModalSection title={ __( 'Interface' ) }>
							<EnableFeature
								featureName="showListViewByDefault"
								help={ __(
									'Opens the block list view sidebar by default.'
								) }
								label={ __( 'Always open list view' ) }
							/>
							{ showBlockBreadcrumbsOption && (
								<EnableFeature
									featureName="showBlockBreadcrumbs"
									help={ __(
										'Display the block hierarchy trail at the bottom of the editor.'
									) }
									label={ __( 'Show block breadcrumbs' ) }
								/>
							) }
						</PreferencesModalSection>
						<PreferencesModalSection
							title={ __( 'Document settings' ) }
							description={ __(
								'Select what settings are shown in the document panel.'
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
						<MetaBoxesSection title={ __( 'Advanced' ) } />
					</>
				),
			},
			{
				name: 'appearance',
				tabLabel: __( 'Appearance' ),
				content: (
					<PreferencesModalSection
						title={ __( 'Appearance' ) }
						description={ __(
							'Customize the editor interface to suit your needs.'
						) }
					>
						<EnableFeature
							featureName="fixedToolbar"
							help={ __(
								'Access all block and document tools in a single place.'
							) }
							label={ __( 'Top toolbar' ) }
						/>
						<EnableFeature
							featureName="distractionFree"
							onToggle={ toggleDistractionFree }
							help={ __(
								'Reduce visual distractions by hiding the toolbar and other elements to focus on writing.'
							) }
							label={ __( 'Enable Distraction-Free' ) }
						/>
						<EnableFeature
							featureName="focusMode"
							help={ __(
								'Highlights the current block and fades other content.'
							) }
							label={ __( 'Spotlight mode' ) }
						/>
						<EnableFeature
							featureName="themeStyles"
							help={ __(
								'Make the editor look like your theme.'
							) }
							label={ __( 'Use theme styles' ) }
						/>
					</PreferencesModalSection>
				),
			},
			{
				name: 'accessibility',
				tabLabel: __( 'Accessibility' ),
				content: (
					<>
						<PreferencesModalSection
							title={ __( 'Navigation' ) }
							description={ __(
								'Optimize the editing experience for enhanced control.'
							) }
						>
							<EnableFeature
								featureName="keepCaretInsideBlock"
								help={ __(
									'Keeps the text cursor within the block boundaries, aiding users with screen readers by preventing unintentional cursor movement outside the block.'
								) }
								label={ __(
									'Contain text cursor inside block'
								) }
							/>
						</PreferencesModalSection>
						<PreferencesModalSection title={ __( 'Interface' ) }>
							<EnableFeature
								featureName="showIconLabels"
								label={ __( 'Show button text labels' ) }
								help={ __(
									'Show text instead of icons on buttons across the interface.'
								) }
							/>
						</PreferencesModalSection>
					</>
				),
			},
			{
				name: 'blocks',
				tabLabel: __( 'Blocks' ),
				content: (
					<>
						<PreferencesModalSection title={ __( 'Inserter' ) }>
							<EnableFeature
								featureName="mostUsedBlocks"
								help={ __(
									'Adds a category with the most frequently used blocks in the inserter.'
								) }
								label={ __( 'Show most used blocks' ) }
							/>
						</PreferencesModalSection>
						<PreferencesModalSection
							title={ __( 'Manage block visibility' ) }
							description={ __(
								"Disable blocks that you don't want to appear in the inserter. They can always be toggled back on later."
							) }
						>
							<BlockManager />
						</PreferencesModalSection>
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
