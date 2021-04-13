/**
 * WordPress dependencies
 */
import { EntitiesSavedStates } from '@wordpress/editor';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { ActionsPanelFill } from '../../layout/actions-panel';
import { store as editPostStore } from '../../../store';

function TemplateSaveButton() {
	const [
		isEntitiesReviewPanelOpen,
		setIsEntitiesReviewPanelOpen,
	] = useState( false );
	const { setIsEditingTemplate } = useDispatch( editPostStore );
	return (
		<>
			<Button
				isPrimary
				onClick={ () => setIsEntitiesReviewPanelOpen( true ) }
				aria-expanded={ isEntitiesReviewPanelOpen }
			>
				{ __( 'Apply' ) }
			</Button>
			<ActionsPanelFill>
				<EntitiesSavedStates
					isOpen={ isEntitiesReviewPanelOpen }
					close={ ( entities ) => {
						setIsEntitiesReviewPanelOpen( false );
						if ( entities?.length ) {
							setIsEditingTemplate( false );
						}
					} }
				/>
			</ActionsPanelFill>
		</>
	);
}

export default TemplateSaveButton;
