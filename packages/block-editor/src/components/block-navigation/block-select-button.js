/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { Button, VisuallyHidden } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useBlockNavigationFeaturesContext,
	useBlockNavigationDropTargetContext,
} from './context';
import BlockDraggable from '../block-draggable';
import BlockIcon from '../block-icon';
import { getBlockPositionDescription } from './utils';

const BlockNavigationBlockSelectButton = ( {
	buttonRef,
	onClick,
	block,
	isSelected,
	position,
	siblingBlockCount,
	level,
	onFocus,
	tabIndex,
} ) => {
	const { clientId, name, attributes } = block;
	const {
		rootClientId,
		blockMovingClientId,
		selectedBlockInBlockEditor,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				hasBlockMovingClientId,
				getSelectedBlockClientId,
			} = select( 'core/block-editor' );
			return {
				rootClientId: getBlockRootClientId( clientId ) || '',
				blockMovingClientId: hasBlockMovingClientId(),
				selectedBlockInBlockEditor: getSelectedBlockClientId(),
			};
		},
		[ clientId ]
	);

	const isBlockMoveTarget =
		blockMovingClientId && selectedBlockInBlockEditor === clientId;
	const __experimentalFeatures = useBlockNavigationFeaturesContext();
	const blockDropTarget = useBlockNavigationDropTargetContext();
	const {
		rootClientId: dropTargetRootClientId,
		clientId: dropTargetClientId,
		dropPosition,
	} = blockDropTarget || {};

	const isDroppingBefore =
		dropTargetRootClientId === rootClientId &&
		dropTargetClientId === clientId &&
		dropPosition === 'top';
	const isDroppingAfter =
		dropTargetRootClientId === rootClientId &&
		dropTargetClientId === clientId &&
		dropPosition === 'bottom';
	const isDroppingToInnerBlocks =
		dropTargetRootClientId === clientId && dropPosition === 'inside';

	const className = useMemo( () => {
		return classnames( 'block-editor-block-navigation-block-contents', {
			'is-dropping-before': isDroppingBefore || isBlockMoveTarget,
			'is-dropping-after': isDroppingAfter,
			'is-dropping-to-inner-blocks': isDroppingToInnerBlocks,
		} );
	}, [ isDroppingBefore, isDroppingAfter, isDroppingToInnerBlocks ] );

	const clientIds = useMemo( () => [ clientId ], [ clientId ] );
	const instanceId = useInstanceId( BlockNavigationBlockSelectButton );
	const blockType = getBlockType( name );
	const blockDisplayName = getBlockLabel( blockType, attributes );
	const descriptionId = `block-navigation-block-select-button__${ instanceId }`;
	const blockPositionDescription = getBlockPositionDescription(
		position,
		siblingBlockCount,
		level
	);

	return (
		<BlockDraggable
			clientIds={ clientIds }
			elementId={ `block-navigation-block-${ clientId }` }
		>
			{ ( { isDraggable, onDraggableStart, onDraggableEnd } ) => (
				<>
					<Button
						className={ classnames(
							'block-editor-block-navigation-block-select-button',
							className
						) }
						onClick={ onClick }
						aria-describedby={ descriptionId }
						ref={ buttonRef }
						tabIndex={ tabIndex }
						onFocus={ onFocus }
						onDragStart={ onDraggableStart }
						onDragEnd={ onDraggableEnd }
						draggable={ isDraggable && __experimentalFeatures }
					>
						<BlockIcon icon={ blockType.icon } showColors />
						{ blockDisplayName }
						{ isSelected && (
							<VisuallyHidden>
								{ __( '(selected block)' ) }
							</VisuallyHidden>
						) }
					</Button>
					<div
						className="block-editor-block-navigation-block-select-button__description"
						id={ descriptionId }
					>
						{ blockPositionDescription }
					</div>
				</>
			) }
		</BlockDraggable>
	);
};

export default BlockNavigationBlockSelectButton;
