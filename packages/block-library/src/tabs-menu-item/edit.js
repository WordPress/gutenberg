/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	useBlockProps,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import slugFromLabel from '../tab/slug-from-label';
import Controls from './controls';

export default function Edit( {
	context,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	// Context from tabs-menu (per-item context via BlockContextProvider)
	const tabIndex = context[ 'core/tabs-menu-item-index' ] ?? 0;
	const tabId = context[ 'core/tabs-menu-item-id' ] ?? '';
	const tabLabel = context[ 'core/tabs-menu-item-label' ] ?? '';
	const tabClientId = context[ 'core/tabs-menu-item-clientId' ] ?? '';

	// Context from parent tabs block, memoized to prevent unnecessary re-renders.
	const contextTabsList = context[ 'core/tabs-list' ];
	const tabsList = useMemo(
		() => contextTabsList || [],
		[ contextTabsList ]
	);
	const activeTabIndex = context[ 'core/tabs-activeTabIndex' ] ?? 0;
	const editorActiveTabIndex = context[ 'core/tabs-editorActiveTabIndex' ];

	// Memoize effectiveActiveIndex to ensure it updates when context changes
	const effectiveActiveIndex = useMemo( () => {
		return editorActiveTabIndex ?? activeTabIndex;
	}, [ editorActiveTabIndex, activeTabIndex ] );

	const isActiveTab = tabIndex === effectiveActiveIndex;

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	// Get parent tabs clientId for updating editorActiveTabIndex
	const { tabsClientId, tabsMenuClientId, selectedTabClientId } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getSelectedBlockClientIds,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );
			// tabs-menu-item -> tabs-menu -> tabs
			const _tabsMenuClientId = getBlockRootClientId( clientId );
			const _tabsClientId = _tabsMenuClientId
				? getBlockRootClientId( _tabsMenuClientId )
				: null;

			const selectedIds = getSelectedBlockClientIds();

			// Find if any tab is selected
			let selectedTab = null;
			for ( const tab of tabsList ) {
				if (
					selectedIds.includes( tab.clientId ) ||
					hasSelectedInnerBlock( tab.clientId, true )
				) {
					selectedTab = tab.clientId;
					break;
				}
			}

			return {
				tabsClientId: _tabsClientId,
				tabsMenuClientId: _tabsMenuClientId,
				selectedTabClientId: selectedTab,
			};
		},
		[ clientId, tabsList ]
	);

	const isSelectedTab = tabClientId === selectedTabClientId;

	// Update tab label in the tab block
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const handleLabelChange = useCallback(
		( newLabel ) => {
			if ( tabClientId ) {
				updateBlockAttributes( tabClientId, {
					label: newLabel,
					anchor: slugFromLabel( newLabel, tabIndex ),
				} );
			}
		},
		[ updateBlockAttributes, tabClientId, tabIndex ]
	);

	// Update editor active tab index on parent tabs block when tab is clicked
	const handleTabClick = useCallback(
		( event ) => {
			event.preventDefault();

			// Update the parent tabs block's editorActiveTabIndex (ephemeral, not persisted)
			if ( tabsClientId && tabIndex !== effectiveActiveIndex ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( tabsClientId, {
					editorActiveTabIndex: tabIndex,
				} );
			}
		},
		[
			tabsClientId,
			tabIndex,
			effectiveActiveIndex,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);

	const tabPanelId = tabId || `tab-${ tabIndex }`;
	const tabLabelId = `${ tabPanelId }--tab`;

	// Use blockProps for core style engine support
	const blockProps = useBlockProps( {
		className: clsx( layoutClassNames, {
			'is-active': isActiveTab,
			'is-selected': isSelectedTab,
		} ),
		'aria-controls': tabPanelId,
		'aria-selected': isActiveTab,
		id: tabLabelId,
		role: 'tab',
		tabIndex: -1,
		onClick: handleTabClick,
	} );

	return (
		<>
			<Controls
				tabsClientId={ tabsClientId }
				tabClientId={ tabClientId }
				tabIndex={ tabIndex }
				tabsCount={ tabsList.length }
				tabsMenuClientId={ tabsMenuClientId }
			/>
			<div { ...blockProps }>
				<RichText
					tagName="span"
					withoutInteractiveFormatting
					placeholder={ sprintf(
						/* translators: %d is the tab index + 1 */
						__( 'Tab title %d' ),
						tabIndex + 1
					) }
					value={ tabLabel || '' }
					onChange={ handleLabelChange }
				/>
			</div>
		</>
	);
}
