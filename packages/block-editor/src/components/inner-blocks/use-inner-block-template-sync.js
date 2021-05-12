/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { synchronizeBlocksWithTemplate } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * This hook makes sure that a block's inner blocks stay in sync with the given
 * block "template". The template is a block hierarchy to which inner blocks must
 * conform. If the blocks get "out of sync" with the template and the template
 * is meant to be locked (e.g. templateLock = "all"), then we replace the inner
 * blocks with the correct value after synchronizing it with the template.
 *
 * @param {string} clientId     The block client ID.
 * @param {Object} template     The template to match.
 * @param {string} templateLock The template lock state for the inner blocks. For
 *                              example, if the template lock is set to "all",
 *                              then the inner blocks will stay in sync with the
 *                              template. If not defined or set to false, then
 *                              the inner blocks will not be synchronized with
 *                              the given template.
 * @param {boolean} templateInsertUpdatesSelection Whether or not to update the
 *                              block-editor selection state when inner blocks
 *                              are replaced after template synchronization.
 */
export default function useInnerBlockTemplateSync(
	clientId,
	template,
	templateLock,
	templateInsertUpdatesSelection
) {
	const { getSelectedBlocksInitialCaretPosition } = useSelect(
		blockEditorStore
	);
	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const innerBlocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);

	// Maintain a reference to the previous value so we can do a deep equality check.
	const existingTemplate = useRef( null );
	useLayoutEffect( () => {
		// Only synchronize innerBlocks with template if innerBlocks are empty or
		// a locking all exists directly on the block.
		if ( innerBlocks.length === 0 || templateLock === 'all' ) {
			const hasTemplateChanged = ! isEqual(
				template,
				existingTemplate.current
			);
			if ( hasTemplateChanged ) {
				existingTemplate.current = template;
				const nextBlocks = synchronizeBlocksWithTemplate(
					innerBlocks,
					template
				);
				if ( ! isEqual( nextBlocks, innerBlocks ) ) {
					replaceInnerBlocks(
						clientId,
						nextBlocks,
						innerBlocks.length === 0 &&
							templateInsertUpdatesSelection &&
							nextBlocks.length !== 0,
						// This ensures the "initialPosition" doesn't change when applying the template
						// If we're supposed to focus the block, we'll focus the first inner block
						// otherwise, we won't apply any auto-focus.
						// This ensures for instance that the focus stays in the inserter when inserting the "buttons" block.
						getSelectedBlocksInitialCaretPosition()
					);
				}
			}
		}
	}, [ innerBlocks, template, templateLock, clientId ] );
}
