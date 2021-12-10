/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { EntitiesSavedStates } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function EditorActions() {
	const isEntitiesSavedStatesOpen = useSelect(
		( select ) => select( editSiteStore ).getIsEntitiesSavedStatesOpen(),
		[]
	);
	const { setIsEntitiesSavedStatesOpen } = useDispatch( editSiteStore );
	const openEntitiesSavedStates = useCallback(
		() => setIsEntitiesSavedStatesOpen( true ),
		[ setIsEntitiesSavedStatesOpen ]
	);
	const closeEntitiesSavedStates = useCallback(
		() => setIsEntitiesSavedStatesOpen( false ),
		[ setIsEntitiesSavedStatesOpen ]
	);

	return isEntitiesSavedStatesOpen ? (
		<EntitiesSavedStates close={ closeEntitiesSavedStates } />
	) : (
		<div className="edit-site-editor__toggle-save-panel">
			<Button
				variant="secondary"
				className="edit-site-editor__toggle-save-panel-button"
				onClick={ openEntitiesSavedStates }
				aria-expanded={ false }
			>
				{ __( 'Open save panel' ) }
			</Button>
		</div>
	);
}
