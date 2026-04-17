/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';

const EMPTY_ARRAY = [];

function Edit( { context, clientId } ) {
	const tabsList = context[ 'core/tabs-list' ] || EMPTY_ARRAY;
	const activeTabIndex = context[ 'core/tabs-activeTabIndex' ];
	const editorActiveTabIndex = context[ 'core/tabs-editorActiveTabIndex' ];

	const effectiveActiveIndex = useMemo( () => {
		return editorActiveTabIndex ?? activeTabIndex;
	}, [ editorActiveTabIndex, activeTabIndex ] );

	const { menuItemIndex, tabsClientId, selectedTabClientId } = useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockRootClientId,
				getSelectedBlockClientIds,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );

			const _tabsMenuClientId = getBlockRootClientId( clientId );
			const _tabsClientId = _tabsMenuClientId
				? getBlockRootClientId( _tabsMenuClientId )
				: null;

			const siblings = getBlockOrder( _tabsMenuClientId );
			const _menuItemIndex = siblings.indexOf( clientId );

			// Find which tab panel block is currently selected.
			const selectedIds = getSelectedBlockClientIds();
			let _selectedTabClientId = null;
			for ( const tab of tabsList ) {
				if (
					selectedIds.includes( tab.clientId ) ||
					hasSelectedInnerBlock( tab.clientId, true )
				) {
					_selectedTabClientId = tab.clientId;
					break;
				}
			}

			return {
				menuItemIndex: _menuItemIndex,
				tabsClientId: _tabsClientId,
				selectedTabClientId: _selectedTabClientId,
			};
		},
		[ clientId, tabsList ]
	);

	const tab = tabsList[ menuItemIndex ] || {};

	// tabListIndex is the tab's position in tabsList, used for active-state
	// checks and click handling.
	const tabListIndex = tab.index ?? menuItemIndex;

	const tabClientId = tab.clientId || '';
	const label = tab.label || '';

	const isActive = tabListIndex === effectiveActiveIndex;
	const isSelected = tabClientId === selectedTabClientId;

	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const handleTabClick = useCallback(
		( event ) => {
			event.preventDefault();
			if ( tabsClientId && tabListIndex !== effectiveActiveIndex ) {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( tabsClientId, {
					editorActiveTabIndex: tabListIndex,
				} );
			}
		},
		[
			tabsClientId,
			tabListIndex,
			effectiveActiveIndex,
			updateBlockAttributes,
			__unstableMarkNextChangeAsNotPersistent,
		]
	);

	const handleLabelChange = useCallback(
		( newLabel ) => {
			if ( tabClientId ) {
				updateBlockAttributes( tabClientId, { label: newLabel } );
			}
		},
		[ tabClientId, updateBlockAttributes ]
	);

	const blockProps = useBlockProps( {
		className: clsx( {
			'is-active': isActive,
			'is-selected': isSelected,
		} ),
		tabIndex: -1,
		onClick: handleTabClick,
	} );

	return (
		<>
			<Controls tabsClientId={ tabsClientId } />
			<button { ...blockProps } type="button">
				<RichText
					tagName="span"
					withoutInteractiveFormatting
					placeholder={ __( 'Tab title' ) }
					value={ label }
					onChange={ handleLabelChange }
				/>
			</button>
		</>
	);
}

export default Edit;
