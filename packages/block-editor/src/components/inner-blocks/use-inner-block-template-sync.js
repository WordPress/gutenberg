/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { synchronizeBlocksWithTemplate } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * This hook makes sure that a block's inner blocks stay in sync with the given
 * block "template". The template is a block hierarchy to which inner blocks must
 * conform. If the blocks get "out of sync" with the template and the template
 * is meant to be locked (e.g. templateLock = "all" or templateLock = "contentOnly"),
 * then we replace the inner blocks with the correct value after synchronizing it with the template.
 *
 * @param {string}  clientId                       The block client ID.
 * @param {Object}  template                       The template to match.
 * @param {string}  templateLock                   The template lock state for the inner blocks. For
 *                                                 example, if the template lock is set to "all",
 *                                                 then the inner blocks will stay in sync with the
 *                                                 template. If not defined or set to false, then
 *                                                 the inner blocks will not be synchronized with
 *                                                 the given template.
 * @param {boolean} templateInsertUpdatesSelection Whether or not to update the
 *                                                 block-editor selection state when inner blocks
 *                                                 are replaced after template synchronization.
 */
export default function useInnerBlockTemplateSync(
	clientId,
	template,
	templateLock,
	templateInsertUpdatesSelection
) {
	// Instead of adding a useSelect mapping here, please add to the useSelect
	// mapping in InnerBlocks! Every subscription impacts performance.
	const registry = useRegistry();

	// Maintain a reference to the previous value so we can do a deep equality check.
	const existingTemplateRef = useRef( null );

	useLayoutEffect( () => {
		let isCancelled = false;

		const {
			getBlocks,
			getSelectedBlocksInitialCaretPosition,
			isBlockSelected,
		} = registry.select( blockEditorStore );
		const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
			registry.dispatch( blockEditorStore );

		// There's an implicit dependency between useInnerBlockTemplateSync and useNestedSettingsUpdate
		// The former needs to happen after the latter and since the latter is using microtasks to batch updates (performance optimization),
		// we need to schedule this one in a microtask as well.
		// Example: If you remove queueMicrotask here, ctrl + click to insert quote block won't close the inserter.
		window.queueMicrotask( () => {
			if ( isCancelled ) {
				return;
			}

			// Only synchronize innerBlocks with template if innerBlocks are empty
			// or a locking "all" or "contentOnly" exists directly on the block.
			const currentInnerBlocks = getBlocks( clientId );
			const shouldApplyTemplate =
				currentInnerBlocks.length === 0 ||
				templateLock === 'all' ||
				templateLock === 'contentOnly';

			const hasTemplateChanged = ! fastDeepEqual(
				template,
				existingTemplateRef.current
			);

			if ( ! shouldApplyTemplate || ! hasTemplateChanged ) {
				return;
			}

			existingTemplateRef.current = template;
			const nextBlocks = synchronizeBlocksWithTemplate(
				currentInnerBlocks,
				template
			);

			if ( ! fastDeepEqual( nextBlocks, currentInnerBlocks ) ) {
				__unstableMarkNextChangeAsNotPersistent();
				replaceInnerBlocks(
					clientId,
					nextBlocks,
					currentInnerBlocks.length === 0 &&
						templateInsertUpdatesSelection &&
						nextBlocks.length !== 0 &&
						isBlockSelected( clientId ),
					// This ensures the "initialPosition" doesn't change when applying the template
					// If we're supposed to focus the block, we'll focus the first inner block
					// otherwise, we won't apply any auto-focus.
					// This ensures for instance that the focus stays in the inserter when inserting the "buttons" block.
					getSelectedBlocksInitialCaretPosition()
				);
			}
		} );

		return () => {
			isCancelled = true;
		};
	}, [
		template,
		templateLock,
		clientId,
		registry,
		templateInsertUpdatesSelection,
	] );
}
