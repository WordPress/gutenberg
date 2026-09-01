import { useRefEffect } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';

const TITLE_WRAPPER_SELECTOR = '.editor-visual-editor__post-title-wrapper';
const BLOCK_LIST_LAYOUT_SELECTOR =
	'.block-editor-block-list__layout.is-root-container';

/**
 * Shows the block inserter when hovering the gap between the post title
 * and the first block in the post editor.
 *
 * @param {boolean} enabled Whether the hook is enabled.
 */
export function useTitleGapInserter( enabled ) {
	const registry = useRegistry();
	const isDisabled = useSelect( ( select ) => {
		const { getSettings, isZoomOut } = unlock( select( blockEditorStore ) );
		const settings = getSettings();
		return (
			settings.isDistractionFree || settings.isPreviewMode || isZoomOut()
		);
	}, [] );

	return useRefEffect(
		( node ) => {
			if ( ! enabled || isDisabled ) {
				return;
			}

			function onMouseMove( event ) {
				const { getBlockOrder, isMultiSelecting, getTemplateLock } =
					unlock( registry.select( blockEditorStore ) );
				const { showInsertionPoint, hideInsertionPoint } =
					registry.dispatch( blockEditorStore );

				if ( isMultiSelecting() ) {
					return;
				}

				if ( getTemplateLock( '' ) ) {
					hideInsertionPoint();
					return;
				}

				const blockOrder = getBlockOrder( '' );
				if ( blockOrder.length === 0 ) {
					hideInsertionPoint();
					return;
				}

				const { ownerDocument } = node;
				const titleWrapper = ownerDocument.querySelector(
					TITLE_WRAPPER_SELECTOR
				);
				const blockListLayout = ownerDocument.querySelector(
					BLOCK_LIST_LAYOUT_SELECTOR
				);

				if ( ! titleWrapper || ! blockListLayout ) {
					return;
				}

				const firstBlock =
					blockListLayout.querySelector( ':scope > .wp-block' );
				if ( ! firstBlock ) {
					hideInsertionPoint();
					return;
				}

				const titleRect = titleWrapper.getBoundingClientRect();
				const firstBlockRect = firstBlock.getBoundingClientRect();
				const layoutRect = blockListLayout.getBoundingClientRect();
				const { clientY, clientX } = event;

				const isInTitleGap =
					clientY > titleRect.bottom &&
					clientY < firstBlockRect.top &&
					clientX >= layoutRect.left &&
					clientX <= layoutRect.right;

				if ( isInTitleGap ) {
					showInsertionPoint( '', 0, {
						__unstableWithInserter: true,
					} );
					return;
				}

				if (
					event.target.nodeType !== event.target.TEXT_NODE &&
					! event.target.classList?.contains(
						'block-editor-block-list__layout'
					)
				) {
					hideInsertionPoint();
				}
			}

			node.addEventListener( 'mousemove', onMouseMove );

			return () => {
				node.removeEventListener( 'mousemove', onMouseMove );
			};
		},
		[ enabled, isDisabled, registry ]
	);
}
