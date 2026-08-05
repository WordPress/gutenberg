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
 * This hook makes sure that a block's inner blocks stay in sync with the given
 * block "template". The template is a block hierarchy to which inner blocks must
 * conform. If the blocks get "out of sync" with the template and the template
 * is meant to be locked (e.g. templateLock = "all" or templateLock = "contentOnly"),
 * then we replace the inner blocks with the correct value after synchronizing it with the template.
 *
 * @param {string}  clientId                       The block client ID.
 * @param {Object}  template                       A template to apply in place of the one
 *                                                 declared in the block type settings.
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
	if ( template !== undefined ) {
		deprecated(
			'The template prop of InnerBlocks and useInnerBlocksProps',
			{
				since: '7.2',
				alternative: 'a `template` declared in the block type settings',
			}
		);
	}
	if ( templateInsertUpdatesSelection !== undefined ) {
		deprecated(
			'The templateInsertUpdatesSelection prop of InnerBlocks and useInnerBlocksProps',
			{
				since: '7.2',
				alternative:
					'`templateInsertUpdatesSelection` declared in the block type settings',
			}
		);
	}

	// Instead of adding a useSelect mapping here, please add to the useSelect
	// mapping in InnerBlocks! Every subscription impacts performance.
	const registry = useRegistry();

	// Maintain a reference to the previous value so we can do a deep equality check.
	const existingTemplateRef = useRef( null );

	useLayoutEffect( () => {
		let isCancelled = false;

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

			// A template declared in block type settings serves as the
			// default when no `template` prop is passed, along with whether
			// applying it moves the selection.
			let resolvedTemplate = template;
			let resolvedUpdatesSelection = templateInsertUpdatesSelection;
			if ( template === undefined ) {
				const blockType = getBlockType( getBlockName( clientId ) );
				resolvedTemplate = blockType?.template;
				resolvedUpdatesSelection =
					blockType?.templateInsertUpdatesSelection;
			}

			const currentInnerBlocks = getBlocks( clientId );
			const hasAppliedTemplate = fastDeepEqual(
				resolvedTemplate,
				existingTemplateRef.current
			);

			// Only synchronize innerBlocks with template if innerBlocks are empty
			// or a locking "all" or "contentOnly" exists directly on the block.
			const shouldApplyTemplate =
				currentInnerBlocks.length === 0 ||
				templateLock === 'all' ||
				templateLock === 'contentOnly';

			if ( ! shouldApplyTemplate || hasAppliedTemplate ) {
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
						resolvedUpdatesSelection &&
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
