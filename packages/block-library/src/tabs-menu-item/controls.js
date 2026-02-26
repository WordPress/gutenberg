/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarItem, Button } from '@wordpress/components';
import {
	chevronLeft,
	chevronRight,
	chevronUp,
	chevronDown,
} from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab/remove-tab-toolbar-control';

/**
 * Toolbar controls for moving a tab (and its menu item) left/right/up/down.
 * Both the core/tab block and the core/tabs-menu-item block are moved together
 * to keep them in sync.
 *
 * @param {Object} props
 * @param {number} props.tabIndex         Zero-based position of this tab.
 * @param {number} props.tabsCount        Total number of tabs.
 * @param {string} props.tabClientId      Client ID of the core/tab block.
 * @param {string} props.tabsClientId     Client ID of the core/tabs block.
 * @param {string} props.tabsMenuClientId Client ID of the core/tabs-menu block.
 * @param {string} props.menuItemClientId Client ID of this core/tabs-menu-item.
 */
function TabBlockMover( {
	tabIndex,
	tabsCount,
	tabClientId,
	tabsClientId,
	tabsMenuClientId,
	menuItemClientId,
} ) {
	const {
		moveBlocksUp,
		moveBlocksDown,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const { tabPanelClientId, orientation } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockAttributes } =
				select( blockEditorStore );
			const tabsMenuAttributes = tabsMenuClientId
				? getBlockAttributes( tabsMenuClientId )
				: null;
			return {
				tabPanelClientId: getBlockRootClientId( tabClientId ),
				orientation:
					tabsMenuAttributes?.layout?.orientation || 'horizontal',
			};
		},
		[ tabClientId, tabsMenuClientId ]
	);

	const isFirst = tabIndex === 0;
	const isLast = tabIndex === tabsCount - 1;
	const isHorizontal = orientation === 'horizontal';

	let upIcon, downIcon, upLabel, downLabel;
	if ( isHorizontal ) {
		if ( isRTL() ) {
			upIcon = chevronRight;
			downIcon = chevronLeft;
			upLabel = __( 'Move tab right' );
			downLabel = __( 'Move tab left' );
		} else {
			upIcon = chevronLeft;
			downIcon = chevronRight;
			upLabel = __( 'Move tab left' );
			downLabel = __( 'Move tab right' );
		}
	} else {
		upIcon = chevronUp;
		downIcon = chevronDown;
		upLabel = __( 'Move tab up' );
		downLabel = __( 'Move tab down' );
	}

	const handleMoveUp = () => {
		// Move both the tab content block and the menu item button together.
		moveBlocksUp( [ tabClientId ], tabPanelClientId );
		moveBlocksUp( [ menuItemClientId ], tabsMenuClientId );
		if ( tabsClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: tabIndex - 1,
			} );
		}
	};

	const handleMoveDown = () => {
		moveBlocksDown( [ tabClientId ], tabPanelClientId );
		moveBlocksDown( [ menuItemClientId ], tabsMenuClientId );
		if ( tabsClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: tabIndex + 1,
			} );
		}
	};

	if ( tabsCount <= 1 ) {
		return null;
	}

	return (
		<BlockControls group="parent">
			<ToolbarGroup
				className={ clsx( 'block-editor-block-mover', {
					'is-horizontal': isHorizontal,
				} ) }
			>
				<div className="block-editor-block-mover__move-button-container">
					<ToolbarItem>
						{ ( itemProps ) => (
							<Button
								className={ clsx(
									'block-editor-block-mover-button',
									'is-up-button'
								) }
								icon={ upIcon }
								label={ upLabel }
								disabled={ isFirst }
								accessibleWhenDisabled
								onClick={ handleMoveUp }
								__next40pxDefaultSize
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
					<ToolbarItem>
						{ ( itemProps ) => (
							<Button
								className={ clsx(
									'block-editor-block-mover-button',
									'is-down-button'
								) }
								icon={ downIcon }
								label={ downLabel }
								disabled={ isLast }
								accessibleWhenDisabled
								onClick={ handleMoveDown }
								__next40pxDefaultSize
								{ ...itemProps }
							/>
						) }
					</ToolbarItem>
				</div>
			</ToolbarGroup>
		</BlockControls>
	);
}

export default function Controls( {
	tabIndex,
	tabsCount,
	tabClientId,
	tabsClientId,
	tabsMenuClientId,
	menuItemClientId,
} ) {
	return (
		<>
			<TabBlockMover
				tabIndex={ tabIndex }
				tabsCount={ tabsCount }
				tabClientId={ tabClientId }
				tabsClientId={ tabsClientId }
				tabsMenuClientId={ tabsMenuClientId }
				menuItemClientId={ menuItemClientId }
			/>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
		</>
	);
}
