/**
 * External dependencies
 */
import { some, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { PanelBody, PanelRow, CheckboxControl } from '@wordpress/components';
import { page, layout } from '@wordpress/icons';

const ENTITY_NAME_ICONS = {
	site: layout,
	page,
};

import { __ } from '@wordpress/i18n';

function EntityRecordItem( { record, checked, onChange } ) {
	const { name, kind, title, key } = record;

	// Handle templates that might use default descriptive titles
	const entityRecordTitle = useSelect(
		( select ) => {
			if ( 'postType' !== kind || 'wp_template' !== name ) {
				return title;
			}

			const template = select( coreStore ).getEditedEntityRecord(
				kind,
				name,
				key
			);
			return select( editorStore ).__experimentalGetTemplateInfo(
				template
			).title;
		},
		[ name, kind, title, key ]
	);

	return (
		<PanelRow>
			<CheckboxControl
				label={
					<strong>{ entityRecordTitle || __( 'Untitled' ) }</strong>
				}
				checked={ checked }
				onChange={ onChange }
			/>
		</PanelRow>
	);
}

function EntityTypeList( { list, unselectedEntities, setUnselectedEntities } ) {
	const firstRecord = list[ 0 ];
	const entity = useSelect(
		( select ) =>
			select( coreStore ).getEntity( firstRecord.kind, firstRecord.name ),
		[ firstRecord.kind, firstRecord.name ]
	);

	// Set icon based on type of entity.
	const { name } = firstRecord;
	const icon = ENTITY_NAME_ICONS[ name ];

	return (
		<PanelBody title={ entity.label } initialOpen={ true } icon={ icon }>
			{ list.map( ( record ) => {
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
					/>
				);
			} ) }
		</PanelBody>
	);
}

function UnselectEntities( { value, onChange } ) {
	const { dirtyEntityRecords, postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );

		return {
			dirtyEntityRecords: select(
				coreStore
			).__experimentalGetDirtyEntityRecords(),
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	} );

	// To group entities by type.
	const partitionedSavables = Object.values(
		groupBy(
			dirtyEntityRecords.filter(
				( entity ) =>
					entity.kind !== 'postType' ||
					entity.name !== postType ||
					entity.key !== postId
			),
			'name'
		)
	);

	const setUnselectedEntities = ( { kind, name, key }, checked ) => {
		if ( checked ) {
			onChange(
				value.filter(
					( elt ) =>
						elt.kind !== kind ||
						elt.name !== name ||
						elt.key !== key
				)
			);
		} else {
			onChange( [ ...value, { kind, name, key } ] );
		}
	};

	return partitionedSavables.map( ( list ) => {
		return (
			<EntityTypeList
				key={ list[ 0 ].name }
				list={ list }
				unselectedEntities={ value }
				setUnselectedEntities={ setUnselectedEntities }
			/>
		);
	} );
}

export default UnselectEntities;
