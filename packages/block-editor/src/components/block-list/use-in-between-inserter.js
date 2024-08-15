/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { InsertionPointOpenRef } from '../block-tools/insertion-point';

export function useInBetweenInserter() {
	const openRef = useContext( InsertionPointOpenRef );
	const isInBetweenInserterDisabled = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().isDistractionFree ||
			select( blockEditorStore ).__unstableGetEditorMode() === 'zoom-out',
		[]
	);
	const {
		getBlockListSettings,
		getBlockIndex,
		isMultiSelecting,
		getSelectedBlockClientIds,
		getSettings,
		getTemplateLock,
		__unstableIsWithinBlockOverlay,
		getBlockEditingMode,
		getBlockName,
		getBlockAttributes,
	} = useSelect( blockEditorStore );
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

				const children = Array.from( event.target.children );
				let element = children.find( ( blockEl ) => {
					const blockElRect = blockEl.getBoundingClientRect();
					return (
						( blockEl.classList.contains( 'wp-block' ) &&
							orientation === 'vertical' &&
							blockElRect.top > offsetTop ) ||
						( blockEl.classList.contains( 'wp-block' ) &&
							orientation === 'horizontal' &&
							( isRTL()
								? blockElRect.right < offsetLeft
								: blockElRect.left > offsetLeft ) )
					);
				} );

				if ( ! element ) {
					hideInsertionPoint();
					return;
				}

				// The block may be in an alignment wrapper, so check the first direct
				// child if the element has no ID.
				if ( ! element.id ) {
					element = element.firstElementChild;

					if ( ! element ) {
						hideInsertionPoint();
						return;
					}
				}

				// Don't show the insertion point if a parent block has an "overlay"
				// See https://github.com/WordPress/gutenberg/pull/34012#pullrequestreview-727762337
				const clientId = element.id.slice( 'block-'.length );
				if (
					! clientId ||
					__unstableIsWithinBlockOverlay( clientId )
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
				const elementRect = element.getBoundingClientRect();

				if (
					( orientation === 'horizontal' &&
						( event.clientY > elementRect.bottom ||
							event.clientY < elementRect.top ) ) ||
					( orientation === 'vertical' &&
						( event.clientX > elementRect.right ||
							event.clientX < elementRect.left ) )
				) {
					hideInsertionPoint();
					return;
				}

				const index = getBlockIndex( clientId );

				// Don't show the in-between inserter before the first block in
				// the list (preserves the original behaviour).
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
			getBlockListSettings,
			getBlockIndex,
			isMultiSelecting,
			showInsertionPoint,
			hideInsertionPoint,
			getSelectedBlockClientIds,
			isInBetweenInserterDisabled,
		]
	);
}
