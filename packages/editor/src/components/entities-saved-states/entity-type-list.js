/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { PanelBody } from '@wordpress/components';
import { page, layout } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import EntityRecordItem from './entity-record-item';

const ENTITY_NAME_ICONS = {
	site: layout,
	page,
};
const TRANSLATED_SITE_PROTPERTIES = {
	title: __( 'Title' ),
	description: __( 'Tagline' ),
	sitelogo: __( 'Logo' ),
	show_on_front: __( 'Show on front' ),
	page_on_front: __( 'Page on front' ),
};

export default function EntityTypeList( {
	list,
	unselectedEntities,
	setUnselectedEntities,
	closePanel,
} ) {
	const firstRecord = list[ 0 ];
	const { entity, editList } = useSelect(
		( select ) => {
			const _entity = select( 'core' ).getEntity(
				firstRecord.kind,
				firstRecord.name
			);

			// Decouple site object into its edited pieces.
			if ( 'root' === firstRecord.kind && 'site' === firstRecord.name ) {
				const siteEdits = select( 'core' ).getEntityRecordEdits(
					'root',
					'site'
				);
				const _editList = [];
				for ( const field in siteEdits ) {
					_editList.push( {
						kind: 'root',
						name: 'site',
						title: TRANSLATED_SITE_PROTPERTIES[ field ] || field,
						key: field,
					} );
				}
				return {
					entity: _entity,
					editList: _editList,
				};
			}

			return {
				entity: _entity,
				editList: list,
			};
		},
		[ firstRecord.kind, firstRecord.name ]
	);

	// Set icon based on type of entity.
	const { name } = firstRecord;
	const icon = ENTITY_NAME_ICONS[ name ];

	return (
		<PanelBody title={ entity.label } initialOpen={ true } icon={ icon }>
			{ editList.map( ( record ) => {
				return (
					<EntityRecordItem
						key={ record.key || 'site' }
						record={ record }
						checked={
							! some(
								unselectedEntities,
								( elt ) =>
									elt.kind === record.kind &&
									elt.name === record.name &&
									elt.key === record.key
							)
						}
						onChange={ ( value ) =>
							setUnselectedEntities( record, value )
						}
						closePanel={ closePanel }
					/>
				);
			} ) }
		</PanelBody>
	);
}
