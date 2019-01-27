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
			getTemplateLock,
			getBlockRootClientId,
		} = select( 'core/editor' );

		const blocks = getBlocksByClientId( props.clientIds );
		const canDuplicate = every( blocks, ( block ) => {
			return !! block && hasBlockSupport( block.name, 'multiple', true );
		} );
		const rootClientId = getBlockRootClientId( props.clientIds[ 0 ] );

		return {
			isLocked: !! getTemplateLock( rootClientId ),
			blocks,
			canDuplicate,
			rootClientId,
			extraProps: props,
		};
	} ),
	withDispatch( ( dispatch, props, { select } ) => {
		const {
			clientIds,
			rootClientId,
			blocks,
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

				const { getBlockIndex } = select( 'core/editor' );
				const lastSelectedIndex = getBlockIndex( last( castArray( clientIds ) ), rootClientId );
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
					const { getBlockIndex } = select( 'core/editor' );
					const firstSelectedIndex = getBlockIndex( first( castArray( clientIds ) ), rootClientId );
					insertDefaultBlock( {}, rootClientId, firstSelectedIndex );
				}
			},
			onInsertAfter() {
				if ( ! isLocked ) {
					const { getBlockIndex } = select( 'core/editor' );
					const lastSelectedIndex = getBlockIndex( last( castArray( clientIds ) ), rootClientId );
					insertDefaultBlock( {}, rootClientId, lastSelectedIndex + 1 );
				}
			},
		};
	} ),
] )( BlockActions );
