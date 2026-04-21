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
	const { hasBlockSelection } = useSelect( ( select ) => {
		return {
			hasBlockSelection:
				!! select( blockEditorStore ).getBlockSelectionStart(),
		};
	}, [] );

	const { getActiveComplementaryArea } = useSelect( interfaceStore );
	const { enableComplementaryArea } = useDispatch( interfaceStore );
	const { get: getPreference } = useSelect( preferencesStore );

	useEffect( () => {
		const activeGeneralSidebar = getActiveComplementaryArea( 'core' );
		const isEditorSidebarOpened = [
			'edit-post/document',
			'edit-post/block',
		].includes( activeGeneralSidebar );
		const isDistractionFree = getPreference( 'core', 'distractionFree' );
		if ( ! isEditorSidebarOpened || isDistractionFree ) {
			return;
		}
		if ( hasBlockSelection ) {
			enableComplementaryArea( 'core', 'edit-post/block' );
		} else {
			enableComplementaryArea( 'core', 'edit-post/document' );
		}
	}, [
		hasBlockSelection,
		getActiveComplementaryArea,
		enableComplementaryArea,
		getPreference,
	] );
}

export default useAutoSwitchEditorSidebars;
