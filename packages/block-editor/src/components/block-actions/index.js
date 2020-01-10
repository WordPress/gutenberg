/**
 * External dependencies
 */
import { castArray, first, last, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { hasBlockSupport, switchToBlockType } from '@wordpress/blocks';

function BlockActions( {
	canDuplicate,
	canInsertDefaultBlock,
	children,
	isLocked,
	onDuplicate,
	onGroup,
	onInsertAfter,
	onInsertBefore,
	onRemove,
	onUngroup,
} ) {
	return children( {
		canDuplicate,
		canInsertDefaultBlock,
		isLocked,
		onDuplicate,
		onGroup,
		onInsertAfter,
		onInsertBefore,
		onRemove,
		onUngroup,
	} );
}

export default compose( [
	withSelect( ( select, props ) => {
		const {
			canInsertBlockType,
			getBlockRootClientId,
			getBlocksByClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const { getDefaultBlockName } = select( 'core/blocks' );

		const blocks = getBlocksByClientId( props.clientIds );
		const rootClientId = getBlockRootClientId( props.clientIds[ 0 ] );
		const canDuplicate = every( blocks, ( block ) => {
			return (
				!! block &&
				hasBlockSupport( block.name, 'multiple', true ) &&
				canInsertBlockType( block.name, rootClientId )
			);
		} );

		const canInsertDefaultBlock = canInsertBlockType(
			getDefaultBlockName(),
			rootClientId
		);

		return {
			blocks,
			canDuplicate,
			canInsertDefaultBlock,
			extraProps: props,
			isLocked: !! getTemplateLock( rootClientId ),
			rootClientId,
		};
	} ),
	withDispatch( ( dispatch, props, { select } ) => {
		const {
			clientIds,
			blocks,
		} = props;

		const {
			removeBlocks,
			replaceBlocks,
			duplicateBlocks,
			insertAfterBlock,
			insertBeforeBlock,
		} = dispatch( 'core/block-editor' );

		return {
			onDuplicate() {
				return duplicateBlocks( clientIds );
			},
			onRemove() {
				removeBlocks( clientIds );
			},
			onInsertBefore() {
				insertBeforeBlock( first( castArray( clientIds ) ) );
			},
			onInsertAfter() {
				insertAfterBlock( last( castArray( clientIds ) ) );
			},
			onGroup() {
				if ( ! blocks.length ) {
					return;
				}

				const {
					getGroupingBlockName,
				} = select( 'core/blocks' );

				const groupingBlockName = getGroupingBlockName();

				// Activate the `transform` on `core/group` which does the conversion
				const newBlocks = switchToBlockType( blocks, groupingBlockName );

				if ( ! newBlocks ) {
					return;
				}
				replaceBlocks(
					clientIds,
					newBlocks
				);
			},

			onUngroup() {
				if ( ! blocks.length ) {
					return;
				}

				const innerBlocks = blocks[ 0 ].innerBlocks;

				if ( ! innerBlocks.length ) {
					return;
				}

				replaceBlocks(
					clientIds,
					innerBlocks
				);
			},
		};
	} ),
] )( BlockActions );
