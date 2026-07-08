/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { getBlockType, synchronizeBlocksWithTemplate } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * This hook applies the template declared in the block type settings to the
 * block's inner blocks when they are empty: the template scaffolds initial
 * content and is not applied again afterwards. Structural restrictions for
 * locked blocks are enforced through the canInsertBlockType, canRemoveBlock,
 * and canMoveBlock rules, not by the template.
 *
 * A template passed directly is deprecated and keeps its legacy behavior:
 * it is also re-applied over existing inner blocks whenever a "all" or
 * "contentOnly" lock is set directly on the block.
 *
 * @param {string}  clientId                       The block client ID.
 * @param {Object}  template                       A template applied in place of the one
 *                                                 declared by the block type. Deprecated.
 * @param {string}  templateLock                   The template lock state for the inner blocks.
 *                                                 Only used by the deprecated template argument.
 * @param {boolean} templateInsertUpdatesSelection Whether or not to update the
 *                                                 block-editor selection state when inner blocks
 *                                                 are replaced after template synchronization.
 * @param {boolean} [enableBlockTypeTemplate]      Whether a template declared in block type
 *                                                 settings may serve as the default when no
 *                                                 template is passed. Disabled for controlled
 *                                                 inner blocks.
 */
export default function useInnerBlockTemplateSync(
	clientId,
	template,
	templateLock,
	templateInsertUpdatesSelection,
	enableBlockTypeTemplate = true
) {
	// Instead of adding a useSelect mapping here, please add to the useSelect
	// mapping in InnerBlocks! Every subscription impacts performance.
	const registry = useRegistry();

	// Maintain a reference to the previous value so we can do a deep equality check.
	const existingTemplateRef = useRef( null );

	useLayoutEffect( () => {
		let isCancelled = false;

		if ( template !== undefined ) {
			deprecated( 'The template property of inner blocks', {
				since: '7.0',
				alternative:
					'a template declared in block type settings, which applies when the inner blocks are empty',
			} );
		}

		const {
			getBlockName,
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

			const currentInnerBlocks = getBlocks( clientId );
			let resolvedTemplate = template;
			let shouldApplyTemplate;

			if ( template !== undefined ) {
				// Deprecated template argument: preserve the legacy behavior
				// of synchronizing existing inner blocks with the template
				// when a locking "all" or "contentOnly" is set directly on
				// the block.
				shouldApplyTemplate =
					currentInnerBlocks.length === 0 ||
					templateLock === 'all' ||
					templateLock === 'contentOnly';
			} else {
				if ( ! enableBlockTypeTemplate ) {
					return;
				}
				// Block type templates only scaffold initial content: they
				// are applied when the inner blocks are empty and never
				// rewrite existing content.
				resolvedTemplate = getBlockType(
					getBlockName( clientId )
				)?.template;
				shouldApplyTemplate = currentInnerBlocks.length === 0;
			}

			const hasTemplateChanged = ! fastDeepEqual(
				resolvedTemplate,
				existingTemplateRef.current
			);

			if ( ! shouldApplyTemplate || ! hasTemplateChanged ) {
				return;
			}

			existingTemplateRef.current = resolvedTemplate;
			const nextBlocks = synchronizeBlocksWithTemplate(
				currentInnerBlocks,
				resolvedTemplate
			);

			if ( ! fastDeepEqual( nextBlocks, currentInnerBlocks ) ) {
				__unstableMarkNextChangeAsNotPersistent( {
					history: 'ignore',
				} );
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
		enableBlockTypeTemplate,
	] );
}
