/**
 * WordPress dependencies
 */
import {
	BlockInspector,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { Platform, useCallback, useEffect, useRef } from '@wordpress/element';
import { isRTL, __, _x } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import PatternOverridesPanel from '../pattern-overrides-panel';
import PluginDocumentSettingPanel from '../plugin-document-setting-panel';
import PluginSidebar from '../plugin-sidebar';
import PostSummary from './post-summary';
import PostTaxonomiesPanel from '../post-taxonomies/panel';
import PostTransformPanel from '../post-transform-panel';
import TemplateContentPanel from '../template-content-panel';
import TemplatePartContentPanel from '../template-part-content-panel';
import useAutoSwitchEditorSidebars from '../provider/use-auto-switch-editor-sidebars';
import { sidebars } from './constants';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import {
	NAVIGATION_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../store/constants';

const { TabbedSidebar } = unlock( blockEditorPrivateApis );

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const SidebarContent = ( {
	tabName,
	keyboardShortcut,
	renderingMode,
	onActionPerformed,
	extraPanels,
	onSelect,
} ) => {
	const tabListRef = useRef( null );

	// This effect addresses a race condition caused by tabbing from the last
	// block in the editor into the settings sidebar. Without this effect, the
	// selected tab and browser focus can become separated in an unexpected way
	// (e.g the "block" tab is focused, but the "post" tab is selected).
	useEffect( () => {
		const tabsElements = Array.from(
			tabListRef.current?.querySelectorAll( '[role="tab"]' ) || []
		);
		const selectedTabElement = tabsElements.find(
			// We are purposefully using a custom `data-tab-id` attribute here
			// because we don't want rely on any assumptions about `Tabs`
			// component internals.
			( element ) => element.getAttribute( 'data-tab-id' ) === tabName
		);
		const activeElement = selectedTabElement?.ownerDocument.activeElement;
		const tabsHasFocus = tabsElements.some( ( element ) => {
			return activeElement && activeElement.id === element.id;
		} );
		if (
			tabsHasFocus &&
			selectedTabElement &&
			selectedTabElement.id !== activeElement?.id
		) {
			selectedTabElement?.focus();
		}
	}, [ tabName ] );

	const { documentLabel } = useSelect( ( select ) => {
		const { getPostTypeLabel } = select( editorStore );

		return {
			// translators: Default label for the Document sidebar tab, not selected.
			documentLabel: getPostTypeLabel() || _x( 'Document', 'noun' ),
		};
	}, [] );

	const { disableComplementaryArea } = useDispatch( interfaceStore );

	return (
		<PluginSidebar
			identifier={ tabName }
			closeLabel={ __( 'Close Settings' ) }
			// This classname is added so we can apply a corrective negative
			// margin to the panel.
			// see https://github.com/WordPress/gutenberg/pull/55360#pullrequestreview-1737671049
			className="editor-sidebar__panel"
			headerClassName="editor-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			toggleShortcut={ keyboardShortcut }
			icon={ isRTL() ? drawerLeft : drawerRight }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
			hideHeader
		>
			<TabbedSidebar
				tabs={ [
					{
						name: sidebars.document,
						title: documentLabel,
						panel: (
							<>
								<PostSummary
									onActionPerformed={ onActionPerformed }
								/>
								<PluginDocumentSettingPanel.Slot />
								<TemplateContentPanel
									renderingMode={ renderingMode }
								/>
								<TemplatePartContentPanel />
								<PostTransformPanel />
								<PostTaxonomiesPanel />
								<PatternOverridesPanel />
								{ extraPanels }
							</>
						),
					},
					{
						name: sidebars.block,
						title: __( 'Block' ),
						panel: <BlockInspector />,
					},
				] }
				onClose={ () => disableComplementaryArea( 'core' ) }
				onSelect={ onSelect }
				selectedTab={ tabName }
				defaultTabId={ sidebars.document }
				ref={ tabListRef }
				closeButtonLabel={ __( 'Close Settings' ) }
			/>
		</PluginSidebar>
	);
};

const Sidebar = ( { extraPanels, onActionPerformed } ) => {
	useAutoSwitchEditorSidebars();
	const { tabName, keyboardShortcut, showSummary, renderingMode } = useSelect(
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
				_tabName = !! select(
					blockEditorStore
				).getBlockSelectionStart()
					? sidebars.block
					: sidebars.document;
			}

			return {
				tabName: _tabName,
				keyboardShortcut: shortcut,
				showSummary: ! [
					TEMPLATE_POST_TYPE,
					TEMPLATE_PART_POST_TYPE,
					NAVIGATION_POST_TYPE,
				].includes( select( editorStore ).getCurrentPostType() ),
				renderingMode: select( editorStore ).getRenderingMode(),
			};
		},
		[]
	);

	const { enableComplementaryArea } = useDispatch( interfaceStore );

	const onTabSelect = useCallback(
		( newSelectedTabId ) => {
			if ( !! newSelectedTabId ) {
				enableComplementaryArea( 'core', newSelectedTabId );
			}
		},
		[ enableComplementaryArea ]
	);

	return (
		<SidebarContent
			tabName={ tabName }
			keyboardShortcut={ keyboardShortcut }
			showSummary={ showSummary }
			renderingMode={ renderingMode }
			onActionPerformed={ onActionPerformed }
			extraPanels={ extraPanels }
			selectedTabId={ tabName }
			onSelect={ onTabSelect }
		/>
	);
};

export default Sidebar;
