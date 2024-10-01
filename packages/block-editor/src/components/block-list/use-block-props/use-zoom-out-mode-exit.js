/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * Allows Zoom Out mode to be exited by double clicking in the selected block.
 *
 * @param {Object} props          - The props.
 * @param {string} props.clientId - The client ID of the block.
 */
export function useZoomOutModeExit( { clientId } ) {
	const {
		getSettings,
		isZoomOut,
		getSectionRootClientId,
		getBlockOrder,
		__unstableGetEditorMode,
	} = unlock( useSelect( blockEditorStore ) );

	const { __unstableSetEditorMode, resetZoomLevel } = unlock(
		useDispatch( blockEditorStore )
	);

	return useRefEffect(
		( node ) => {
			// In "compose" mode.
			const composeMode =
				__unstableGetEditorMode() === 'zoom-out' && isZoomOut();

			if ( ! composeMode ) {
				return;
			}

			const sectionsClientIds = getBlockOrder( getSectionRootClientId() );

			const isSectionBlock = sectionsClientIds.includes( clientId );

			// If this is not a section then don't attach the listener because
			// the event will bubble up to the sections.
			// This ensures that `node` is the section block.
			if ( ! isSectionBlock ) {
				return;
			}

			function onDoubleClick( event ) {
				event.stopPropagation();

				// Ignore double click unless it occured directly on the section block itself.
				// See https://github.com/WordPress/gutenberg/issues/65750.
				if ( event.target !== node ) {
					return;
				}

				if ( ! event.defaultPrevented ) {
					event.preventDefault();

					const { __experimentalSetIsInserterOpened } = getSettings();

					if (
						typeof __experimentalSetIsInserterOpened === 'function'
					) {
						__experimentalSetIsInserterOpened( false );
					}
					__unstableSetEditorMode( 'edit' );
					resetZoomLevel();
				}
			}

			node.addEventListener( 'dblclick', onDoubleClick );

			return () => {
				node.removeEventListener( 'dblclick', onDoubleClick );
			};
		},
		[
			getSettings,
			__unstableSetEditorMode,
			__unstableGetEditorMode,
			isZoomOut,
			resetZoomLevel,
		]
	);
}
