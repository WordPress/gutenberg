/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EntityRecordItem from './entity-record-item';

function getEntityDescription( entity, length ) {
	switch ( entity ) {
		case 'site':
			return _n(
				'This change will affect your whole site.',
				'These changes will affect your whole site.',
				length
			);
		case 'wp_template':
			return _n(
				'This change will affect pages and posts that use this template.',
				'These changes will affect pages and posts that use these templates.',
				length
			);
		case 'page':
		case 'post':
			return __( 'The following content has been modified.' );
	}
}

export default function EntityTypeList( {
	list,
	unselectedEntities,
	setUnselectedEntities,
	closePanel,
} ) {
	const firstRecord = list[ 0 ];
	const entityConfig = useSelect(
		( select ) =>
			select( coreStore ).getEntityConfig(
				firstRecord.kind,
				firstRecord.name
			),
		[ firstRecord.kind, firstRecord.name ]
	);
	const { name } = firstRecord;
	const entityLabel =
		name === 'wp_template_part'
			? _n( 'Template Part', 'Template Parts', list.length )
			: entityConfig.label;
	// Set description based on type of entity.
	const description = getEntityDescription( name, list.length );

	return (
		<PanelBody title={ entityLabel } initialOpen={ true }>
			{ description && <PanelRow>{ description }</PanelRow> }
			{ list.map( ( record ) => {
				return (
					<EntityRecordItem
						key={ record.key || record.property }
						record={ record }
						checked={
							! some(
								unselectedEntities,
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
						closePanel={ closePanel }
					/>
				);
			} ) }
		</PanelBody>
	);
}
