/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { EntitiesSavedStates } from '@wordpress/editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function SavePanel() {
	const { isSaveViewOpen } = useSelect( ( select ) => {
		const { isSaveViewOpened } = select( editSiteStore );

		// The currently selected entity to display.
		// Typically template or template part in the site editor.
		return {
			isSaveViewOpen: isSaveViewOpened(),
		};
	}, [] );
	const { setIsSaveViewOpened } = useDispatch( editSiteStore );

	return isSaveViewOpen ? (
		<EntitiesSavedStates close={ () => setIsSaveViewOpened( false ) } />
	) : (
		<div className="edit-site-editor__toggle-save-panel">
			<Button
				variant="secondary"
				className="edit-site-editor__toggle-save-panel-button"
				onClick={ () => setIsSaveViewOpened( true ) }
				aria-expanded={ false }
			>
				{ __( 'Open save panel' ) }
			</Button>
		</div>
	);
}
