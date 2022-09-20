/**
 * WordPress dependencies
 */
import {
	cloneBlock,
	findTransform,
	getBlockTransforms,
	pasteHandler,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { getFilesFromDataTransfer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

/**
 * Retrieve the data for a block drop event.
 *
 * @param {WPSyntheticEvent} event The drop event.
 *
 * @return {Object} An object with block drag and drop data.
 */
export function parseDropEvent( event ) {
	let result = {
		srcRootClientId: null,
		srcClientIds: null,
		srcIndex: null,
		type: null,
		blocks: null,
	};

	if ( ! event.dataTransfer ) {
		return result;
	}

	try {
		result = Object.assign(
			result,
			JSON.parse( event.dataTransfer.getData( 'wp-blocks' ) )
		);
	} catch ( err ) {
		return result;
	}

	return result;
}

/**
 * A function that returns an event handler function for block drop events.
 *
 * @param {Object}   options            The options object.
 * @param {Function} options.addBlocks  A function that inserts or replaces blocks.
 * @param {Function} options.moveBlocks A function that moves blocks.
 * @return {Function} The event handler for a block drop event.
 */
export function useOnBlocksDrop( { addBlocks, moveBlocks } ) {
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	return ( event ) => {
		const {
			srcClientIds: sourceClientIds,
			type: dropType,
			blocks,
		} = parseDropEvent( event );

		// If the user is inserting a block.
		if ( dropType === 'inserter' ) {
			clearSelectedBlock();
			const blocksToInsert = blocks.map( ( block ) =>
				cloneBlock( block )
			);
			addBlocks( blocksToInsert, {
				updateSelection: true,
				initialPosition: null,
			} );
		}

		// If the user is moving a block.
		if ( dropType === 'block' ) {
			moveBlocks( sourceClientIds );
		}
	};
}

/**
 * A function that returns an event handler function for block-related file drop events.
 *
 * @param {Object}   options              The options object.
 * @param {Function} options.addBlocks    A function that insert or replace blocks.
 * @param {string}   options.rootClientId The target root client Id.
 *
 * @return {Function} The event handler for a block-related file drop event.
 */
export function useOnFilesDrop( { addBlocks, rootClientId } ) {
	const { hasUploadPermissions, canInsertBlockType } = useSelect(
		( select ) => ( {
			hasUploadPermissions:
				!! select( blockEditorStore ).getSettings().mediaUpload,
			canInsertBlockType: select( blockEditorStore ).canInsertBlockType,
		} ),
		[]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return ( files ) => {
		if ( ! hasUploadPermissions ) {
			return;
		}

		const transformation = findTransform(
			getBlockTransforms( 'from' ),
			( transform ) =>
				transform.type === 'files' &&
				canInsertBlockType( transform.blockName, rootClientId ) &&
				transform.isMatch( files )
		);

		if ( transformation ) {
			const blocks = transformation.transform(
				files,
				updateBlockAttributes
			);
			addBlocks( blocks );
		}
	};
}

/**
 * A function that returns an event handler function for block-related HTML drop events.
 *
 * @param {Object}   options           The options object.
 * @param {Function} options.addBlocks A function that add or replace blocks.
 *
 * @return {Function} The event handler for a block-related HTML drop event.
 */
export function useOnHTMLDrop( { addBlocks } ) {
	return ( HTML ) => {
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			addBlocks( blocks );
		}
	};
}

/**
 * A React hook for handling block drop events.
 *
 * @typedef {'insert'|'replace'} DropAction The type of action to perform on drop.
 *
 * @param {string}     targetRootClientId The root client id where the block(s) will be inserted.
 * @param {number}     targetBlockIndex   The index where the block(s) will be inserted.
 * @param {Object}     options            The optional options.
 * @param {DropAction} options.action     The type of action to perform on drop. Could be `insert` or `replace` for now.
 *
 * @return {Object} An object that contains the event handlers `onDrop`, `onFilesDrop` and `onHTMLDrop`.
 */
export default function useOnBlockDrop(
	targetRootClientId,
	targetBlockIndex,
	options = {}
) {
	const { action = 'insert' } = options;
	const {
		getBlockIndex,
		getBlockOrder,
		getBlockRootClientId,
		getBlocksByClientId,
	} = useSelect( blockEditorStore );
	const { insertBlocks, replaceBlocks, moveBlocksToPosition, removeBlocks } =
		useDispatch( blockEditorStore );

	const addBlocks = (
		blocks,
		{ updateSelection = true, initialPosition = 0 } = {}
	) => {
		if ( action === 'replace' ) {
			const clientIds = getBlockOrder( targetRootClientId );
			const clientId = clientIds[ targetBlockIndex ];

			replaceBlocks( clientId, blocks, undefined, initialPosition );
		} else {
			insertBlocks(
				blocks,
				targetBlockIndex,
				targetRootClientId,
				updateSelection,
				initialPosition
			);
		}
	};

	const moveBlocks = ( clientIds ) => {
		const firstClientId = clientIds[ 0 ];
		const rootClientId = getBlockRootClientId( firstClientId );
		const sourceBlockIndex = getBlockIndex( firstClientId );

		const isAtSameLevel = rootClientId === targetRootClientId;
		const draggedBlockCount = clientIds.length;

		// If the block is kept at the same level and moved downwards,
		// subtract to take into account that the blocks being dragged
		// were removed from the block list above the insertion point.
		const insertIndex =
			isAtSameLevel && sourceBlockIndex < targetBlockIndex
				? targetBlockIndex - draggedBlockCount
				: targetBlockIndex;

		if ( action === 'replace' ) {
			const sourceBlocks = getBlocksByClientId( clientIds );
			const targetBlockClientIds = getBlockOrder( targetRootClientId );
			const targetBlockClientId =
				targetBlockClientIds[ targetBlockIndex ];

			// Remove the source blocks and the target block.
			removeBlocks( [ ...clientIds, targetBlockClientId ], false );
			// Insert the source blocks back to the target index.
			insertBlocks(
				sourceBlocks,
				insertIndex,
				targetRootClientId,
				true,
				0
			);
		} else {
			moveBlocksToPosition(
				clientIds,
				rootClientId,
				targetRootClientId,
				insertIndex
			);
		}
	};

	const onBlocksDrop = useOnBlocksDrop( {
		addBlocks,
		moveBlocks,
	} );
	const onFilesDrop = useOnFilesDrop( {
		addBlocks,
		rootClientId: targetRootClientId,
	} );
	const onHTMLDrop = useOnHTMLDrop( {
		addBlocks,
	} );

	return ( event ) => {
		const files = getFilesFromDataTransfer( event.dataTransfer );
		const html = event.dataTransfer.getData( 'text/html' );

		/**
		 * From Windows Chrome 96, the `event.dataTransfer` returns both file object and HTML.
		 * The order of the checks is important to recognise the HTML drop.
		 */
		if ( html ) {
			onHTMLDrop( html );
		} else if ( files.length ) {
			onFilesDrop( files );
		} else {
			onBlocksDrop( event );
		}
	};
}
