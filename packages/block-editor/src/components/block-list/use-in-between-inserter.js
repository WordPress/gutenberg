import { hasBlockSupport } from '@wordpress/blocks';
import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../store';
import { InsertionPointOpenRef } from '../block-tools/insertion-point';
import { unlock } from '../../lock-unlock';

export function useInBetweenInserter() {
	const openRef = useContext( InsertionPointOpenRef );
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
	const { showInsertionPoint, hideInsertionPoint, selectBlock } =
		useDispatch( blockEditorStore );

	return useRefEffect(
		( node ) => {
			if ( isInBetweenInserterDisabled ) {
				return;
			}

			// Resolves the boundary between two blocks under the pointer.
			// Returns the boundary, `{ hide: true }/`when a shown insertion
			// point must be hidden, or nothing when the event is not for a
			// boundary at all.
			function resolveBoundary( event ) {
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
					return { hide: true };
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
					return { hide: true };
				}

				// The block may be in an alignment wrapper, so check the first direct
				// child if the element has no ID.
				if ( ! element.id ) {
					element = element.firstElementChild;

					if ( ! element ) {
						return { hide: true };
					}
				}

				// Don't use the boundary if a parent block has an "overlay"
				// See https://github.com/WordPress/gutenberg/pull/34012#pullrequestreview-727762337
				const clientId = element.id.slice( 'block-'.length );
				if (
					! clientId ||
					__unstableIsWithinBlockOverlay( clientId ) ||
					!! getParentSectionBlock( clientId )
				) {
					return;
				}

				// Don't use the boundary if the following conditions are met,
				// as the inserter conflicts with the block toolbar:
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
					return { hide: true };
				}

				const index = getBlockIndex( clientId );

				// There is no boundary before the first block in the list
				// (preserves the original behaviour).
				if ( index === 0 ) {
					return { hide: true };
				}

				return { rootClientId, clientId, index, orientation };
			}

			// When the block above a boundary can split, typing can already
			// create a block there: pressing Enter at its end starts a new
			// block at that spot with the caret in it, so the inserter would
			// only get in the way of writing. Splitting at the start of a
			// block leaves the caret behind, which is why only the block
			// above counts. In horizontal rows the inserter doesn't get in
			// the way of writing, so it stays.
			function typingCoversBoundary( boundary ) {
				const { rootClientId, index, orientation } = boundary;
				const previousClientId =
					getBlockOrder( rootClientId )[ index - 1 ];
				return (
					orientation === 'vertical' &&
					!! previousClientId &&
					hasBlockSupport(
						getBlockName( previousClientId ),
						'splitting',
						false
					)
				);
			}

			function onMouseMove( event ) {
				// openRef is the reference to the insertion point between blocks.
				// If the reference is not set or the insertion point is already open, return.
				if ( openRef === undefined || openRef.current ) {
					return;
				}

				const boundary = resolveBoundary( event );

				if ( ! boundary ) {
					return;
				}

				if ( boundary.hide || typingCoversBoundary( boundary ) ) {
					hideInsertionPoint();
					return;
				}

				showInsertionPoint( boundary.rootClientId, boundary.index, {
					__unstableWithInserter: true,
				} );
			}

			function onClick( event ) {
				const boundary = resolveBoundary( event );

				// Without an inserter in the boundary, a click between two
				// blocks would do nothing. Place the caret at the end of the
				// block below, exactly like a click on the shown insertion
				// point does.
				if (
					boundary &&
					! boundary.hide &&
					typingCoversBoundary( boundary ) &&
					getBlockEditingMode( boundary.clientId ) !== 'disabled'
				) {
					selectBlock( boundary.clientId, -1 );
				}
			}

			node.addEventListener( 'mousemove', onMouseMove );
			node.addEventListener( 'click', onClick );

			return () => {
				node.removeEventListener( 'mousemove', onMouseMove );
				node.removeEventListener( 'click', onClick );
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
