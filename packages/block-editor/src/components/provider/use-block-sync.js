/**
 * WordPress dependencies
 */
import { useContext, useEffect, useRef } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { SelectionContext } from './selection-context';

const noop = () => {};

/**
 * Clones a block and its inner blocks, building a bidirectional mapping
 * between external (original) and internal (cloned) client IDs.
 *
 * This allows the block editor to use unique internal IDs while preserving
 * stable external IDs for features like real-time collaboration.
 *
 * @param {Object} block   The block to clone.
 * @param {Object} mapping The mapping object with externalToInternal and internalToExternal Maps.
 * @return {Object} The cloned block with a new clientId.
 */
function cloneBlockWithMapping( block, mapping ) {
	const clonedBlock = cloneBlock( block );

	// Build bidirectional mapping
	mapping.externalToInternal.set( block.clientId, clonedBlock.clientId );
	mapping.internalToExternal.set( clonedBlock.clientId, block.clientId );

	// Recursively map inner blocks
	if ( block.innerBlocks?.length ) {
		clonedBlock.innerBlocks = block.innerBlocks.map( ( innerBlock ) => {
			const clonedInner = cloneBlockWithMapping( innerBlock, mapping );
			// The clonedBlock already has cloned inner blocks from cloneBlock(),
			// but we need to use our mapped versions to maintain the mapping.
			return clonedInner;
		} );
	}

	return clonedBlock;
}

/**
 * Restores external (original) client IDs on blocks before passing them
 * to onChange/onInput callbacks.
 *
 * @param {Object[]} blocks  The blocks with internal client IDs.
 * @param {Object}   mapping The mapping object with internalToExternal Map.
 * @return {Object[]} Blocks with external client IDs restored.
 */
function restoreExternalIds( blocks, mapping ) {
	return blocks.map( ( block ) => {
		const externalId = mapping.internalToExternal.get( block.clientId );
		return {
			...block,
			// Use external ID if available, otherwise keep internal ID (for new blocks)
			clientId: externalId ?? block.clientId,
			innerBlocks: restoreExternalIds( block.innerBlocks, mapping ),
		};
	} );
}

/**
 * Restores external client IDs in selection state.
 *
 * @param {Object} selectionState The selection state with internal client IDs.
 * @param {Object} mapping        The mapping object with internalToExternal Map.
 * @return {Object} Selection state with external client IDs.
 */
function restoreSelectionIds( selectionState, mapping ) {
	const { selectionStart, selectionEnd, initialPosition } = selectionState;

	const restoreClientId = ( sel ) => {
		if ( ! sel?.clientId ) {
			return sel;
		}
		const externalId = mapping.internalToExternal.get( sel.clientId );
		return {
			...sel,
			clientId: externalId ?? sel.clientId,
		};
	};

	return {
		selectionStart: restoreClientId( selectionStart ),
		selectionEnd: restoreClientId( selectionEnd ),
		initialPosition,
	};
}

/**
 * A function to call when the block value has been updated in the block-editor
 * store.
 *
 * @callback onBlockUpdate
 * @param {Object[]} blocks  The updated blocks.
 * @param {Object}   options The updated block options, such as selectionStart
 *                           and selectionEnd.
 */

