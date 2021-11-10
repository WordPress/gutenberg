/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { Fragment, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EntityRecordItem from './entity-record-item';

export default function DiscardEntityChangesPanel( { closePanel, savables } ) {
	const {
		__experimentalResetEditedEntityRecord: resetEditedEntityRecord,
		__experimentalResetSpecifiedEntityEdits: resetSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	// Unchecked entities to be ignored by discard function.
	const [ selectedEntities, _setSelectedEntities ] = useState( [] );

	const setSelectedEntities = ( { kind, name, key, property }, checked ) => {
		if ( ! checked ) {
			_setSelectedEntities(
				selectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key ||
						elt.property !== property
				)
			);
		} else {
			_setSelectedEntities( [
				...selectedEntities,
				{ kind, name, key, property },
			] );
		}
	};

	const discardCheckedEntities = () => {
		closePanel();

		const siteItemsToDiscard = [];
		selectedEntities.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				siteItemsToDiscard.push( property );
			} else {
				resetEditedEntityRecord( kind, name, key );
			}
		} );
		resetSpecifiedEntityEdits(
			'root',
			'site',
			undefined,
			siteItemsToDiscard
		);
	};

	return (
		<Fragment>
			<div className="entities-saved-states__discard-changes-panel">
				<div className="entities-saved-states__text-prompt">
					<strong>{ __( "What's next?" ) }</strong>
					<p>
						{ __(
							'Your template still has some unsaved changes.'
						) }
					</p>
					<p>
						{ __(
							'You can select them and discard their changes, or continue editing and deal with them later.'
						) }
					</p>
				</div>

				<PanelBody initialOpen={ true }>
					{ savables.map( ( record ) => {
						return (
							<EntityRecordItem
								key={ record.key || record.property }
								record={ record }
								checked={ some(
									selectedEntities,
									( elt ) =>
										elt.kind === record.kind &&
										elt.name === record.name &&
										elt.key === record.key &&
										elt.property === record.property
								) }
								onChange={ ( value ) =>
									setSelectedEntities( record, value )
								}
								//closePanel={ closePanel }
							/>
						);
					} ) }
					<PanelRow>
						<Button
							disabled={ selectedEntities.length === 0 }
							isDestructive
							onClick={ discardCheckedEntities }
						>
							{ __( 'Discard changes' ) }
						</Button>
					</PanelRow>
				</PanelBody>
			</div>

			<div className="entities-saved-states__footer">
				<Button onClick={ closePanel } variant="primary">
					<span>{ __( 'Continue editing' ) }</span>
				</Button>
			</div>
		</Fragment>
	);
}
