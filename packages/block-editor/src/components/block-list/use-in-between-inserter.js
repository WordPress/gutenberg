/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

import { useSelect, useDispatch } from '@wordpress/data';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { InsertionPointOpenRef } from '../block-tools/insertion-point';

export function useInBetweenInserter() {
	const openRef = useContext( InsertionPointOpenRef );
	const {
		getBlockListSettings,
		getBlockRootClientId,
		getBlockIndex,
		isBlockInsertionPointVisible,
		isMultiSelecting,
	} = useSelect( blockEditorStore );
	const { showInsertionPoint, hideInsertionPoint } = useDispatch(
		blockEditorStore
	);

	return useRefEffect(
		( node ) => {
			function onMouseMove( event ) {
				if ( openRef.current ) {
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
					if ( isBlockInsertionPointVisible() ) {
						hideInsertionPoint();
					}
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

				const orientation =
					getBlockListSettings( rootClientId )?.orientation ||
					'vertical';
				const rect = event.target.getBoundingClientRect();
				const offsetTop = event.clientY - rect.top;
				const offsetLeft = event.clientX - rect.left;

				const children = Array.from( event.target.children );
				let element = children.find( ( blockEl ) => {
					return (
						( blockEl.classList.contains( 'wp-block' ) &&
							orientation === 'vertical' &&
							blockEl.offsetTop > offsetTop ) ||
						( blockEl.classList.contains( 'wp-block' ) &&
							orientation === 'horizontal' &&
							blockEl.offsetLeft > offsetLeft )
					);
				} );

				if ( ! element ) {
					return;
				}

				// The block may be in an alignment wrapper, so check the first direct
				// child if the element has no ID.
				if ( ! element.id ) {
					element = element.firstElementChild;

					if ( ! element ) {
						return;
					}
				}

				const clientId = element.id.slice( 'block-'.length );

				if ( ! clientId ) {
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
					if ( isBlockInsertionPointVisible() ) {
						hideInsertionPoint();
					}
					return;
				}

				const index = getBlockIndex( clientId, rootClientId );

				// Don't show the in-between inserter before the first block in
				// the list (preserves the original behaviour).
				if ( index === 0 ) {
					if ( isBlockInsertionPointVisible() ) {
						hideInsertionPoint();
					}
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
			getBlockRootClientId,
			getBlockIndex,
			isBlockInsertionPointVisible,
			isMultiSelecting,
			showInsertionPoint,
			hideInsertionPoint,
		]
	);
}
