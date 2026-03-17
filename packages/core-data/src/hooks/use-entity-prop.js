/**
 * WordPress dependencies
 */
import { useCallback, useContext } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../name';
import { DEFAULT_ENTITY_KEY } from '../entities';
import { EntityContext } from '../entity-context';
import useEntityId from './use-entity-id';

/**
 * Hook that returns the value and a setter for the
 * specified property of the nearest provided
 * entity of the specified type.
 *
 * @param {string}        kind  The entity kind.
 * @param {string}        name  The entity name.
 * @param {string}        prop  The property name.
 * @param {number|string} [_id] An entity ID to use instead of the context-provided one.
 *
 * @return {[*, Function, *]} An array where the first item is the
 *                            property value, the second is the
 *                            setter and the third is the full value
 * 							  object from REST API containing more
 * 							  information like `raw`, `rendered` and
 * 							  `protected` props.
 */
export default function useEntityProp( kind, name, prop, _id ) {
	const providerId = useEntityId( kind, name );
	const id = _id ?? providerId;
	const context = useContext( EntityContext );
	const revisionId = context?.revisionId;

	const { value, fullValue } = useSelect(
		( select ) => {
			if ( revisionId ) {
				// Use getRevisions (not getRevision) to read from the
				// already-cached collection. Using getRevision would
				// trigger a redundant single-revision API fetch that
				// can wipe the collection due to a race condition.
				// See https://github.com/WordPress/gutenberg/pull/76043.
				const revisions = select( STORE_NAME ).getRevisions(
					kind,
					name,
					id,
					{
						per_page: -1,
						context: 'edit',
						_fields:
							'id,date,author,meta,title.raw,excerpt.raw,content.raw',
					}
				);
				const entityConfig = select( STORE_NAME ).getEntityConfig(
					kind,
					name
				);
				const revKey = entityConfig?.revisionKey || DEFAULT_ENTITY_KEY;
				const revision = revisions?.find(
					( r ) => r[ revKey ] === revisionId
				);
				return revision
					? {
							value: revision[ prop ],
							fullValue: revision[ prop ],
					  }
					: {};
			}

			const { getEntityRecord, getEditedEntityRecord } =
				select( STORE_NAME );
			const record = getEntityRecord( kind, name, id ); // Trigger resolver.
			const editedRecord = getEditedEntityRecord( kind, name, id );
			return record && editedRecord
				? {
						value: editedRecord[ prop ],
						fullValue: record[ prop ],
				  }
				: {};
		},
		[ kind, name, id, prop, revisionId ]
	);
	const { editEntityRecord } = useDispatch( STORE_NAME );
	const setValue = useCallback(
		( newValue ) => {
			if ( revisionId ) {
				return;
			}
			editEntityRecord( kind, name, id, {
				[ prop ]: newValue,
			} );
		},
		[ editEntityRecord, kind, name, id, prop, revisionId ]
	);

	return [ value, setValue, fullValue ];
}
