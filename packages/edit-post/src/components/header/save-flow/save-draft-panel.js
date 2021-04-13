/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { close as closeIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import UnselectEntities from './unselect-entities';

function SaveDraftPanel( { onClose } ) {
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		return {
			dirtyEntityRecords: select(
				coreStore
			).__experimentalGetDirtyEntityRecords(),
		};
	} );
	const { saveEditedEntityRecord } = useDispatch( coreStore );

	const [ unselectedEntities, setUnselectedEntities ] = useState( [] );

	const onSave = () => {
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key } ) => {
				return ! some(
					unselectedEntities,
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key
				);
			}
		);

		entitiesToSave.forEach( ( { kind, name, key } ) => {
			saveEditedEntityRecord( kind, name, key );
		} );

		onClose();
	};

	// Todo changes classes.
	return (
		<div className="entities-saved-states__panel">
			<div className="entities-saved-states__panel-header">
				<Button
					isPrimary
					onClick={ onSave }
					className="editor-entities-saved-states__save-button"
				>
					{ __( 'Save' ) }
				</Button>
				<Button
					onClick={ () => onClose() }
					icon={ closeIcon }
					label={ __( 'Close panel' ) }
				/>
			</div>

			<div className="entities-saved-states__text-prompt">
				<strong>
					{ __(
						'Select the changes you want to save in addition to the edited post'
					) }
				</strong>
				<p>
					{ __(
						'Some changes may affect other areas of your site.'
					) }
				</p>
				<UnselectEntities
					value={ unselectedEntities }
					onChange={ setUnselectedEntities }
				/>
			</div>
		</div>
	);
}

export default SaveDraftPanel;
