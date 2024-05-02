/**
 * WordPress dependencies
 */
import {
	BlockInspector,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Platform,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from '@wordpress/element';
import { isRTL, __, sprintf } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import {
	store as editorStore,
	PageAttributesPanel,
	PluginDocumentSettingPanel,
	PluginSidebar,
	PostDiscussionPanel,
	PostLastRevisionPanel,
	PostTaxonomiesPanel,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { addQueryArgs } from '@wordpress/url';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import SettingsHeader from '../settings-header';
import PostStatus from '../post-status';
import MetaBoxes from '../../meta-boxes';
import { store as editPostStore } from '../../../store';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '../../../lock-unlock';

const { PostCardPanel, PostActions, interfaceStore } =
	unlock( editorPrivateApis );
const { Tabs } = unlock( componentsPrivateApis );
const { PatternOverridesPanel, useAutoSwitchEditorSidebars } =
	unlock( editorPrivateApis );

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );
export const sidebars = {
	document: 'edit-post/document',
	block: 'edit-post/block',
};

const SidebarContent = ( { tabName, keyboardShortcut, isEditingTemplate } ) => {
	const tabListRef = useRef( null );
	// Because `PluginSidebar` renders a `ComplementaryArea`, we
	// need to forward the `Tabs` context so it can be passed through the
	// underlying slot/fill.
	const tabsContextValue = useContext( Tabs.Context );

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
	const { createSuccessNotice } = useDispatch( noticesStore );

	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
					{
						const postType = items[ 0 ].type;
						document.location.href = addQueryArgs( 'edit.php', {
							post_type: postType,
						} );
					}
					break;
				case 'duplicate-post':
					{
						const newItem = items[ 0 ];
						const title =
							typeof newItem.title === 'string'
								? newItem.title
								: newItem.title?.rendered;
						createSuccessNotice(
							sprintf(
								// translators: %s: Title of the created post e.g: "Post 1".
								__( '"%s" successfully created.' ),
								title
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											const postId = newItem.id;
											document.location.href =
												addQueryArgs( 'post.php', {
													post: postId,
													action: 'edit',
												} );
										},
									},
								],
							}
						);
					}
					break;
			}
		},
		[ createSuccessNotice ]
	);

	return (
		<PluginSidebar
			identifier={ tabName }
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<SettingsHeader ref={ tabListRef } />
				</Tabs.Context.Provider>
			}
			closeLabel={ __( 'Close Settings' ) }
			// This classname is added so we can apply a corrective negative
			// margin to the panel.
			// see https://github.com/WordPress/gutenberg/pull/55360#pullrequestreview-1737671049
			className="edit-post-sidebar__panel"
			headerClassName="edit-post-sidebar__panel-tabs"
			/* translators: button label text should, if possible, be under 16 characters. */
			title={ __( 'Settings' ) }
			toggleShortcut={ keyboardShortcut }
			icon={ isRTL() ? drawerLeft : drawerRight }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<Tabs.TabPanel tabId={ sidebars.document } focusable={ false }>
					<PostCardPanel
						actions={
							<PostActions
								onActionPerformed={ onActionPerformed }
							/>
						}
					/>
					{ ! isEditingTemplate && <PostStatus /> }
					<PluginDocumentSettingPanel.Slot />
					<PostLastRevisionPanel />
					<PostTaxonomiesPanel />
					<PostDiscussionPanel />
					<PageAttributesPanel />
					<PatternOverridesPanel />
					{ ! isEditingTemplate && <MetaBoxes location="side" /> }
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ sidebars.block } focusable={ false }>
					<BlockInspector />
				</Tabs.TabPanel>
			</Tabs.Context.Provider>
		</PluginSidebar>
	);
};

const SettingsSidebar = () => {
	useAutoSwitchEditorSidebars();
	const { tabName, keyboardShortcut, isEditingTemplate } = useSelect(
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
				isEditingTemplate:
					select( editorStore ).getCurrentPostType() ===
					'wp_template',
			};
		},
		[]
	);

	const { openGeneralSidebar } = useDispatch( editPostStore );

	const onTabSelect = useCallback(
		( newSelectedTabId ) => {
			if ( !! newSelectedTabId ) {
				openGeneralSidebar( newSelectedTabId );
			}
		},
		[ openGeneralSidebar ]
	);

	return (
		<Tabs
			selectedTabId={ tabName }
			onSelect={ onTabSelect }
			selectOnMove={ false }
		>
			<SidebarContent
				tabName={ tabName }
				keyboardShortcut={ keyboardShortcut }
				isEditingTemplate={ isEditingTemplate }
			/>
		</Tabs>
	);
};

export default SettingsSidebar;
