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

function TabBlockMover( {
	tabClientId,
	tabIndex,
	tabsCount,
	tabsMenuClientId,
	tabsClientId,
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
			// Get orientation directly from the tabs-menu block's layout attribute.
			// This is more reliable than getBlockListSettings which is set asynchronously.
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

	// Icons and labels based on orientation (respects RTL for horizontal)
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

	// Handle moving tab and updating active index to follow the moved tab
	const handleMoveUp = () => {
		moveBlocksUp( [ tabClientId ], tabPanelClientId );
		// Update editorActiveTabIndex to follow the moved tab
		if ( tabsClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: tabIndex - 1,
			} );
		}
	};

	const handleMoveDown = () => {
		moveBlocksDown( [ tabClientId ], tabPanelClientId );
		// Update editorActiveTabIndex to follow the moved tab
		if ( tabsClientId ) {
			__unstableMarkNextChangeAsNotPersistent();
			updateBlockAttributes( tabsClientId, {
				editorActiveTabIndex: tabIndex + 1,
			} );
		}
	};

	// Don't render if only one tab
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
	tabsClientId,
	tabClientId,
	tabIndex,
	tabsCount,
	tabsMenuClientId,
} ) {
	return (
		<>
			<TabBlockMover
				tabClientId={ tabClientId }
				tabIndex={ tabIndex }
				tabsCount={ tabsCount }
				tabsMenuClientId={ tabsMenuClientId }
				tabsClientId={ tabsClientId }
			/>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
		</>
	);
}
