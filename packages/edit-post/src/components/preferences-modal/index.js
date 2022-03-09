/**
 * External dependencies
 */
import { get } from 'lodash';

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
import { store as coreStore } from '@wordpress/core-data';
import {
	PreferencesModal,
	PreferencesModalTabs,
	PreferencesModalSection,
} from '@wordpress/interface';

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

const MODAL_NAME = 'edit-post/preferences';

export default function EditPostPreferencesModal() {
	const isLargeViewport = useViewportMatch( 'medium' );
	const { closeModal } = useDispatch( editPostStore );
	const { isModalActive, isViewable } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { getPostType } = select( coreStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );
		return {
			isModalActive: select( editPostStore ).isModalActive( MODAL_NAME ),
			isViewable: get( postType, [ 'viewable' ], false ),
		};
	}, [] );
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
								featureName="reducedUI"
								help={ __(
									'Compacts options and outlines in the toolbar.'
								) }
								label={ __( 'Reduce the interface' ) }
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
								help={ __( 'Shows text instead of icons.' ) }
								label={ __( 'Display button labels' ) }
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
							{ isViewable && (
								<EnablePanelOption
									label={ __( 'Permalink' ) }
									panelName="post-link"
								/>
							) }
							{ isViewable && (
								<EnablePanelOption
									label={ __( 'Template' ) }
									panelName="template"
								/>
							) }
							<PostTaxonomies
								taxonomyWrapper={ ( content, taxonomy ) => (
									<EnablePanelOption
										label={ get( taxonomy, [
											'labels',
											'menu_name',
										] ) }
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
		[ isViewable, isLargeViewport, showBlockBreadcrumbsOption ]
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
