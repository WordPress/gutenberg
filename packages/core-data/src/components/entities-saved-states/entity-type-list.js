import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PanelBody, PanelRow } from '@wordpress/components';
import { getGlobalStylesChanges } from '@wordpress/global-styles-engine';
import EntityRecordItem from './entity-record-item';
import { STORE_NAME } from '../../name';

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
				select( STORE_NAME );
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

/**
 * Describes what saving a group of attachment records will do.
 *
 * Keyed on what actually changed rather than on the entity type. An attachment
 * can be staged here for more than one reason — today a block proposing to
 * attach media the post displays, tomorrow an edit to alt text or a caption —
 * and each needs its own sentence. Anything this doesn't recognise gets no
 * description rather than a wrong one.
 *
 * It matters more for attachments than for the other entities in this panel:
 * the checkbox label is a filename, which says nothing about what saving it
 * does.
 *
 * @param {Object}   props
 * @param {Object[]} props.list The group's dirty records.
 */
function AttachmentDescription( { list } ) {
	const changes = useSelect(
		( select ) => {
			const { getEntityRecordNonTransientEdits } = select( STORE_NAME );

			return list.map( ( record ) =>
				Object.keys(
					getEntityRecordNonTransientEdits(
						record.kind,
						record.name,
						record.key
					) ?? {}
				)
					.sort()
					.join()
			);
		},
		[ list ]
	);

	// Every record in the group has to be the same kind of change for one
	// sentence to describe them all.
	const isAttaching =
		changes.length && changes.every( ( change ) => change === 'post' );

	if ( ! isAttaching ) {
		return null;
	}

	return (
		<PanelRow>
			{ 1 === changes.length
				? __(
						'Attaching this file records this post as where it is used.'
				  )
				: __(
						'Attaching these files records this post as where they are used.'
				  ) }
		</PanelRow>
	);
}

function EntityDescription( { record, count, list } ) {
	if ( 'globalStyles' === record?.name ) {
		return null;
	}
	if ( 'attachment' === record?.name ) {
		return <AttachmentDescription list={ list } />;
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
			select( STORE_NAME ).getEntityConfig(
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
			<EntityDescription
				record={ firstRecord }
				count={ count }
				list={ list }
			/>
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
