/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalTruncate as Truncate,
	FlexItem,
	Modal,
	TabPanel,
	Card,
	CardHeader,
	CardBody,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useCallback, useState } from '@wordpress/element';
import {
	PostTaxonomies,
	PostExcerptCheck,
	PageAttributesCheck,
	PostFeaturedImageCheck,
	PostTypeSupportCheck,
	store as editorStore,
} from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { chevronLeft, chevronRight, Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Section from './section';
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
const PREFERENCES_MENU = 'preferences-menu';

export default function PreferencesModal() {
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
							<Section
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
							</Section>
						) }

						<Section
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
						</Section>
					</>
				),
			},
			{
				name: 'blocks',
				tabLabel: __( 'Blocks' ),
				content: (
					<>
						<Section
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
						</Section>
						<Section
							title={ __( 'Visible blocks' ) }
							description={ __(
								"Disable blocks that you don't want to appear in the inserter. They can always be toggled back on later."
							) }
						>
							<BlockManager />
						</Section>
					</>
				),
			},
			{
				name: 'panels',
				tabLabel: __( 'Panels' ),
				content: (
					<>
						<Section
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
						</Section>
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

	// This is also used to sync the two different rendered components
	// between small and large viewports.
	const [ activeMenu, setActiveMenu ] = useState( PREFERENCES_MENU );
	/**
	 * Create helper objects from `sections` for easier data handling.
	 * `tabs` is used for creating the `TabPanel` and `sectionsContentMap`
	 * is used for easier access to active tab's content.
	 */
	const { tabs, sectionsContentMap } = useMemo(
		() =>
			sections.reduce(
				( accumulator, { name, tabLabel: title, content } ) => {
					accumulator.tabs.push( { name, title } );
					accumulator.sectionsContentMap[ name ] = content;
					return accumulator;
				},
				{ tabs: [], sectionsContentMap: {} }
			),
		[ sections ]
	);
	const getCurrentTab = useCallback(
		( tab ) => sectionsContentMap[ tab.name ] || null,
		[ sectionsContentMap ]
	);
	if ( ! isModalActive ) {
		return null;
	}
	let modalContent;
	// We render different components based on the viewport size.
	if ( isLargeViewport ) {
		modalContent = (
			<TabPanel
				className="edit-post-preferences__tabs"
				tabs={ tabs }
				initialTabName={
					activeMenu !== PREFERENCES_MENU ? activeMenu : undefined
				}
				onSelect={ setActiveMenu }
				orientation="vertical"
			>
				{ getCurrentTab }
			</TabPanel>
		);
	} else {
		modalContent = (
			<NavigatorProvider initialPath="/">
				<NavigatorScreen path="/">
					<Card isBorderless size="small">
						<CardBody>
							<ItemGroup>
								{ tabs.map( ( tab ) => {
									return (
										<NavigatorButton
											key={ tab.name }
											path={ tab.name }
											as={ Item }
											isAction
										>
											<HStack justify="space-between">
												<FlexItem>
													<Truncate>
														{ tab.title }
													</Truncate>
												</FlexItem>
												<FlexItem>
													<Icon
														icon={
															isRTL()
																? chevronLeft
																: chevronRight
														}
													/>
												</FlexItem>
											</HStack>
										</NavigatorButton>
									);
								} ) }
							</ItemGroup>
						</CardBody>
					</Card>
				</NavigatorScreen>
				{ sections.map( ( section ) => {
					return (
						<NavigatorScreen
							key={ `${ section.name }-menu` }
							path={ section.name }
						>
							<Card isBorderless size="large">
								<CardHeader
									isBorderless={ false }
									justify="left"
									size="small"
									gap="6"
								>
									<NavigatorBackButton
										icon={
											isRTL() ? chevronRight : chevronLeft
										}
										aria-label={ __(
											'Navigate to the previous view'
										) }
									/>
									<Text size="16">{ section.tabLabel }</Text>
								</CardHeader>
								<CardBody>{ section.content }</CardBody>
							</Card>
						</NavigatorScreen>
					);
				} ) }
			</NavigatorProvider>
		);
	}
	return (
		<Modal
			className="edit-post-preferences-modal"
			title={ __( 'Preferences' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ closeModal }
		>
			{ modalContent }
		</Modal>
	);
}
