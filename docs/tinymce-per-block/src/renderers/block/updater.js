/**
 * External dependencies
 */
import { findIndex, uniqueId, isArray } from 'lodash';
import { getBlock } from 'wp-blocks';

const blockLevelUpdater = ( state, command ) => {
	const currentUID = command.uid;
	const currentIndex = findIndex( state.blocks, b => b.uid === currentUID );
	// Ignore commands for removed blocks
	if ( currentIndex === -1 ) {
		return state;
	}
	const currentBlock = state.blocks[ currentIndex ];
	const mergeStates = newState => Object.assign( {}, state, newState );

	const blockCommandHandlers = {
		change: ( { changes } ) => {
			const newBlocks = [ ...state.blocks ];
			newBlocks[ currentIndex ] = Object.assign( {}, currentBlock, changes );
			return mergeStates( { blocks: newBlocks } );
		},

		append: ( { block: commandBlock } ) => {
			const createdBlock = commandBlock ? commandBlock : { blockType: 'text', content: '' };
			const appenedBlockId = uniqueId();
			const newBlocks = [
				...state.blocks.slice( 0, currentIndex + 1 ),
				Object.assign( {}, createdBlock, { uid: appenedBlockId } ),
				...state.blocks.slice( currentIndex + 1 )
			];
			const focus = { uid: appenedBlockId, config: { start: true } };
			const selected = null;
			return mergeStates( {
				blocks: newBlocks,
				selected,
				focus
			} );
		},

		remove: ( { removedUID: commandUID } ) => {
			const uidToRemove = commandUID === undefined ? currentUID : commandUID;
			const indexToRemove = findIndex( state.blocks, b => b.uid === uidToRemove );
			if ( ! commandUID && indexToRemove === 0 ) {
				return state;
			}
			const newBlocks = [
				...state.blocks.slice( 0, indexToRemove ),
				...state.blocks.slice( indexToRemove + 1 ),
			];
			const focus = indexToRemove && state.focus.uid === uidToRemove
				? { uid: state.blocks[ indexToRemove - 1 ].uid, config: { end: true } }
				: state.focus;
			const selected = null;
			return mergeStates( {
				blocks: newBlocks,
				selected,
				focus
			} );
		},

		mergeWithPrevious: () => {
			const previousBlock = state.blocks[ currentIndex - 1 ];
			if ( ! previousBlock ) {
				return state;
			}
			const previousBlockDefinition = getBlock( previousBlock.blockType );
			if ( ! previousBlockDefinition.merge ) {
				return state;
			}
			const mergeDefinition = isArray( previousBlockDefinition.merge )
				? previousBlockDefinition.merge.find( def => def.blocks.indexOf( currentBlock.blockType ) !== -1 )
				: previousBlockDefinition.merge;
			if ( ! mergeDefinition ) {
				return state;
			}
			const mergedState = mergeStates( mergeDefinition.merge( state, currentIndex - 1 ) );
			return Object.assign( mergedState, { selected: null } );
		},

		focus: ( { config } ) => {
			return mergeStates( {
				focus: { uid: currentUID, config }
			} );
		},

		moveCursorUp: () => {
			const previousBlock = state.blocks[ currentIndex - 1 ];
			return mergeStates( {
				focus: previousBlock ? { uid: previousBlock.uid, config: { end: true } } : state.focus,
				selected: null
			} );
		},

		moveCursorDown: () => {
			const nextBlock = state.blocks[ currentIndex + 1 ];
			return mergeStates( {
				focus: nextBlock ? { uid: nextBlock.uid, config: { start: true } } : state.focus,
				selected: null
			} );
		},

		select: () => {
			return mergeStates( {
				selected: currentUID
			} );
		},

		unselect: () => {
			return mergeStates( {
				selected: null
			} );
		},

		moveBlockUp: () => {
			if ( currentIndex === 0 ) {
				return state;
			}
			const newBlocks = [
				...state.blocks.slice( 0, currentIndex - 1 ),
				state.blocks[ currentIndex ],
				state.blocks[ currentIndex - 1 ],
				...state.blocks.slice( currentIndex + 1 )
			];
			return mergeStates( {
				blocks: newBlocks,
				selected: currentUID
			} );
		},

		moveBlockDown: () => {
			if ( currentIndex === state.blocks.length - 1 ) {
				return state;
			}
			const newBlocks = [
				...state.blocks.slice( 0, currentIndex ),
				state.blocks[ currentIndex + 1 ],
				state.blocks[ currentIndex ],
				...state.blocks.slice( currentIndex + 2 )
			];
			return mergeStates( {
				blocks: newBlocks,
				selected: currentUID
			} );
		},

		replace: ( { id } ) => {
			const newBlockUid = uniqueId();
			const blockDefinition = getBlock( id );
			const newBlock = Object.assign( { uid: newBlockUid }, blockDefinition.create() );
			const newBlocks = [
				...state.blocks.slice( 0, currentIndex ),
				newBlock,
				...state.blocks.slice( currentIndex + 1 )
			];
			return mergeStates( {
				blocks: newBlocks,
				focus: { uid: newBlockUid, config: {} }
			} );
		},

		transform: ( { id } ) => {
			const newBlockUid = uniqueId();
			const blockDefinition = getBlock( id );
			const transformation = blockDefinition.transformations
				.find( t => t.blocks.indexOf( currentBlock.blockType ) !== -1 );
			if ( ! transformation ) {
				return state;
			}
			const newBlock = Object.assign( { uid: newBlockUid }, transformation.transform( currentBlock ) );
			const newBlocks = [
				...state.blocks.slice( 0, currentIndex ),
				newBlock,
				...state.blocks.slice( currentIndex + 1 )
			];
			return mergeStates( {
				blocks: newBlocks,
				focus: { uid: newBlockUid, config: {} }
			} );
		},

		hover: () => {
			return mergeStates( {
				hovered: currentUID
			} );
		},

		unhover: () => {
			return mergeStates( {
				hovered: null
			} );
		},
	};

	if ( blockCommandHandlers[ command.type ] ) {
		return blockCommandHandlers[ command.type ]( command );
	}

	return state;
};

const globalLevelUpdater = ( state, command ) => {
	const mergeStates = newState => Object.assign( {}, state, newState );

	const commandHandlers = {
		addBlock: ( { id } ) => {
			const newBlockUID = uniqueId();
			const blockDefinition = getBlock( id );
			const newBlock = Object.assign( { uid: newBlockUID }, blockDefinition.create() );
			const newBlocks = [
				...state.blocks,
				newBlock
			];
			return mergeStates( {
				blocks: newBlocks,
				focus: { uid: newBlockUID, config: {} },
				selected: newBlockUID
			} );
		},

		unselectAll: () => {
			return mergeStates( {
				focus: { uid: null, config: {} },
				selected: null
			} );
		}
	};

	if ( commandHandlers[ command.type ] ) {
		return commandHandlers[ command.type ]( command );
	}

	return state;
};

export default ( state, command ) => {
	if ( command.uid ) {
		return blockLevelUpdater( state, command );
	}

	return globalLevelUpdater( state, command );
};
