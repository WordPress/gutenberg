/**
 * WordPress dependencies
 */
import { __, isRTL, _x } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';
import {
	useCallback,
	useContext,
	useEffect,
	useRef,
	forwardRef,
} from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PluginSidebar from '../plugin-sidebar';
import RevisionsSidebarContent from './revisions-sidebar-content';
import { sidebars } from './constants';
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

/**
 * Custom header for revisions sidebar that shows "Revision" instead of post type.
 */
const RevisionsSidebarHeader = forwardRef( ( _, ref ) => {
	return (
		<Tabs.TabList ref={ ref }>
			<Tabs.Tab
				tabId={ sidebars.document }
				data-tab-id={ sidebars.document }
			>
				{ __( 'Revision' ) }
			</Tabs.Tab>
			<Tabs.Tab tabId={ sidebars.block } data-tab-id={ sidebars.block }>
				{ __( 'Block' ) }
			</Tabs.Tab>
		</Tabs.TabList>
	);
} );

/**
 * Standalone sidebar for revisions mode.
 * Uses the same identifier as the document sidebar so it responds to the same
 * toggle button and keyboard shortcut.
 */

const RevisionsSidebarContent_ = ( {
	tabName,
	keyboardShortcut,
	diffStats,
	revisionId,
	revisionDate,
	revisionContent,
} ) => {
	const tabListRef = useRef( null );
	// Because `PluginSidebar` renders a `ComplementaryArea`, we
	// need to forward the `Tabs` context so it can be passed through the
	// underlying slot/fill.
	const tabsContextValue = useContext( Tabs.Context );

	// This effect addresses a race condition caused by tabbing from the last
	// block in the editor into the settings sidebar.
	useEffect( () => {
		const tabsElements = Array.from(
			tabListRef.current?.querySelectorAll( '[role="tab"]' ) || []
		);
		const selectedTabElement = tabsElements.find(
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

	return (
		<PluginSidebar
			identifier={ tabName }
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<RevisionsSidebarHeader ref={ tabListRef } />
				</Tabs.Context.Provider>
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
			isActiveByDefault
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				<Tabs.TabPanel tabId={ sidebars.document } focusable={ false }>
					<RevisionsSidebarContent
						diffStats={ diffStats }
						revisionId={ revisionId }
						revisionDate={ revisionDate }
						revisionContent={ revisionContent }
					/>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId={ sidebars.block } focusable={ false }>
					<div className="editor-sidebar__revisions-block-message">
						{ __(
							'Block settings are not available when previewing revisions.'
						) }
					</div>
				</Tabs.TabPanel>
			</Tabs.Context.Provider>
		</PluginSidebar>
	);
};

export default function RevisionsSidebar( {
	diffStats,
	revisionId,
	revisionDate,
	revisionContent,
} ) {
	const { tabName, keyboardShortcut } = useSelect( ( select ) => {
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
			_tabName = !! select( blockEditorStore ).getBlockSelectionStart()
				? sidebars.block
				: sidebars.document;
		}

		return {
			tabName: _tabName,
			keyboardShortcut: shortcut,
		};
	}, [] );

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
		<Tabs
			selectedTabId={ tabName }
			onSelect={ onTabSelect }
			selectOnMove={ false }
		>
			<RevisionsSidebarContent_
				tabName={ tabName }
				keyboardShortcut={ keyboardShortcut }
				diffStats={ diffStats }
				revisionId={ revisionId }
				revisionDate={ revisionDate }
				revisionContent={ revisionContent }
			/>
		</Tabs>
	);
}
