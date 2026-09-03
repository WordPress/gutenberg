import { useRefEffect } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { unlock } from '../../lock-unlock';

const TITLE_WRAPPER_SELECTOR = '.editor-visual-editor__post-title-wrapper';
const BLOCK_LIST_LAYOUT_SELECTOR =
	'.block-editor-block-list__layout.is-root-container';
const QUICK_INSERTER_SELECTOR = '.block-editor-inserter__quick-inserter';
const EXPANDED_INSERTER_TOGGLE_SELECTOR =
	'.block-editor-block-list__insertion-point-inserter .block-editor-inserter__toggle[aria-expanded="true"]';

/**
 * Whether the title-gap inserter menu is open or opening.
 * The insertion point and quick inserter render in the parent document
 * (outside the canvas iframe); the toggle's aria-expanded covers the
 * brief gap before the menu mounts.
 *
 * @param {Document} doc Canvas document.
 * @return {boolean} True when the quick inserter is open or opening.
 */
function isTitleGapInserterMenuActive( doc ) {
	const parentDoc = doc.defaultView?.frameElement?.ownerDocument;
	const docs = parentDoc ? [ doc, parentDoc ] : [ doc ];

	return docs.some(
		( checkDoc ) =>
			!! checkDoc.querySelector( QUICK_INSERTER_SELECTOR ) ||
			!! checkDoc.querySelector( EXPANDED_INSERTER_TOGGLE_SELECTOR )
	);
}

/**
 * Hides the title-gap insertion point when it is the visible cue.
 *
 * @param {Object} registry Data registry.
 * @return {void}
 */
function hideTitleGapInsertionPoint( registry ) {
	const blockEditorSelect = registry.select( blockEditorStore );
	const insertionPoint = blockEditorSelect.isBlockInsertionPointVisible()
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
		registry.dispatch( blockEditorStore ).hideInsertionPoint();
	}
}

/**
 * Shows the block inserter when hovering the gap between the post title
 * and the first block in the post editor.
 *
 * @param {boolean} enabled Whether the hook is enabled.
 * @return {import('react').RefCallback} Ref callback that attaches the hover listener.
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

			/**
			 * Shows or hides the title-gap insertion point from pointer position.
			 *
			 * @param {MouseEvent} event Pointer move event from the canvas.
			 * @return {void}
			 */
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

				// Keep the insertion point mounted while the quick inserter
				// menu is open or opening; hiding it would unmount the menu.
				if ( isTitleGapInserterMenuActive( ownerDocument ) ) {
					return;
				}

				hideTitleGapInsertionPoint( registry );
			}

			node.addEventListener( 'mousemove', onMouseMove );

			return () => {
				node.removeEventListener( 'mousemove', onMouseMove );
				// Clear a stuck title-gap cue when the hook disables (e.g.
				// distraction-free / zoom-out) or the effect re-runs.
				hideTitleGapInsertionPoint( registry );
			};
		},
		[ enabled, isDisabled, registry ]
	);
}
