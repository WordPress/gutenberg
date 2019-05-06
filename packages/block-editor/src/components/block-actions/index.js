/**
 * External dependencies
 */
import { castArray, first, last, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { cloneBlock, hasBlockSupport, switchToBlockType } from '@wordpress/blocks';

function BlockActions( {
	onDuplicate,
	onRemove,
	onInsertBefore,
	onInsertAfter,
	onGroup,
	onUnGroup,
	isLocked,
	canDuplicate,
	children,
} ) {
	return children( {
		onDuplicate,
		onRemove,
		onInsertAfter,
		onInsertBefore,
		onGroup,
		onUnGroup,
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
		} = select( 'core/block-editor' );

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
			replaceBlocks,
		} = dispatch( 'core/block-editor' );

		return {
			onDuplicate() {
				if ( isLocked || ! canDuplicate ) {
					return;
				}

				const { getBlockIndex } = select( 'core/block-editor' );
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
					const { getBlockIndex } = select( 'core/block-editor' );
					const firstSelectedIndex = getBlockIndex( first( castArray( clientIds ) ), rootClientId );
					insertDefaultBlock( {}, rootClientId, firstSelectedIndex );
				}
			},
			onInsertAfter() {
				if ( ! isLocked ) {
					const { getBlockIndex } = select( 'core/block-editor' );
					const lastSelectedIndex = getBlockIndex( last( castArray( clientIds ) ), rootClientId );
					insertDefaultBlock( {}, rootClientId, lastSelectedIndex + 1 );
				}
			},
			onGroup() {
				if ( ! blocks.length ) {
					return;
				}

				// Activate the `transform` on `core/group` which does the conversion
				const newBlocks = switchToBlockType( blocks, 'core/group' );

				if ( ! newBlocks ) {
					return;
				}
				replaceBlocks(
					clientIds,
					newBlocks
				);
			},

			onUnGroup() {
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
