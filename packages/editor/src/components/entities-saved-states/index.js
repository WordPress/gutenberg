/**
 * WordPress dependencies
 */
import { Button, Flex, FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';
import { useIsDirty } from './hooks/use-is-dirty';

const PUBLISH_ON_SAVE_ENTITIES = [
	{
		kind: 'postType',
		name: 'wp_navigation',
	},
];

function identity( values ) {
	return values;
}

export default function EntitiesSavedStates( { close } ) {
	const isDirtyProps = useIsDirty();
	return (
		<EntitiesSavedStatesExtensible close={ close } { ...isDirtyProps } />
	);
}

export function EntitiesSavedStatesExtensible( {
	additionalPrompt = undefined,
	close,
	onSave = identity,
	saveEnabled: saveEnabledProp = undefined,
	saveLabel = __( 'Save' ),

	dirtyEntityRecords,
	isDirty,
	setUnselectedEntities,
	unselectedEntities,
} ) {
	const saveButtonRef = useRef();
	const {
		editEntityRecord,
		saveEditedEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	const { createSuccessNotice, createErrorNotice, removeNotice } =
		useDispatch( noticesStore );

	// To group entities by type.
	const partitionedSavables = dirtyEntityRecords.reduce( ( acc, record ) => {
		const { name } = record;
		if ( ! acc[ name ] ) {
			acc[ name ] = [];
		}
		acc[ name ].push( record );
		return acc;
	}, {} );

	// Sort entity groups.
	const {
		site: siteSavables,
		wp_template: templateSavables,
		wp_template_part: templatePartSavables,
		...contentSavables
	} = partitionedSavables;
	const sortedPartitionedSavables = [
		siteSavables,
		templateSavables,
		templatePartSavables,
		...Object.values( contentSavables ),
	].filter( Array.isArray );

	const saveEnabled = saveEnabledProp ?? isDirty;

	const saveCheckedEntities = () => {
		const saveNoticeId = 'site-editor-save-success';
		removeNotice( saveNoticeId );
		const entitiesToSave = dirtyEntityRecords.filter(
			( { kind, name, key, property } ) => {
				return ! unselectedEntities.some(
					( elt ) =>
						elt.kind === kind &&
						elt.name === name &&
						elt.key === key &&
						elt.property === property
				);
			}
		);

		close( entitiesToSave );

		const siteItemsToSave = [];
		const pendingSavedRecords = [];
		entitiesToSave.forEach( ( { kind, name, key, property } ) => {
			if ( 'root' === kind && 'site' === name ) {
				siteItemsToSave.push( property );
			} else {
				if (
					PUBLISH_ON_SAVE_ENTITIES.some(
						( typeToPublish ) =>
							typeToPublish.kind === kind &&
							typeToPublish.name === name
					)
				) {
					editEntityRecord( kind, name, key, { status: 'publish' } );
				}

				pendingSavedRecords.push(
					saveEditedEntityRecord( kind, name, key )
				);
			}
		} );
		if ( siteItemsToSave.length ) {
			pendingSavedRecords.push(
				saveSpecifiedEntityEdits(
					'root',
					'site',
					undefined,
					siteItemsToSave
				)
			);
		}

		__unstableMarkLastChangeAsPersistent();

		Promise.all( pendingSavedRecords )
			.then( ( values ) => {
				return onSave( values );
			} )
			.then( ( values ) => {
				if (
					values.some( ( value ) => typeof value === 'undefined' )
				) {
					createErrorNotice( __( 'Saving failed.' ) );
				} else {
					createSuccessNotice( __( 'Site updated.' ), {
						type: 'snackbar',
						id: saveNoticeId,
					} );
				}
			} )
			.catch( ( error ) =>
				createErrorNotice( `${ __( 'Saving failed.' ) } ${ error }` )
			);
	};

	// Explicitly define this with no argument passed.  Using `close` on
	// its own will use the event object in place of the expected saved entities.
	const dismissPanel = useCallback( () => close(), [ close ] );

	const [ saveDialogRef, saveDialogProps ] = useDialog( {
		onClose: () => dismissPanel(),
	} );

	return (
		<div
			ref={ saveDialogRef }
			{ ...saveDialogProps }
			className="entities-saved-states__panel"
		>
			<Flex className="entities-saved-states__panel-header" gap={ 2 }>
				<FlexItem
					isBlock
					as={ Button }
					ref={ saveButtonRef }
					variant="primary"
					disabled={ ! saveEnabled }
					onClick={ saveCheckedEntities }
					className="editor-entities-saved-states__save-button"
				>
					{ saveLabel }
				</FlexItem>
				<FlexItem
					isBlock
					as={ Button }
					variant="secondary"
					onClick={ dismissPanel }
				>
					{ __( 'Cancel' ) }
				</FlexItem>
			</Flex>

			<div className="entities-saved-states__text-prompt">
				<strong>{ __( 'Are you ready to save?' ) }</strong>
				{ additionalPrompt }
				{ isDirty && (
					<p>
						{ __(
							'The following changes have been made to your site, templates, and content.'
						) }
					</p>
				) }
			</div>

			{ sortedPartitionedSavables.map( ( list ) => {
				return (
					<EntityTypeList
						key={ list[ 0 ].name }
						list={ list }
						closePanel={ dismissPanel }
						unselectedEntities={ unselectedEntities }
						setUnselectedEntities={ setUnselectedEntities }
					/>
				);
			} ) }
		</div>
	);
}