/**
 * useBlockSync is a side effect which handles bidirectional sync between the
 * block-editor store and a controlling data source which provides blocks. This
 * is most commonly used by the BlockEditorProvider to synchronize the contents
 * of the block-editor store with the root entity, like a post.
 *
 * Another example would be the template part block, which provides blocks from
 * a separate entity data source than a root entity. This hook syncs edits to
 * the template part in the block editor back to the entity and vice-versa.
 *
 * Here are some of its basic functions:
 * - Initializes the block-editor store for the given clientID to the blocks
 *   given via props.
 * - Adds incoming changes (like undo) to the block-editor store.
 * - Adds outgoing changes (like editing content) to the controlling entity,
 *   determining if a change should be considered persistent or not.
 * - Handles edge cases and race conditions which occur in those operations.
 * - Ignores changes which happen to other entities (like nested inner block
 *   controllers.
 * - Passes selection state from the block-editor store to the controlling entity.
 *
 * @param {Object}        props          Props for the block sync hook
 * @param {string}        props.clientId The client ID of the inner block controller.
 *                                       If none is passed, then it is assumed to be a
 *                                       root controller rather than an inner block
 *                                       controller.
 * @param {Object[]}      props.value    The control value for the blocks. This value
 *                                       is used to initialize the block-editor store
 *                                       and for resetting the blocks to incoming
 *                                       changes like undo.
 * @param {onBlockUpdate} props.onChange Function to call when a persistent
 *                                       change has been made in the block-editor blocks
 *                                       for the given clientId. For example, after
 *                                       this function is called, an entity is marked
 *                                       dirty because it has changes to save.
 * @param {onBlockUpdate} props.onInput  Function to call when a non-persistent
 *                                       change has been made in the block-editor blocks
 *                                       for the given clientId. When this is called,
 *                                       controlling sources do not become dirty.
 */
