import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../store';
import { BlockRefs } from '../provider/block-refs-provider';
import { InsertionPointOpenRef } from '../block-tools/insertion-point';
import { unlock } from '../../lock-unlock';

export function useInBetweenInserter() {
	const openRef = useContext( InsertionPointOpenRef );
	const { refsMap } = useContext( BlockRefs );
	const isInBetweenInserterDisabled = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return (
			settings.isDistractionFree ||
			settings.isPreviewMode ||
			unlock( select( blockEditorStore ) ).isZoomOut()
		);
	}, [] );
	const {
		getBlockListSettings,
		getBlockIndex,
		getBlockOrder,
		isMultiSelecting,
		getSelectedBlockClientIds,
		getSettings,
		getTemplateLock,
		__unstableIsWithinBlockOverlay,
		getBlockEditingMode,
		getBlockName,
		getBlockAttributes,
		getParentSectionBlock,
	} = unlock( useSelect( blockEditorStore ) );
	const { showInsertionPoint, hideInsertionPoint } =
		useDispatch( blockEditorStore );

	return useRefEffect(
		( node ) => {
			if ( isInBetweenInserterDisabled ) {
				return;
			}

			function onMouseMove( event ) {
				// openRef is the reference to the insertion point between blocks.
				// If the reference is not set or the insertion point is already open, return.
				if ( openRef === undefined || openRef.current ) {
					return;
				}

				// Ignore text nodes sometimes detected in FireFox.
				if ( event.target.nodeType === event.target.TEXT_NODE ) {
					return;
				}

				if ( isMultiSelecting() ) {
					return;
				}

				if (
					! event.target.classList.contains(
						'block-editor-block-list__layout'
					)
				) {
					hideInsertionPoint();
					return;
				}

				let rootClientId;
				if (
					! event.target.classList.contains( 'is-root-container' )
				) {
					const blockElement = !! event.target.getAttribute(
						'data-block'
					)
						? event.target
						: event.target.closest( '[data-block]' );
					rootClientId = blockElement.getAttribute( 'data-block' );
				}

				if (
					getTemplateLock( rootClientId ) ||
					getBlockEditingMode( rootClientId ) === 'disabled' ||
					getBlockName( rootClientId ) === 'core/block' ||
					( rootClientId &&
						getBlockAttributes( rootClientId ).layout
							?.isManualPlacement )
				) {
					return;
				}

				const blockListSettings = getBlockListSettings( rootClientId );
				const orientation =
					blockListSettings?.orientation || 'vertical';
				const captureToolbars =
					!! blockListSettings?.__experimentalCaptureToolbars;
				const offsetTop = event.clientY;
				const offsetLeft = event.clientX;

				// Use block refs, not the container's DOM children: a block
				// can render its block props on an inner element.
				const clientId = getBlockOrder( rootClientId ).find(
					( childClientId ) => {
						const blockEl = refsMap.get( childClientId );

						if ( ! blockEl ) {
							return false;
						}

						const blockElRect = blockEl.getBoundingClientRect();

						if ( orientation === 'vertical' ) {
							return blockElRect.top > offsetTop;
						}

						// A horizontal list can wrap, so only blocks on the
						// pointer's line are candidates.
						if (
							offsetTop < blockElRect.top ||
							offsetTop > blockElRect.bottom
						) {
							return false;
						}

						return isRTL()
							? blockElRect.right < offsetLeft
							: blockElRect.left > offsetLeft;
					}
				);

				if ( ! clientId ) {
					hideInsertionPoint();
					return;
				}

				// Don't show the insertion point if a parent block has an "overlay"
				// See https://github.com/WordPress/gutenberg/pull/34012#pullrequestreview-727762337
				if (
					__unstableIsWithinBlockOverlay( clientId ) ||
					!! getParentSectionBlock( clientId )
				) {
					return;
				}

				// Don't show the inserter if the following conditions are met,
				// as it conflicts with the block toolbar:
				// 1. when hovering above or inside selected block(s)
				// 2. when the orientation is vertical
				// 3. when the __experimentalCaptureToolbars is not enabled
				// 4. when the Top Toolbar is not disabled
				if (
					getSelectedBlockClientIds().includes( clientId ) &&
					orientation === 'vertical' &&
					! captureToolbars &&
					! getSettings().hasFixedToolbar
				) {
					return;
				}

				const element = refsMap.get( clientId );

				// Don't show the insertion point when the pointer sits beside
				// the block rather than before it.
				if ( orientation === 'vertical' ) {
					const elementRect = element.getBoundingClientRect();

					if (
						event.clientX > elementRect.right ||
						event.clientX < elementRect.left
					) {
						hideInsertionPoint();
						return;
					}
				}

				const index = getBlockIndex( clientId );

				// Don't show the in-between inserter before the first block in
				// the list. Insertion at index 0 in the post editor is handled
				// separately via the title gap inserter.
				if ( index === 0 ) {
					hideInsertionPoint();
					return;
				}

				showInsertionPoint( rootClientId, index, {
					__unstableWithInserter: true,
				} );
			}

			node.addEventListener( 'mousemove', onMouseMove );

			return () => {
				node.removeEventListener( 'mousemove', onMouseMove );
			};
		},
		[
			openRef,
			refsMap,
			getBlockListSettings,
			getBlockIndex,
			getBlockOrder,
			isMultiSelecting,
			showInsertionPoint,
			hideInsertionPoint,
			getSelectedBlockClientIds,
			isInBetweenInserterDisabled,
		]
	);
}
