/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useRegistry, useSelect } from '@wordpress/data';
import { cloneBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const noop = () => {};

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
 * @param {Object}        props           Props for the block sync hook
 * @param {string}        props.clientId  The client ID of the inner block controller.
 *                                        If none is passed, then it is assumed to be a
 *                                        root controller rather than an inner block
 *                                        controller.
 * @param {Object[]}      props.value     The control value for the blocks. This value
 *                                        is used to initialize the block-editor store
 *                                        and for resetting the blocks to incoming
 *                                        changes like undo.
 * @param {Object}        props.selection The selection state responsible to restore the selection on undo/redo.
 * @param {onBlockUpdate} props.onChange  Function to call when a persistent
 *                                        change has been made in the block-editor blocks
 *                                        for the given clientId. For example, after
 *                                        this function is called, an entity is marked
 *                                        dirty because it has changes to save.
 * @param {onBlockUpdate} props.onInput   Function to call when a non-persistent
 *                                        change has been made in the block-editor blocks
 *                                        for the given clientId. When this is called,
 *                                        controlling sources do not become dirty.
 */
export default function useBlockSync( {
	clientId = null,
	value: controlledBlocks,
	selection: controlledSelection,
	onChange = noop,
	onInput = noop,
} ) {
	const registry = useRegistry();

	const {
		resetBlocks,
		resetSelection,
		replaceInnerBlocks,
		setHasControlledInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	} = registry.dispatch( blockEditorStore );
	const { getBlockName, getBlocks, getSelectionStart, getSelectionEnd } =
		registry.select( blockEditorStore );
	const isControlled = useSelect(
		( select ) => {
			return (
				! clientId ||
				select( blockEditorStore ).areInnerBlocksControlled( clientId )
			);
		},
		[ clientId ]
	);

	const pendingChangesRef = useRef( { incoming: null, outgoing: [] } );
	const subscribedRef = useRef( false );

	const setControlledBlocks = () => {
		if ( ! controlledBlocks ) {
			return;
		}

		// We don't need to persist this change because we only replace
		// controlled inner blocks when the change was caused by an entity,
		// and so it would already be persisted.
		__unstableMarkNextChangeAsNotPersistent();
		if ( clientId ) {
			// It is important to batch here because otherwise,
			// as soon as `setHasControlledInnerBlocks` is called
			// the effect to restore might be triggered
			// before the actual blocks get set properly in state.
			registry.batch( () => {
				setHasControlledInnerBlocks( clientId, true );
				const storeBlocks = controlledBlocks.map( ( block ) =>
					cloneBlock( block )
				);
				if ( subscribedRef.current ) {
					pendingChangesRef.current.incoming = storeBlocks;
				}
				__unstableMarkNextChangeAsNotPersistent();
				replaceInnerBlocks( clientId, storeBlocks );
			} );
		} else {
			if ( subscribedRef.current ) {
				pendingChangesRef.current.incoming = controlledBlocks;
			}
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
	useEffect( () => {
		if ( pendingChangesRef.current.outgoing.includes( controlledBlocks ) ) {
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
		} else if ( getBlocks( clientId ) !== controlledBlocks ) {
			// Reset changing value in all other cases than the sync described
			// above. Since this can be reached in an update following an out-
			// bound sync, unset the outbound value to avoid considering it in
			// subsequent renders.
			pendingChangesRef.current.outgoing = [];
			setControlledBlocks();

			if ( controlledSelection ) {
				resetSelection(
					controlledSelection.selectionStart,
					controlledSelection.selectionEnd,
					controlledSelection.initialPosition
				);
			}
		}
	}, [ controlledBlocks, clientId ] );

	const isMountedRef = useRef( false );

	useEffect( () => {
		// On mount, controlled blocks are already set in the effect above.
		if ( ! isMountedRef.current ) {
			isMountedRef.current = true;
			return;
		}

		// When the block becomes uncontrolled, it means its inner state has been reset
		// we need to take the blocks again from the external value property.
		if ( ! isControlled ) {
			pendingChangesRef.current.outgoing = [];
			setControlledBlocks();
		}
	}, [ isControlled ] );

	useEffect( () => {
		const {
			getSelectedBlocksInitialCaretPosition,
			isLastBlockChangePersistent,
			__unstableIsLastBlockChangeIgnored,
			areInnerBlocksControlled,
		} = registry.select( blockEditorStore );

		let blocks = getBlocks( clientId );
		let isPersistent = isLastBlockChangePersistent();
		let previousAreBlocksDifferent = false;

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

			// When RESET_BLOCKS on parent blocks get called, the controlled blocks
			// can reset to uncontrolled, in these situations, it means we need to populate
			// the blocks again from the external blocks (the value property here)
			// and we should stop triggering onChange
			const isStillControlled =
				! clientId || areInnerBlocksControlled( clientId );
			if ( ! isStillControlled ) {
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

			if ( areBlocksDifferent || didPersistenceChange ) {
				isPersistent = newIsPersistent;
				// We know that onChange/onInput will update controlledBlocks.
				// We need to be aware that it was caused by an outgoing change
				// so that we do not treat it as an incoming change later on,
				// which would cause a block reset.
				pendingChangesRef.current.outgoing.push( blocks );

				// Inform the controlling entity that changes have been made to
				// the block-editor store they should be aware about.
				const updateParent = isPersistent
					? onChangeRef.current
					: onInputRef.current;
				updateParent( blocks, {
					selection: {
						selectionStart: getSelectionStart(),
						selectionEnd: getSelectionEnd(),
						initialPosition:
							getSelectedBlocksInitialCaretPosition(),
					},
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
