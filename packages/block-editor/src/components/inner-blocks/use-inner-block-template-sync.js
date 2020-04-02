/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { synchronizeBlocksWithTemplate } from '@wordpress/blocks';

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
	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );

	const innerBlocks = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks( clientId ),
		[ clientId ]
	);

	// Maintain a reference to the previous value so we can do a deep equality check.
	const existingTemplate = useRef( null );
	useEffect( () => {
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
							nextBlocks.length !== 0
					);
				}
			}
		}
	}, [ innerBlocks, templateLock, clientId ] );
}
