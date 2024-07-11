/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, VisuallyHidden } from '@wordpress/components';
import {
	chevronLeft,
	chevronUp,
	chevronDown,
	chevronRight,
} from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';
import { store as blockEditorStore } from '../../store';

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

	return (
		<BlockControls group="parent">
			<GridItemMover
				className="is-left-button"
				icon={ chevronLeft }
				label={ __( 'Move block left' ) }
				description={ __( 'Move block left' ) }
				isDisabled={ columnStart <= 1 }
				onClick={ () => {
					onChange( {
						columnStart: columnStart - 1,
					} );
					__unstableMarkNextChangeAsNotPersistent();
					moveBlocksToPosition(
						[ blockClientId ],
						gridClientId,
						gridClientId,
						getNumberOfBlocksBeforeCell( columnStart - 1, rowStart )
					);
				} }
			/>
			<div className="block-editor-block-mover__move-button-container">
				<GridItemMover
					className="is-up-button"
					icon={ chevronUp }
					label={ __( 'Move block up' ) }
					description={ __( 'Move block up' ) }
					isDisabled={ rowStart <= 1 }
					onClick={ () => {
						onChange( {
							rowStart: rowStart - 1,
						} );
						__unstableMarkNextChangeAsNotPersistent();
						moveBlocksToPosition(
							[ blockClientId ],
							gridClientId,
							gridClientId,
							getNumberOfBlocksBeforeCell(
								columnStart,
								rowStart - 1
							)
						);
					} }
				/>
				<GridItemMover
					className="is-down-button"
					icon={ chevronDown }
					label={ __( 'Move block down' ) }
					description={ __( 'Move block down' ) }
					isDisabled={ rowCount && rowEnd >= rowCount }
					onClick={ () => {
						onChange( {
							rowStart: rowStart + 1,
						} );
						__unstableMarkNextChangeAsNotPersistent();
						moveBlocksToPosition(
							[ blockClientId ],
							gridClientId,
							gridClientId,
							getNumberOfBlocksBeforeCell(
								columnStart,
								rowStart + 1
							)
						);
					} }
				/>
			</div>
			<GridItemMover
				className="is-right-button"
				icon={ chevronRight }
				label={ __( 'Move block right' ) }
				description={ __( 'Move block right' ) }
				isDisabled={ columnCount && columnEnd >= columnCount }
				onClick={ () => {
					onChange( {
						columnStart: columnStart + 1,
					} );
					__unstableMarkNextChangeAsNotPersistent();
					moveBlocksToPosition(
						[ blockClientId ],
						gridClientId,
						gridClientId,
						getNumberOfBlocksBeforeCell( columnStart + 1, rowStart )
					);
				} }
			/>
		</BlockControls>
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
	const descriptionId = `block-editor-block-mover-button__description-${ instanceId }`;
	return (
		<>
			<Button
				className={ clsx(
					'block-editor-block-mover-button',
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
