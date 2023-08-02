/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export function useIsSiteEditorAccessible() {
	return useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__unstableIsBlockBasedTheme &&
			select( coreStore ).canUser( 'read', 'templates' ),
		[]
	);
}