export default function useBlockSync( {
	clientId = null,
	value: controlledBlocks,
	onChange = noop,
	onInput = noop,
} ) {
	const registry = useRegistry();
	const { getSelection, onChangeSelection } = useContext( SelectionContext );

	const {
		resetBlocks,
		resetSelection,
		replaceInnerBlocks,
		setHasControlledInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} = registry.dispatch( blockEditorStore );
	const { getBlockName, getBlocks, getSelectionStart, getSelectionEnd } =
		registry.select( blockEditorStore );

	const pendingChangesRef = useRef( { incoming: null, outgoing: [] } );
	const subscribedRef = useRef( false );

	// Mapping between external (original) and internal (cloned) client IDs.
	// This allows stable external IDs while using unique internal IDs.
	const idMappingRef = useRef( {
		externalToInternal: new Map(),
		internalToExternal: new Map(),
	} );

	// Tracks which context selection has already been applied, to avoid
	// duplicate restoration.
	const appliedSelectionRef = useRef( null );
	// Flag to prevent the subscription from re-reporting a selection
	// change that was just restored from context (which would loop).
	const isRestoringSelectionRef = useRef( false );

	// Restores selection from the SelectionContext using the current
	// idMapping.  Called after blocks are (re-)cloned so that the
	// mapping is guaranteed to be fresh.
	const restoreSelection = () => {
		const selection = getSelection();
		if (
			! selection?.selectionStart?.clientId ||
			selection === appliedSelectionRef.current
		) {
			return;
		}

		const startClientId = selection.selectionStart.clientId;

		// Check if this selection belongs to this controller.
		// Inner block controllers (clientId is set) own the block if
		// the external ID appears in their clone mapping.
		// The root controller (no clientId) owns it if the block
		// exists directly in the store.
		const isOurs = clientId
			? idMappingRef.current.externalToInternal.has( startClientId )
			: !! getBlockName( startClientId );

		if ( isOurs ) {
			appliedSelectionRef.current = selection;
			// Inner block controllers need to convert external→internal
			// IDs via the clone mapping; the root controller uses
			// external IDs directly (no mapping needed).
			const convert = ( sel ) => {
				if ( ! sel?.clientId || ! clientId ) {
					return sel;
				}
				return {
					...sel,
					clientId:
						idMappingRef.current.externalToInternal.get(
							sel.clientId
						) ?? sel.clientId,
				};
			};
			// Flag prevents the subscription from re-reporting this
			// selection change back to the entity (which would cause
			// an infinite update loop).
			isRestoringSelectionRef.current = true;
			resetSelection(
				convert( selection.selectionStart ),
				convert( selection.selectionEnd ),
				selection.initialPosition
			);
			isRestoringSelectionRef.current = false;
		}
	};

	const setControlledBlocks = () => {
		if ( ! controlledBlocks ) {
			return;
		}

		// We don't need to persist this change because we only replace
		// controlled inner blocks when the change was caused by an entity,
		// and so it would already be persisted.
		if ( clientId ) {
			// Batch so that the controlled flag and block replacement
			// are applied atomically — subscribers see a consistent state.
			registry.batch( () => {
				// Clear previous mappings and build new ones during cloning.
				// This ensures the mapping stays in sync with the current blocks.
				idMappingRef.current.externalToInternal.clear();
				idMappingRef.current.internalToExternal.clear();

				const storeBlocks = controlledBlocks.map( ( block ) =>
					cloneBlockWithMapping( block, idMappingRef.current )
				);

				setHasControlledInnerBlocks( clientId, true );

				if ( subscribedRef.current ) {
					pendingChangesRef.current.incoming = storeBlocks;
				}
				__unstableMarkNextChangeAsNotPersistent();
				replaceInnerBlocks( clientId, storeBlocks );

				// Invalidate the applied-selection ref so that
				// restoreSelection() at the end of the
				// controlledBlocks effect re-applies with the
				// freshly-built mapping (new internal IDs).
				appliedSelectionRef.current = null;
			} );
		} else {
			if ( subscribedRef.current ) {
				pendingChangesRef.current.incoming = controlledBlocks;
			}
			__unstableMarkNextChangeAsNotPersistent();
			resetBlocks( controlledBlocks );
		}
	};

	// Clean up the changes made by setControlledBlocks() when the component
	// containing useBlockSync() unmounts.
	const unsetControlledBlocks = () => {
		__unstableMarkNextChangeAsNotPersistent();
		if ( clientId ) {
			setHasControlledInnerBlocks( clientId, false );
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, [] );
		} else {
			resetBlocks( [] );
		}
	};

	// Add a subscription to the block-editor registry to detect when changes
	// have been made. This lets us inform the data source of changes. This
	// is an effect so that the subscriber can run synchronously without
	// waiting for React renders for changes.
	const onInputRef = useRef( onInput );
	const onChangeRef = useRef( onChange );
	useEffect( () => {
		onInputRef.current = onInput;
		onChangeRef.current = onChange;
	}, [ onInput, onChange ] );

	// Determine if blocks need to be reset when they change.
	// Also restores selection from context after blocks are set.
	useEffect( () => {
		const isOutgoing =
			pendingChangesRef.current.outgoing.includes( controlledBlocks );
		const storeMatch = getBlocks( clientId ) === controlledBlocks;

		if ( isOutgoing ) {
			// Skip block reset if the value matches expected outbound sync
			// triggered by this component by a preceding change detection.
			// Only skip if the value matches expectation, since a reset should
			// still occur if the value is modified (not equal by reference),
			// to allow that the consumer may apply modifications to reflect
			// back on the editor.
			if (
				pendingChangesRef.current.outgoing[
					pendingChangesRef.current.outgoing.length - 1
				] === controlledBlocks
			) {
				pendingChangesRef.current.outgoing = [];
			}
		} else if ( ! storeMatch ) {
			// Reset changing value in all other cases than the sync described
			// above. Since this can be reached in an update following an out-
			// bound sync, unset the outbound value to avoid considering it in
			// subsequent renders.
			pendingChangesRef.current.outgoing = [];
			setControlledBlocks();

			// Restore selection from context if it targets our scope.
			// Only done when blocks were reset from an external source
			// (undo/redo, entity navigation) — NOT for outgoing changes,
			// because dispatching resetSelection between keystrokes breaks
			// the isUpdatingSameBlockAttribute chain and creates per-
			// character undo levels.
			restoreSelection();
		}
	}, [ controlledBlocks, clientId ] );

	useEffect( () => {
		const {
			getSelectedBlocksInitialCaretPosition,
			isLastBlockChangePersistent,
			__unstableIsLastBlockChangeIgnored,
			areInnerBlocksControlled,
			getBlockParents,
		} = registry.select( blockEditorStore );

		let blocks = getBlocks( clientId );
		let isPersistent = isLastBlockChangePersistent();
		let previousAreBlocksDifferent = false;
		let prevSelectionStart = getSelectionStart();
		let prevSelectionEnd = getSelectionEnd();

		subscribedRef.current = true;
		const unsubscribe = registry.subscribe( () => {
			// Sometimes, when changing block lists, lingering subscriptions
			// might trigger before they are cleaned up. If the block for which
			// the subscription runs is no longer in the store, this would clear
			// its parent entity's block list. To avoid this, we bail out if
			// the subscription is triggering for a block (`clientId !== null`)
			// and its block name can't be found because it's not on the list.
			// (`getBlockName( clientId ) === null`).
			if ( clientId !== null && getBlockName( clientId ) === null ) {
				return;
			}

			const newIsPersistent = isLastBlockChangePersistent();
			const newBlocks = getBlocks( clientId );
			const areBlocksDifferent = newBlocks !== blocks;
			blocks = newBlocks;
			if (
				areBlocksDifferent &&
				( pendingChangesRef.current.incoming ||
					__unstableIsLastBlockChangeIgnored() )
			) {
				pendingChangesRef.current.incoming = null;
				isPersistent = newIsPersistent;
				return;
			}

			// Since we often dispatch an action to mark the previous action as
			// persistent, we need to make sure that the blocks changed on the
			// previous action before committing the change.
			const didPersistenceChange =
				previousAreBlocksDifferent &&
				! areBlocksDifferent &&
				newIsPersistent &&
				! isPersistent;

			const blocksChanged = areBlocksDifferent || didPersistenceChange;

			// Check if selection changed.
			const newSelectionStart = getSelectionStart();
			const newSelectionEnd = getSelectionEnd();
			const selectionChanged =
				newSelectionStart !== prevSelectionStart ||
				newSelectionEnd !== prevSelectionEnd;

			if ( selectionChanged ) {
				prevSelectionStart = newSelectionStart;
				prevSelectionEnd = newSelectionEnd;
			}

			if ( blocksChanged || selectionChanged ) {
				// Batch block and selection updates so the entity
				// receives both changes atomically.
				registry.batch( () => {
					if ( blocksChanged ) {
						isPersistent = newIsPersistent;

						// For inner block controllers (clientId is set), restore external IDs
						// before passing blocks to the parent.
						const blocksForParent = clientId
							? restoreExternalIds( blocks, idMappingRef.current )
							: blocks;

						// Build selection state for the undo level.
						const selectionInfo = {
							selectionStart: newSelectionStart,
							selectionEnd: newSelectionEnd,
							initialPosition:
								getSelectedBlocksInitialCaretPosition(),
						};
						// Restore external IDs in selection for inner block controllers.
						const selectionForParent = clientId
							? restoreSelectionIds(
									selectionInfo,
									idMappingRef.current
							  )
							: selectionInfo;

						pendingChangesRef.current.outgoing.push(
							blocksForParent
						);

						const updateParent = isPersistent
							? onChangeRef.current
							: onInputRef.current;
						updateParent( blocksForParent, {
							selection: selectionForParent,
						} );
					}

					if (
						selectionChanged &&
						! blocksChanged &&
						newSelectionStart?.clientId &&
						! isRestoringSelectionRef.current
					) {
						// Report selection via onChangeSelection.
						// Each useBlockSync only reports if the selected block
						// is within its own scope.
						// Inner block controllers own the block if the internal
						// ID appears in their clone mapping.
						// The root controller owns it if the block is not inside
						// any controlled inner block.
						const isOurs = clientId
							? idMappingRef.current.internalToExternal.has(
									newSelectionStart.clientId
							  )
							: ! getBlockParents(
									newSelectionStart.clientId
							  ).some( ( parentId ) =>
									areInnerBlocksControlled( parentId )
							  );

						if ( isOurs ) {
							const selectionInfo = {
								selectionStart: newSelectionStart,
								selectionEnd: newSelectionEnd,
								initialPosition:
									getSelectedBlocksInitialCaretPosition(),
							};
							onChangeSelection(
								clientId
									? restoreSelectionIds(
											selectionInfo,
											idMappingRef.current
									  )
									: selectionInfo
							);
						}
					}
				} );
			}
			previousAreBlocksDifferent = areBlocksDifferent;
		}, blockEditorStore );

		return () => {
			subscribedRef.current = false;
			unsubscribe();
		};
	}, [ registry, clientId ] );

	useEffect( () => {
		return () => {
			unsetControlledBlocks();
		};
	}, [] );
}
