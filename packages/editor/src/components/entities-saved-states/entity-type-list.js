/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { getGlobalStylesChanges } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import EntityRecordItem from './entity-record-item';

function getEntityDescription( entity, count ) {
	switch ( entity ) {
		case 'site':
			return 1 === count
				? __( 'This change will affect your whole site.' )
				: __( 'These changes will affect your whole site.' );
		case 'wp_template':
			return __(
				'This change will affect other parts of your site that use this template.'
			);
		case 'page':
		case 'post':
			return __( 'The following has been modified.' );
	}
}

function GlobalStylesDescription( { record } ) {
	const { editedRecord, savedRecord } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getEntityRecord } =
				select( coreStore );
			return {
				editedRecord: getEditedEntityRecord(
					record.kind,
					record.name,
					record.key
				),
				savedRecord: getEntityRecord(
					record.kind,
					record.name,
					record.key
				),
			};
		},
		[ record.kind, record.name, record.key ]
	);

	const globalStylesChanges = getGlobalStylesChanges(
		editedRecord,
		savedRecord,
		{
			maxResults: 10,
		}
	);
	return globalStylesChanges.length ? (
		<ul className="entities-saved-states__changes">
			{ globalStylesChanges.map( ( change ) => (
				<li key={ change }>{ change }</li>
			) ) }
		</ul>
	) : null;
}

function EntityDescription( { record, count } ) {
	if ( 'globalStyles' === record?.name ) {
		return null;
	}
	const description = getEntityDescription( record?.name, count );
	return description ? <PanelRow>{ description }</PanelRow> : null;
}

export default function EntityTypeList( {
	list,
	unselectedEntities,
	setUnselectedEntities,
} ) {
	const count = list.length;
	const firstRecord = list[ 0 ];
	const entityConfig = useSelect(
		( select ) =>
			select( coreStore ).getEntityConfig(
				firstRecord.kind,
				firstRecord.name
			),
		[ firstRecord.kind, firstRecord.name ]
	);

	let entityLabel = entityConfig.label;
	if ( firstRecord?.name === 'wp_template_part' ) {
		entityLabel =
			1 === count ? __( 'Template Part' ) : __( 'Template Parts' );
	}

	return (
		<PanelBody
			title={ entityLabel }
			initialOpen
			className="entities-saved-states__panel-body"
		>
			<EntityDescription record={ firstRecord } count={ count } />
			{ list.map( ( record ) => {
				return (
					<EntityRecordItem
						key={ record.key || record.property }
						record={ record }
						checked={
							! unselectedEntities.some(
								( elt ) =>
									elt.kind === record.kind &&
									elt.name === record.name &&
									elt.key === record.key &&
									elt.property === record.property
							)
						}
						onChange={ ( value ) =>
							setUnselectedEntities( record, value )
						}
					/>
				);
			} ) }
			{ 'globalStyles' === firstRecord?.name && (
				<GlobalStylesDescription record={ firstRecord } />
			) }
		</PanelBody>
	);
}
