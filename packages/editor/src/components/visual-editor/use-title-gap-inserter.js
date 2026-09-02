import { useRefEffect } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';

const TITLE_WRAPPER_SELECTOR = '.editor-visual-editor__post-title-wrapper';
const BLOCK_LIST_LAYOUT_SELECTOR =
	'.block-editor-block-list__layout.is-root-container';
const QUICK_INSERTER_SELECTOR = '.block-editor-inserter__quick-inserter';
const INSERTION_POINT_SELECTOR =
	'.block-editor-block-list__insertion-point';

/**
 * Whether the quick inserter menu from the title-gap control is open.
 * The menu may render in the canvas document or the parent document.
 *
 * @param {Document} doc Canvas document.
 */
function isQuickInserterOpen( doc ) {
	if ( doc.querySelector( QUICK_INSERTER_SELECTOR ) ) {
		return true;
	}
	const parentDoc = doc.defaultView?.frameElement?.ownerDocument;
	return !! parentDoc?.querySelector( QUICK_INSERTER_SELECTOR );
}

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
				const blockEditorSelect = registry.select( blockEditorStore );
				const { getBlockOrder, isMultiSelecting, getTemplateLock } =
					unlock( blockEditorSelect );
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

				// Keep the inserter while the pointer is over its own UI. The
				// "+" sits on the first-block edge, slightly outside the gap.
				if ( event.target?.closest?.( INSERTION_POINT_SELECTOR ) ) {
					return;
				}

				// Keep the insertion point mounted while the quick inserter
				// menu is open; hiding it would unmount the menu.
				if ( isQuickInserterOpen( ownerDocument ) ) {
					return;
				}

				const insertionPoint =
					blockEditorSelect.isBlockInsertionPointVisible()
						? blockEditorSelect.getBlockInsertionPoint()
						: null;

				// Hide only the title-gap insertion point so we don't dismiss
				// unrelated in-between inserters. Leaving it visible lets the
				// pointer-events overlay steal clicks on the first block
				// (e.g. shift+click multi-selection inside a Group).
				if (
					insertionPoint?.__unstableWithInserter &&
					insertionPoint.rootClientId === '' &&
					insertionPoint.index === 0
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
