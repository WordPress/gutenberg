/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import {
	chevronLeft,
	chevronUp,
	chevronDown,
	chevronRight,
} from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import { store as blockEditorStore } from '../../store';
import RegisterGridMovementShortcuts from './register-grid-shortcuts';

export function GridItemMovers( {
	layout,
	parentLayout,
	onChange,
	gridClientId,
	blockClientId,
} ) {
	const { moveBlocksToPosition, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const columnStart = layout?.columnStart ?? 1;
	const rowStart = layout?.rowStart ?? 1;
	const columnSpan = layout?.columnSpan ?? 1;
	const rowSpan = layout?.rowSpan ?? 1;
	const columnEnd = columnStart + columnSpan - 1;
	const rowEnd = rowStart + rowSpan - 1;
	const columnCount = parentLayout?.columnCount;
	const rowCount = parentLayout?.rowCount;

	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		columnCount
	);

	// Helper functions for grid item movement.
	const moveLeft = () => {
		if ( columnStart <= 1 ) {
			return;
		}
		onChange( { columnStart: columnStart - 1 } );
		__unstableMarkNextChangeAsNotPersistent();
		moveBlocksToPosition(
			[ blockClientId ],
			gridClientId,
			gridClientId,
			getNumberOfBlocksBeforeCell( columnStart - 1, rowStart )
		);
	};

	const moveRight = () => {
		if ( columnCount && columnEnd >= columnCount ) {
			return;
		}
		onChange( { columnStart: columnStart + 1 } );
		__unstableMarkNextChangeAsNotPersistent();
		moveBlocksToPosition(
			[ blockClientId ],
			gridClientId,
			gridClientId,
			getNumberOfBlocksBeforeCell( columnStart + 1, rowStart )
		);
	};

	const moveUp = () => {
		if ( rowStart <= 1 ) {
			return;
		}
		onChange( { rowStart: rowStart - 1 } );
		__unstableMarkNextChangeAsNotPersistent();
		moveBlocksToPosition(
			[ blockClientId ],
			gridClientId,
			gridClientId,
			getNumberOfBlocksBeforeCell( columnStart, rowStart - 1 )
		);
	};

	const moveDown = () => {
		if ( rowCount && rowEnd >= rowCount ) {
			return;
		}
		onChange( { rowStart: rowStart + 1 } );
		__unstableMarkNextChangeAsNotPersistent();
		moveBlocksToPosition(
			[ blockClientId ],
			gridClientId,
			gridClientId,
			getNumberOfBlocksBeforeCell( columnStart, rowStart + 1 )
		);
	};

	// Register keyboard shortcuts for grid item movement.
	useShortcut( 'core/block-editor/move-grid-item-left', ( event ) => {
		event.preventDefault();
		moveLeft();
	} );

	useShortcut( 'core/block-editor/move-grid-item-right', ( event ) => {
		event.preventDefault();
		moveRight();
	} );

	useShortcut( 'core/block-editor/move-grid-item-up', ( event ) => {
		event.preventDefault();
		moveUp();
	} );

	useShortcut( 'core/block-editor/move-grid-item-down', ( event ) => {
		event.preventDefault();
		moveDown();
	} );

	return (
		<>
			<RegisterGridMovementShortcuts />
			<BlockControls group="parent">
				<ToolbarGroup className="block-editor-grid-item-mover__move-button-container">
					<div className="block-editor-grid-item-mover__move-horizontal-button-container is-left">
						<GridItemMover
							icon={ isRTL() ? chevronRight : chevronLeft }
							label={ __( 'Move left' ) }
							description={ __( 'Move left' ) }
							isDisabled={ columnStart <= 1 }
							onClick={ moveLeft }
						/>
					</div>
					<div className="block-editor-grid-item-mover__move-vertical-button-container">
						<GridItemMover
							className="is-up-button"
							icon={ chevronUp }
							label={ __( 'Move up' ) }
							description={ __( 'Move up' ) }
							isDisabled={ rowStart <= 1 }
							onClick={ moveUp }
						/>
						<GridItemMover
							className="is-down-button"
							icon={ chevronDown }
							label={ __( 'Move down' ) }
							description={ __( 'Move down' ) }
							isDisabled={ rowCount && rowEnd >= rowCount }
							onClick={ moveDown }
						/>
					</div>
					<div className="block-editor-grid-item-mover__move-horizontal-button-container is-right">
						<GridItemMover
							icon={ isRTL() ? chevronLeft : chevronRight }
							label={ __( 'Move right' ) }
							description={ __( 'Move right' ) }
							isDisabled={
								columnCount && columnEnd >= columnCount
							}
							onClick={ moveRight }
						/>
					</div>
				</ToolbarGroup>
			</BlockControls>
		</>
	);
}

function GridItemMover( {
	className,
	icon,
	label,
	isDisabled,
	onClick,
	description,
} ) {
	const instanceId = useInstanceId( GridItemMover );
	const descriptionId = `block-editor-grid-item-mover-button__description-${ instanceId }`;
	return (
		<>
			<ToolbarButton
				className={ clsx(
					'block-editor-grid-item-mover-button',
					className
				) }
				icon={ icon }
				label={ label }
				aria-describedby={ descriptionId }
				onClick={ isDisabled ? null : onClick }
				disabled={ isDisabled }
				accessibleWhenDisabled
			/>
			<VisuallyHidden id={ descriptionId }>
				{ description }
			</VisuallyHidden>
		</>
	);
}
