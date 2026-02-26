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
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Controls from './controls';

const EMPTY_ARRAY = [];

function Edit( {
	context,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
} ) {
	const tabsList = context[ 'core/tabs-list' ] || EMPTY_ARRAY;
	const activeTabIndex = context[ 'core/tabs-activeTabIndex' ] ?? 0;
	const editorActiveTabIndex = context[ 'core/tabs-editorActiveTabIndex' ];

	const effectiveActiveIndex = useMemo( () => {
		return editorActiveTabIndex ?? activeTabIndex;
	}, [ editorActiveTabIndex, activeTabIndex ] );

	const { tabIndex, tabsClientId, tabsMenuClientId, selectedTabClientId } =
		useSelect(
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

				// Determine this button's index by its position within tabs-menu.
				const siblings = getBlockOrder( _tabsMenuClientId );
				const _tabIndex = siblings.indexOf( clientId );

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
					tabIndex: _tabIndex,
					tabsClientId: _tabsClientId,
					tabsMenuClientId: _tabsMenuClientId,
					selectedTabClientId: _selectedTabClientId,
				};
			},
			[ clientId, tabsList ]
		);

	const tab = tabsList[ tabIndex ] ?? {};
	const tabId = tab.id || `tab-${ tabIndex }`;
	const tabClientId = tab.clientId || '';
	const label = tab.label || '';

	const isActive = tabIndex === effectiveActiveIndex;
	const isSelected = tabClientId === selectedTabClientId;

	const { __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const handleTabClick = useCallback(
		( event ) => {
			event.preventDefault();
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

	const handleLabelChange = useCallback(
		( newLabel ) => {
			if ( tabClientId ) {
				updateBlockAttributes( tabClientId, { label: newLabel } );
			}
		},
		[ tabClientId, updateBlockAttributes ]
	);

	const blockProps = useBlockProps( {
		className: clsx( layoutClassNames, {
			'is-active': isActive,
			'is-selected': isSelected,
		} ),
		'aria-controls': tabId,
		'aria-selected': isActive,
		id: `${ tabId }--tab`,
		role: 'tab',
		tabIndex: -1,
		onClick: handleTabClick,
	} );

	return (
		<>
			<Controls
				tabIndex={ tabIndex }
				tabsCount={ tabsList.length }
				tabClientId={ tabClientId }
				tabsClientId={ tabsClientId }
				tabsMenuClientId={ tabsMenuClientId }
				menuItemClientId={ clientId }
			/>
			<button { ...blockProps } type="button">
				<RichText
					tagName="span"
					withoutInteractiveFormatting
					placeholder={ sprintf(
						/* translators: %d is the tab index + 1 */
						__( 'Tab title %d' ),
						tabIndex + 1
					) }
					value={ label }
					onChange={ handleLabelChange }
				/>
			</button>
		</>
	);
}

export default Edit;
