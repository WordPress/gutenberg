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
import DistractionFreeConfigControl from './distraction-free-config-control';
import BlockVisibility from '../block-visibility';
import PostTaxonomies from '../post-taxonomies';
import PostFeaturedImageCheck from '../post-featured-image/check';
import PostExcerptCheck from '../post-excerpt/check';
import PageAttributesCheck from '../page-attributes/check';
import PostTypeSupportCheck from '../post-type-support-check';
import { unlock } from '../../lock-unlock';

const {
	PreferencesModal,
	PreferencesModalTabs,
	PreferencesModalSection,
	PreferenceToggleControl,
} = unlock( preferencesPrivateApis );

export default function EditorPreferencesModal( { extraSections = {} } ) {
	const isActive = useSelect( ( select ) => {
		return select( interfaceStore ).isModalActive( 'editor/preferences' );
	}, [] );
	const { closeModal } = useDispatch( interfaceStore );

	if ( ! isActive ) {
		return null;
	}

	// Please wrap all contents inside PreferencesModalContents to prevent all
	// hooks from executing when the modal is not open.
	return (
		<PreferencesModal closeModal={ closeModal }>
			<PreferencesModalContents extraSections={ extraSections } />
		</PreferencesModal>
	);
}

function AppearanceToggles( { Toggle, isLargeViewport } ) {
	return (
		<>
			<Toggle
				featureKey="fixedToolbar"
				help={ __( 'Access all block and document tools in a single place.' ) }
				label={ __( 'Top toolbar' ) }
			/>
			<Toggle
				featureKey="focusMode"
				help={ __( 'Highlights the current block and fades other content.' ) }
				label={ __( 'Spotlight mode' ) }
			/>
			{ isLargeViewport && (
				<Toggle
					featureKey="showBlockBreadcrumbs"
					help={ __( 'Display the block hierarchy trail at the bottom of the editor.' ) }
					label={ __( 'Block breadcrumbs' ) }
				/>
			) }
			<Toggle
				featureKey="autoHideHeader"
				help={ __( 'Hide the toolbar and show it on hover.' ) }
				label={ __( 'Auto-hide header' ) }
			/>
			<Toggle
				featureKey="showSimpleTopbar"
				help={ __( 'Show the inserter, list view, and zoom out toggles.' ) }
				label={ __( 'Simplified topbar' ) }
			/>
			<Toggle
				featureKey="showBlockHelpers"
				help={ __( 'Show insertion points and block helpers.' ) }
				label={ __( 'Block helpers' ) }
			/>
		</>
	);
}

function NormalModeToggle( { featureKey, help, label } ) {
	return (
		<PreferenceToggleControl
			scope="core"
			featureName={ featureKey }
			help={ help }
			label={ label }
		/>
	);
}

function DistractionFreeModeToggle( { featureKey, help, label } ) {
	return (
		<DistractionFreeConfigControl
			configKey={ featureKey }
			help={ help }
			label={ label }
		/>
	);
}

function PreferencesModalContents( { extraSections = {} } ) {
	const isLargeViewport = useViewportMatch( 'medium' );

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
										'Opens the List View panel by default.'
									) }
									label={ __( 'Always open List View' ) }
								/>
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
								<PreferenceToggleControl
									scope="core"
									featureName="enableChoosePatternModal"
									help={ __(
										'Pick from starter content when creating a new page.'
									) }
									label={ __( 'Show starter patterns' ) }
								/>
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
						<>
							<PreferencesModalSection
								title={ __( 'Normal mode' ) }
								description={ __(
									'Settings when distraction-free mode is off.'
								) }
							>
								<AppearanceToggles
									Toggle={ NormalModeToggle }
									isLargeViewport={ isLargeViewport }
								/>
								{ extraSections?.appearance }
							</PreferencesModalSection>
							<PreferencesModalSection
								title={ __( 'Distraction-free mode' ) }
								description={ __(
									'Settings when distraction-free mode is on.'
								) }
							>
								<AppearanceToggles
									Toggle={ DistractionFreeModeToggle }
									isLargeViewport={ isLargeViewport }
								/>
								{ extraSections?.distractionFreeAppearance }
							</PreferencesModalSection>
						</>
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
										'Keeps the text cursor within blocks while navigating with arrow keys, preventing it from moving to other blocks and enhancing accessibility for keyboard users.'
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
								<BlockVisibility />
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
		[ extraSections, isLargeViewport ]
	);

	return <PreferencesModalTabs sections={ sections } />;
}
