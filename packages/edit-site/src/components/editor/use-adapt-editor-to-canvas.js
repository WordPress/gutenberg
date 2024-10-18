/**
 * WordPress dependencies
 */
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { useLayoutEffect } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

export function useAdaptEditorToCanvas( canvasMode ) {
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const {
		setDeviceType,
		closePublishSidebar,
		setIsListViewOpened,
		setIsInserterOpened,
	} = useDispatch( editorStore );
	const { get: getPreference } = useSelect( preferencesStore );
	const registry = useRegistry();
	useLayoutEffect( () => {
		const isMediumOrBigger =
			window.matchMedia( '(min-width: 782px)' ).matches;
		registry.batch( () => {
			clearSelectedBlock();
			setDeviceType( 'Desktop' );
			closePublishSidebar();
			setIsInserterOpened( false );

			// Check if the block list view should be open by default.
			// If `distractionFree` mode is enabled, the block list view should not be open.
			// This behavior is disabled for small viewports.
			if (
				isMediumOrBigger &&
				canvasMode === 'edit' &&
				getPreference( 'core', 'showListViewByDefault' ) &&
				! getPreference( 'core', 'distractionFree' )
			) {
				setIsListViewOpened( true );
			} else {
				setIsListViewOpened( false );
			}
		} );
	}, [
		canvasMode,
		registry,
		clearSelectedBlock,
		setDeviceType,
		closePublishSidebar,
		setIsInserterOpened,
		setIsListViewOpened,
		getPreference,
	] );
}
