/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	store as preferencesStore,
	privateApis as preferencesPrivateApis,
} from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import EnablePanelOption from './enable-panel';
import EnablePluginDocumentSettingPanelOption from './enable-plugin-document-setting-panel';
import EnablePublishSidebarOption from './enable-publish-sidebar';
import BlockManager from '../block-manager';
import PostTaxonomies from '../post-taxonomies';
import PostFeaturedImageCheck from '../post-featured-image/check';
import PostExcerptCheck from '../post-excerpt/check';
import PageAttributesCheck from '../page-attributes/check';
import PostTypeSupportCheck from '../post-type-support-check';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { useStartPatterns } from '../start-page-options';

const {
	PreferencesModal,
	PreferencesModalTabs,
	PreferencesModalSection,
	PreferenceToggleControl,
} = unlock( preferencesPrivateApis );

export default function EditorPreferencesModal( { extraSections = {} } ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { isActive, showBlockBreadcrumbsOption } = useSelect(
		( select ) => {
			const { getEditorSettings } = select( editorStore );
			const { get } = select( preferencesStore );
			const { isModalActive } = select( interfaceStore );
			const isRichEditingEnabled = getEditorSettings().richEditingEnabled;
			const isDistractionFreeEnabled = get( 'core', 'distractionFree' );
			return {
				showBlockBreadcrumbsOption:
					! isDistractionFreeEnabled &&
					isLargeViewport &&
					isRichEditingEnabled,
				isActive: isModalActive( 'editor/preferences' ),
			};
		},
		[ isLargeViewport ]
	);
	const { closeModal } = useDispatch( interfaceStore );
	const { setIsListViewOpened, setIsInserterOpened } =
		useDispatch( editorStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const hasStarterPatterns = !! useStartPatterns().length;

	const sections = useMemo(
		() =>
			[
				{
					name: 'general',
					tabLabel: __( 'General' ),
					content: (
						<>
							<PreferencesModalSection
								title={ __( 'Interface' ) }
							>
								<PreferenceToggleControl
									scope="core"
									featureName="showListViewByDefault"
									help={ __(
										'Opens the List View sidebar by default.'
									) }
									label={ __( 'Always open List View' ) }
								/>
								{ showBlockBreadcrumbsOption && (
									<PreferenceToggleControl
										scope="core"
										featureName="showBlockBreadcrumbs"
										help={ __(
											'Display the block hierarchy trail at the bottom of the editor.'
										) }
										label={ __( 'Show block breadcrumbs' ) }
									/>
								) }
								<PreferenceToggleControl
									scope="core"
									featureName="allowRightClickOverrides"
									help={ __(
										'Allows contextual List View menus via right-click, overriding browser defaults.'
									) }
									label={ __(
										'Allow right-click contextual menus'
									) }
								/>
								{ hasStarterPatterns && (
									<PreferenceToggleControl
										scope="core"
										featureName="enableChoosePatternModal"
										help={ __(
											'Shows starter patterns when creating a new page.'
										) }
										label={ __( 'Show starter patterns' ) }
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
							{ isLargeViewport && (
								<PreferencesModalSection
									title={ __( 'Publishing' ) }
								>
									<EnablePublishSidebarOption
										help={ __(
											'Review settings, such as visibility and tags.'
										) }
										label={ __(
											'Enable pre-publish checks'
										) }
									/>
								</PreferencesModalSection>
							) }
							{ extraSections?.general }
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
							<PreferenceToggleControl
								scope="core"
								featureName="fixedToolbar"
								onToggle={ () =>
									setPreference(
										'core',
										'distractionFree',
										false
									)
								}
								help={ __(
									'Access all block and document tools in a single place.'
								) }
								label={ __( 'Top toolbar' ) }
							/>
							<PreferenceToggleControl
								scope="core"
								featureName="distractionFree"
								onToggle={ () => {
									setPreference(
										'core',
										'fixedToolbar',
										true
									);
									setIsInserterOpened( false );
									setIsListViewOpened( false );
								} }
								help={ __(
									'Reduce visual distractions by hiding the toolbar and other elements to focus on writing.'
								) }
								label={ __( 'Distraction free' ) }
							/>
							<PreferenceToggleControl
								scope="core"
								featureName="focusMode"
								help={ __(
									'Highlights the current block and fades other content.'
								) }
								label={ __( 'Spotlight mode' ) }
							/>
							{ extraSections?.appearance }
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
								<PreferenceToggleControl
									scope="core"
									featureName="keepCaretInsideBlock"
									help={ __(
										'Keeps the text cursor within the block boundaries, aiding users with screen readers by preventing unintentional cursor movement outside the block.'
									) }
									label={ __(
										'Contain text cursor inside block'
									) }
								/>
							</PreferencesModalSection>
							<PreferencesModalSection
								title={ __( 'Interface' ) }
							>
								<PreferenceToggleControl
									scope="core"
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
								<PreferenceToggleControl
									scope="core"
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
				window.__experimentalMediaProcessing && {
					name: 'media',
					tabLabel: __( 'Media' ),
					content: (
						<>
							<PreferencesModalSection
								title={ __( 'General' ) }
								description={ __(
									'Customize options related to the media upload flow.'
								) }
							>
								<PreferenceToggleControl
									scope="core/media"
									featureName="optimizeOnUpload"
									help={ __(
										'Compress media items before uploading to the server.'
									) }
									label={ __( 'Pre-upload compression' ) }
								/>
								<PreferenceToggleControl
									scope="core/media"
									featureName="requireApproval"
									help={ __(
										'Require approval step when optimizing existing media.'
									) }
									label={ __( 'Approval step' ) }
								/>
							</PreferencesModalSection>
						</>
					),
				},
			].filter( Boolean ),
		[
			showBlockBreadcrumbsOption,
			extraSections,
			setIsInserterOpened,
			setIsListViewOpened,
			setPreference,
			isLargeViewport,
			hasStarterPatterns,
		]
	);

	if ( ! isActive ) {
		return null;
	}

	return (
		<PreferencesModal closeModal={ closeModal }>
			<PreferencesModalTabs sections={ sections } />
		</PreferencesModal>
	);
}
