/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit/context';

export default function useZoomOutBlockEditingMode() {
	const { clientId: rootClientId = '' } = useBlockEditContext();

	const { unsetBlockEditingMode, setBlockEditingMode } =
		useDispatch( blockEditorStore );

	const { isZoomOutMode, sectionsContainerClientId, sectionsClientIds } =
		useSelect( ( select ) => {
			const {
				__unstableGetEditorMode,
				getSectionsContainerClientId,
				getClientIdsOfDescendants,
			} = select( blockEditorStore );

			// TODO: We need a better API as using the post type
			// in block editor package is not allowed.
			const postType = select( 'core/editor' ).getCurrentPostType();

			const _sectionsContainerClientId =
				getSectionsContainerClientId( postType );

			return {
				isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
				sectionsContainerClientId: _sectionsContainerClientId,
				sectionsClientIds: getClientIdsOfDescendants(
					_sectionsContainerClientId
				),
			};
		}, [] );

	useEffect( () => {
		if ( isZoomOutMode ) {
			setBlockEditingMode( rootClientId, 'disabled' );
			setBlockEditingMode( sectionsContainerClientId, 'contentOnly' );
			sectionsClientIds.forEach( ( clientId ) => {
				setBlockEditingMode( clientId, 'default' );
			} );

			return () => {
				sectionsClientIds.forEach( ( clientId ) => {
					unsetBlockEditingMode( clientId );
				} );
				unsetBlockEditingMode( sectionsContainerClientId );
				unsetBlockEditingMode( rootClientId );
			};
		}
	}, [
		isZoomOutMode,
		rootClientId,
		sectionsContainerClientId,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		...sectionsClientIds,
		setBlockEditingMode,
		unsetBlockEditingMode,
	] );
}
