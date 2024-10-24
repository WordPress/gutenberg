/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * This listener hook monitors for block selection and triggers the appropriate
 * sidebar state.
 */
function useAutoSwitchEditorSidebars() {
	const { clientId } = useSelect( ( select ) => {
		return {
			clientId: select( blockEditorStore ).getSelectedBlockClientId(),
		};
	}, [] );

	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { get: getPreference } = useSelect( preferencesStore );

	useEffect( () => {
		const isDistractionFree = getPreference( 'core', 'distractionFree' );
		if ( isDistractionFree ) {
			return;
		}

		const activeGeneralSidebar = getActiveComplementaryArea( 'core' );
		const isEditorSidebarOpened = [
			'edit-post/document',
			'edit-post/block',
		].includes( activeGeneralSidebar );

		// Experiment: If the block is selected, show the block sidebar.
		// https://github.com/WordPress/gutenberg/issues/54633
		if ( clientId ) {
			enableComplementaryArea( 'core', 'edit-post/block' );
		} else if ( isEditorSidebarOpened ) {
			enableComplementaryArea( 'core', 'edit-post/document' );
		}
	}, [
		getActiveComplementaryArea,
		enableComplementaryArea,
		getPreference,
		clientId,
	] );
}

export default useAutoSwitchEditorSidebars;
