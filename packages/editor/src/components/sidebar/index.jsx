import {
	BlockInspector,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { isRTL, __, _x } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { PanelBody } from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';
import { Tabs } from '@wordpress/ui';
import PatternOverridesPanel from '../pattern-overrides-panel';
import PluginDocumentSettingPanel from '../plugin-document-setting-panel';
import PluginSidebar from '../plugin-sidebar';
import PostSummary from './post-summary';
import PostRevisionSummary from './post-revision-summary';
import InlineTemplatePartSummary from './inline-template-part-summary';
import PageLayoutPanel from '../post-template/page-layout-panel';
import PostCardPanel from '../post-card-panel';
import PostPanelSection from '../post-panel-section';
import PostStatusPanel from '../post-status';
import PostTaxonomiesPanel from '../post-taxonomies/panel';
import PostTransformPanel from '../post-transform-panel';
import SidebarHeader from './header';
import TemplateActionsPanel from '../template-actions-panel';
import TemplateContentPanel from '../template-content-panel';
import TemplatePartContentPanel from '../template-part-content-panel';
import RevisionBlockDiffPanel from '../revision-block-diff';
import useAutoSwitchEditorSidebars from '../provider/use-auto-switch-editor-sidebars';
import useActiveEditorEntity from '../use-active-editor-entity';
import { sidebars } from './constants';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const SIDEBAR_ACTIVE_BY_DEFAULT = true;
const PAGE_DETAILS_EXCLUDED_FIELD_IDS = [ 'status' ];

const PageSidebarOverview = ( { onActionPerformed } ) => {
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );

	if ( postType !== 'page' ) {
		return null;
	}

	return (
		<PostPanelSection className="editor-sidebar__page-overview">
			<PostCardPanel
				postType={ postType }
				postId={ postId }
				onActionPerformed={ onActionPerformed }
			/>
			<PostStatusPanel />
		</PostPanelSection>
	);
};

function Sidebar( { extraPanels, onActionPerformed } ) {
	useAutoSwitchEditorSidebars();
	const activeEntity = useActiveEditorEntity();

	const { tabName, keyboardShortcut, isRevisionsMode } = useSelect(
		( select ) => {
			const shortcut = select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/editor/toggle-sidebar' );

			const sidebar =
				select( interfaceStore ).getActiveComplementaryArea( 'core' );
			const _isEditorSidebarOpened = [
				sidebars.block,
				sidebars.document,
			].includes( sidebar );
			let _tabName = sidebar;
			if ( ! _isEditorSidebarOpened ) {
				_tabName = select( blockEditorStore ).getBlockSelectionStart()
					? sidebars.block
					: sidebars.document;
			}

			return {
				tabName: _tabName,
				keyboardShortcut: shortcut,
				isRevisionsMode: unlock(
					select( editorStore )
				).isRevisionsMode(),
			};
		},
		[]
	);

	const { enableComplementaryArea } = useDispatch( interfaceStore );

	function onTabSelect( newSelectedTabId ) {
		enableComplementaryArea( 'core', newSelectedTabId );
	}

	let tabContent;
	if ( isRevisionsMode ) {
		tabContent = <PostRevisionSummary />;
	} else if ( activeEntity.isInlineTemplatePart ) {
		tabContent = (
			<>
				<InlineTemplatePartSummary
					activeEntity={ activeEntity }
					onActionPerformed={ onActionPerformed }
				/>
				<TemplatePartContentPanel postType={ activeEntity.postType } />
			</>
		);
	} else {
		const isDataFormInspectorEnabled =
			window?.__experimentalDataFormInspector;
		const isPageEntity = activeEntity.postType === 'page';
		// `PostSummary` picks the data-form variant itself.
		const postSummary = (
			<PostSummary onActionPerformed={ onActionPerformed } />
		);
		const pageDetailsPanel = (
			<PanelBody
				title={ __( 'Details' ) }
				initialOpen={ false }
				className="editor-sidebar__details-panel"
			>
				<PostSummary
					onActionPerformed={ onActionPerformed }
					hidePostCard
					excludedFieldIds={ PAGE_DETAILS_EXCLUDED_FIELD_IDS }
				/>
			</PanelBody>
		);
		tabContent = (
			<>
				{ isPageEntity ? (
					<PageSidebarOverview
						onActionPerformed={ onActionPerformed }
					/>
				) : (
					postSummary
				) }
				{ isPageEntity && <PageLayoutPanel /> }
				<TemplateContentPanel />
				<PluginDocumentSettingPanel.Slot />
				{ isDataFormInspectorEnabled && <TemplateActionsPanel /> }
				<TemplatePartContentPanel />
				<PostTransformPanel />
				<PostTaxonomiesPanel />
				<PatternOverridesPanel />
				{ extraPanels }
				{ isPageEntity && pageDetailsPanel }
			</>
		);
	}

	return (
		<PluginSidebar
			identifier={ tabName }
			header={
				<SidebarHeader documentLabel={ activeEntity.postTypeLabel } />
			}
			closeLabel={ __( 'Close Settings' ) }
			className="editor-sidebar__panel"
			headerClassName="editor-sidebar__panel-tabs"
			title={
				/* translators: button label text should, if possible, be under 16 characters. */
				_x( 'Settings', 'panel button label' )
			}
			toggleShortcut={ keyboardShortcut }
			icon={ isRTL() ? drawerLeft : drawerRight }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
			// Makes `Tabs.Root` the container, so the tab list passed as
			// `header` and the panels below share a subtree across the fill.
			render={
				<Tabs.Root value={ tabName } onValueChange={ onTabSelect } />
			}
		>
			<Tabs.Panel value={ sidebars.document } tabIndex={ -1 }>
				{ tabContent }
			</Tabs.Panel>
			<Tabs.Panel value={ sidebars.block } tabIndex={ -1 }>
				<BlockInspector />
				{ isRevisionsMode && <RevisionBlockDiffPanel /> }
			</Tabs.Panel>
		</PluginSidebar>
	);
}

export default Sidebar;
