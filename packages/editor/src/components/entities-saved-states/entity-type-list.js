/**
 * External dependencies
 */
import { some } from 'lodash';

/**
 * WordPress dependencies
 */
import { _n } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import EntityRecordItem from './entity-record-item';

const ENTITY_NAME_DESCRIPTIONS = {
	site: ( length ) =>
		_n(
			'This change will affect your whole site.',
			'These changes will affect your whole site.',
			length
		),
	wp_template: ( length ) =>
		_n(
			'This change will affect pages and posts that use this template.',
			'These changes will affect pages and posts that use these templates.',
			length
		),
};

export default function EntityTypeList( {
	list,
	unselectedEntities,
	setUnselectedEntities,
	closePanel,
} ) {
	const firstRecord = list[ 0 ];
	const entity = useSelect(
		( select ) =>
			select( coreStore ).getEntity( firstRecord.kind, firstRecord.name ),
		[ firstRecord.kind, firstRecord.name ]
	);

	// Set description based on type of entity.
	const { name } = firstRecord;
	const description = ENTITY_NAME_DESCRIPTIONS[ name ]?.( list.length );

	return (
		<PanelBody title={ entity.label } initialOpen={ true }>
			{ description ? <PanelRow>{ description }</PanelRow> : null }
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
