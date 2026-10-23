import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PanelBody, PanelRow } from '@wordpress/components';
import { getGlobalStylesChanges } from '@wordpress/global-styles-engine';
import EntityRecordItem from './entity-record-item';
import { STORE_NAME } from '../../name';
import type { store as coreStore } from '../../';
import type { EntitySavedStatesRecord, EntityTypeListProps } from './types';

function getEntityDescription(
	entity: string | undefined,
	count: number
): string | void {
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

function GlobalStylesDescription( {
	record,
}: {
	record: EntitySavedStatesRecord;
} ) {
	const { editedRecord, savedRecord } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getEntityRecord } =
				// The store is selected by name, which carries no store types.
				select( STORE_NAME as unknown as typeof coreStore );
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

function EntityDescription( {
	record,
	count,
}: {
	record: EntitySavedStatesRecord;
	count: number;
} ) {
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
}: EntityTypeListProps ) {
	const count = list.length;
	const firstRecord = list[ 0 ];
	const entityConfig = useSelect(
		( select ) =>
			// The store is selected by name, which carries no store types.
			select( STORE_NAME as unknown as typeof coreStore ).getEntityConfig(
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
