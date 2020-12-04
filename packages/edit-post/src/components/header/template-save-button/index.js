/**
 * WordPress dependencies
 */
import { EntitiesSavedStates, store as editorStore } from '@wordpress/editor';
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

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
	const { editEntityRecord } = useDispatch( coreStore );
	const { getTemplateInfo, getEditedEntityRecord } = useSelect(
		( select ) => {
			return {
				getTemplateInfo: select( editorStore )
					.__experimentalGetTemplateInfo,
				getEditedEntityRecord: select( coreStore )
					.getEditedEntityRecord,
			};
		},
		[]
	);
	return (
		<>
			<Button onClick={ () => setIsEditingTemplate( false ) } isTertiary>
				{ __( 'Cancel' ) }
			</Button>
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
						// The logic here should be abstracted in the entities save handler/component
						// and not duplicated accross multi-entity save behavior.
						if ( entities?.length ) {
							entities.forEach( ( entity ) => {
								const edits = {};
								if (
									entity.kind === 'postType' &&
									entity.name === 'wp_template'
								) {
									const record = getEditedEntityRecord(
										entity.kind,
										entity.name,
										entity.key
									);
									edits.title =
										getTemplateInfo( record ).title ??
										entity.title ??
										record.slug;
								}

								if (
									entity.kind === 'postType' &&
									[
										'wp_template',
										'wp_template_part',
									].includes( entity.name )
								) {
									edits.status = 'publish';
								}

								editEntityRecord(
									entity.kind,
									entity.name,
									entity.key,
									edits
								);
							} );
						}
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
