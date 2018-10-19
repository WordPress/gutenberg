/**
 * External dependencies
 */
import { castArray, first, last, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { cloneBlock, hasBlockSupport } from '@wordpress/blocks';

function BlockActions( {
	onDuplicate,
	onRemove,
	onInsertBefore,
	onInsertAfter,
	isLocked,
	canDuplicate,
	children,
} ) {
	return children( {
		onDuplicate,
		onRemove,
		onInsertAfter,
		onInsertBefore,
		isLocked,
		canDuplicate,
	} );
}

export default compose( [
	withSelect( ( select, props ) => {
		const {
			getBlocksByClientId,
			getBlockIndex,
			getTemplateLock,
			getBlockRootClientId,
		} = select( 'core/editor' );

		const blocks = getBlocksByClientId( props.clientIds );
		const canDuplicate = every( blocks, ( block ) => {
			return !! block && hasBlockSupport( block.name, 'multiple', true );
		} );
		const rootClientId = getBlockRootClientId( props.clientIds[ 0 ] );

		return {
			firstSelectedIndex: getBlockIndex( first( castArray( props.clientIds ) ), rootClientId ),
			lastSelectedIndex: getBlockIndex( last( castArray( props.clientIds ) ), rootClientId ),
			isLocked: !! getTemplateLock( rootClientId ),
			blocks,
			canDuplicate,
			rootClientId,
			extraProps: props,
		};
	} ),
	withDispatch( ( dispatch, props ) => {
		const {
			clientIds,
			rootClientId,
			blocks,
			firstSelectedIndex,
			lastSelectedIndex,
			isLocked,
			canDuplicate,
		} = props;

		const {
			insertBlocks,
			multiSelect,
			removeBlocks,
			insertDefaultBlock,
		} = dispatch( 'core/editor' );

		return {
			onDuplicate() {
				if ( isLocked || ! canDuplicate ) {
					return;
				}

				const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
				insertBlocks(
					clonedBlocks,
					lastSelectedIndex + 1,
					rootClientId
				);
				if ( clonedBlocks.length > 1 ) {
					multiSelect(
						first( clonedBlocks ).clientId,
						last( clonedBlocks ).clientId
					);
				}
			},
			onRemove() {
				if ( ! isLocked ) {
					removeBlocks( clientIds );
				}
			},
			onInsertBefore() {
				if ( ! isLocked ) {
					insertDefaultBlock( {}, rootClientId, firstSelectedIndex );
				}
			},
			onInsertAfter() {
				if ( ! isLocked ) {
					insertDefaultBlock( {}, rootClientId, lastSelectedIndex + 1 );
				}
			},
		};
	} ),
] )( BlockActions );
