/**
 * WordPress dependencies
 */
import { Button, Flex, FlexItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { store as noticesStore } from '@wordpress/notices';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import EntityTypeList from './entity-type-list';

const TRANSLATED_SITE_PROPERTIES = {
	title: __( 'Title' ),
	description: __( 'Tagline' ),
	site_logo: __( 'Logo' ),
	site_icon: __( 'Icon' ),
	show_on_front: __( 'Show on front' ),
	page_on_front: __( 'Page on front' ),
};

const PUBLISH_ON_SAVE_ENTITIES = [
	{
		kind: 'postType',
		name: 'wp_navigation',
	},
];

function identity( values ) {
	return values;
}

function isPreviewingTheme() {
	return (
		window?.__experimentalEnableThemePreviews &&
		getQueryArg( window.location.href, 'theme_preview' ) !== undefined
	);
}

function currentlyPreviewingTheme() {
	if ( isPreviewingTheme() ) {
		return getQueryArg( window.location.href, 'theme_preview' );
	}
	return null;
}

export default function EntitiesSavedStates( { close, onSave = identity } ) {
	const saveButtonRef = useRef();
	const { getTheme } = useSelect( coreStore );
	const theme = getTheme( currentlyPreviewingTheme() );
	const { dirtyEntityRecords } = useSelect( ( select ) => {
		const dirtyRecords =
			select( coreStore ).__experimentalGetDirtyEntityRecords();

		// Remove site object and decouple into its edited pieces.
		const dirtyRecordsWithoutSite = dirtyRecords.filter(
			( record ) => ! ( record.kind === 'root' && record.name === 'site' )
		);

		const siteEdits = select( coreStore ).getEntityRecordEdits(
			'root',
			'site'
		);

		const siteEditsAsEntities = [];
		for ( const property in siteEdits ) {
			siteEditsAsEntities.push( {
				kind: 'root',
				name: 'site',
				title: TRANSLATED_SITE_PROPERTIES[ property ] || property,
				property,
			} );
		}
		const dirtyRecordsWithSiteItems = [
			...dirtyRecordsWithoutSite,
			...siteEditsAsEntities,
		];

		return {
			dirtyEntityRecords: dirtyRecordsWithSiteItems,
		};
	}, [] );
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

	// Unchecked entities to be ignored by save function.
	const [ unselectedEntities, _setUnselectedEntities ] = useState( [] );

	const setUnselectedEntities = (
		{ kind, name, key, property },
		checked
	) => {
		if ( checked ) {
			_setUnselectedEntities(
				unselectedEntities.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key ||
						elt.property !== property
				)
			);
		} else {
			_setUnselectedEntities( [
				...unselectedEntities,
				{ kind, name, key, property },
			] );
		}
	};

	const saveCheckedEntitiesAndActivate = () => {
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

	const isDirty = dirtyEntityRecords.length - unselectedEntities.length > 0;
	const activateSaveEnabled = isPreviewingTheme() || isDirty;

	let activateSaveLabel;
	if ( isPreviewingTheme() && isDirty ) {
		activateSaveLabel = __( 'Activate & Save' );
	} else if ( isPreviewingTheme() ) {
		activateSaveLabel = __( 'Activate' );
	} else {
		activateSaveLabel = __( 'Save' );
	}

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
					disabled={ ! activateSaveEnabled }
					onClick={ saveCheckedEntitiesAndActivate }
					className="editor-entities-saved-states__save-button"
				>
					{ activateSaveLabel }
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
				{ isPreviewingTheme() && (
					<p>
						{ sprintf(
							'Saving your changes will change your active theme to  %1$s.',
							theme?.name?.rendered
						) }
					</p>
				) }
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
